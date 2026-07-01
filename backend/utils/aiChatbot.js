import axios from "axios";
import { generateReply as generateFallbackReply } from "./studentChatbot.js";

const PORTAL_KNOWLEDGE = `
You are GetHired Assistant, a helpful AI chatbot for students on the GetHired job portal.

Your job is to help students with:
- Email verification (OTP sent from Profile → Verification)
- Trust score (0-100): email verified (20), college email (15), resume (15), ATS ≥60 (10), LinkedIn (10), GitHub (10), CGPA proof (10), profile ≥80% (10). Need 60+ trust + verified email to be fully verified.
- ATS resume score: upload resume in Profile, recalculate in Verification
- Profile completion: bio, skills, resume, photo, GitHub, LinkedIn, college, CGPA at /profile
- Job applications: browse /jobs or /browse, open job, click Apply Now
- Application status: view at Profile → Applied Jobs (pending/accepted/rejected)
- CGPA requirements: some jobs have minimum CGPA
- Eligibility: must verify email, profile ≥50%, ATS ≥60 for premium jobs

Keep answers concise (2-4 short paragraphs max), friendly, and actionable.
Use the student's profile data when available to personalize answers.
If the student is not logged in, give general guidance and suggest logging in for personalized help.
Never make up application statuses or scores — only use data provided in STUDENT CONTEXT.
Do not discuss topics unrelated to career, jobs, or this portal.
`;

const buildSystemPrompt = (context) => {
    let prompt = PORTAL_KNOWLEDGE;

    if (context.isLoggedIn) {
        prompt += `\n\nSTUDENT CONTEXT (use this to personalize):\n${JSON.stringify(context, null, 2)}`;
    } else {
        prompt += "\n\nSTUDENT CONTEXT: Guest user (not logged in).";
    }

    prompt += `\n\nAt the end of every response, on a new line, add exactly 3 short follow-up questions the student might ask, in this format:
SUGGESTIONS: question1 | question2 | question3`;

    return prompt;
};

const parseAIResponse = (text) => {
    const suggestionsMatch = text.match(/SUGGESTIONS:\s*(.+)$/im);
    let reply = text;
    let suggestions = [];

    if (suggestionsMatch) {
        reply = text.replace(/SUGGESTIONS:\s*.+$/im, "").trim();
        suggestions = suggestionsMatch[1]
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3);
    }

    if (!suggestions.length) {
        suggestions = [
            "How do I verify my email?",
            "How to improve my resume?",
            "Check my application status",
        ];
    }

    return { reply, suggestions };
};

const formatHistoryForOpenAI = (history = []) =>
    history
        .filter((m) => m.role === "user" || m.role === "bot")
        .map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.content,
        }));

const formatHistoryForGemini = (history = []) => {
    const formatted = history
        .filter((m) => m.role === "user" || m.role === "bot")
        .map((m) => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    // Gemini requires conversation history to start with a user turn
    while (formatted.length && formatted[0].role === "model") {
        formatted.shift();
    }

    return formatted;
};

const callOpenAI = async (systemPrompt, history, message) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const messages = [
        { role: "system", content: systemPrompt },
        ...formatHistoryForOpenAI(history),
        { role: "user", content: message },
    ];

    const { data } = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        { model, messages, temperature: 0.7, max_tokens: 600 },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        }
    );

    return data.choices[0].message.content;
};

const callGemini = async (systemPrompt, history, message) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const contents = [
        ...formatHistoryForGemini(history),
        { role: "user", parts: [{ text: message }] },
    ];

    const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            timeout: 30000,
        }
    );

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text;
};

const getProvider = () => {
    if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY?.trim()) return "openai";
    if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
    if (process.env.OPENAI_API_KEY?.trim()) return "openai";
    return null;
};

export const isAIEnabled = () => !!getProvider();

export const generateAIReply = async (message, context = {}, history = []) => {
    const provider = getProvider();

    if (!provider) {
        return { ...generateFallbackReply(message, context), usedAI: false };
    }

    const systemPrompt = buildSystemPrompt(context);

    try {
        const rawText =
            provider === "openai"
                ? await callOpenAI(systemPrompt, history, message)
                : await callGemini(systemPrompt, history, message);

        const { reply, suggestions } = parseAIResponse(rawText);
        return { reply, suggestions, usedAI: true };
    } catch (error) {
        const apiError = error.response?.data?.error?.message || error.message;
        console.error("AI chatbot error:", apiError);

        if (apiError?.includes("quota") || apiError?.includes("Quota")) {
            return {
                reply: "The AI service has hit its usage limit for now. Please try again in a minute, or contact support if this keeps happening.",
                suggestions: ["How do I verify my email?", "How to apply for jobs?"],
                usedAI: false,
            };
        }

        const fallback = generateFallbackReply(message, context);
        return {
            ...fallback,
            usedAI: false,
            reply: `${fallback.reply}\n\n(AI is temporarily unavailable — showing cached guidance.)`,
        };
    }
};
