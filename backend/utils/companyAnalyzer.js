import axios from "axios";

// ─── RAG Knowledge Base ───────────────────────────────────────────────────────
// Curated rules about what makes a legitimate vs fraudulent company on a job portal.
// Gemini uses this as grounding context before analysing the specific company.

const RAG_KNOWLEDGE_BASE = `
## Legitimate Company Signals
- Has a professional website that uses HTTPS
- Uses an official company email domain that matches the website domain (e.g. hr@acme.com + acme.com)
- Has a verifiable LinkedIn company page
- Provides a GST number (India) or CIN number — these are publicly verifiable
- Company name matches the brand on the website and LinkedIn
- Description is specific and professional, not vague or copied
- Location is a real, specific city/region
- The company has a clear business purpose (IT services, manufacturing, recruitment, etc.)

## Fraudulent / Suspicious Company Signals
- Uses personal email domains (Gmail, Yahoo, Hotmail, Outlook) as official company email
- Website domain does not match the company email domain
- No website at all, or website is a plain landing page with no real content
- No LinkedIn, GST, or CIN — zero verifiable credentials
- Company name sounds generic or is designed to look like a well-known brand (e.g. "Infosys Jobs Pvt", "TCS Hiring", "Amazon Recuiters")
- Description is vague ("we provide best opportunities", "100% placement guaranteed")
- Claims impossibly high salaries for entry-level roles
- No verifiable physical address
- Multiple red flags stacked together

## Indian Business Legitimacy Context
- GST (Goods and Services Tax) number: 15-character alphanumeric, verifiable on GST portal
- CIN (Company Identification Number): 21-character code assigned by MCA (Ministry of Corporate Affairs)
- Legitimate Indian companies generally have at least one of these for hiring
- .co.in, .in, .com, .org, .net, .io are common for legit Indian tech companies
- Avoid companies whose email uses free providers for "official" communication

## Verdict Scale
- LEGITIMATE (80-100): Multiple strong signals — HTTPS website, domain match, LinkedIn, GST/CIN present
- LIKELY LEGITIMATE (60-79): Most signals present, minor gaps (no GST but has website + LinkedIn)
- UNCERTAIN (40-59): Mixed signals — some red flags, some positive indicators, needs more verification
- SUSPICIOUS (20-39): Multiple red flags — missing most credentials, vague info
- FRAUDULENT (0-19): Almost all fraud indicators present — no website, personal email, generic name, no credentials
`;

// ─── Gemini call ──────────────────────────────────────────────────────────────
const callGemini = async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model  = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            systemInstruction: {
                parts: [{ text: `You are a company legitimacy verification expert for an Indian job portal. You use the provided knowledge base to assess whether a company is real and trustworthy. Always return ONLY valid JSON — no markdown, no explanation outside the JSON.` }],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 600,
                responseMimeType: "application/json",
            },
        },
        {
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            timeout: 25000,
        }
    );

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Empty Gemini response");
    return raw;
};

// ─── Build prompt ─────────────────────────────────────────────────────────────
const buildPrompt = (company) => {
    const fields = [
        `Company Name: ${company.name || "N/A"}`,
        `Description: ${company.description || "N/A"}`,
        `Website: ${company.website || "N/A"}`,
        `Website uses HTTPS: ${company.isWebsiteHttps ? "Yes" : "No"}`,
        `Location: ${company.location || "N/A"}`,
        `Official Company Email: ${company.companyEmail || "N/A"}`,
        `Email Domain: ${company.emailDomain || "N/A"}`,
        `Website Domain: ${company.websiteDomain || "N/A"}`,
        `Email Domain Matches Website: ${company.isDomainMatched ? "Yes" : "No"}`,
        `Company Email Verified via OTP: ${company.isEmailVerified ? "Yes" : "No"}`,
        `LinkedIn URL: ${company.linkedinUrl || "N/A"}`,
        `GST Number: ${company.gstNumber || "N/A"}`,
        `CIN Number: ${company.cinNumber || "N/A"}`,
        `Trust Score (rule-based, 0-100): ${company.trustScore ?? 0}`,
    ].join("\n");

    return `## Knowledge Base (use as grounding context):
${RAG_KNOWLEDGE_BASE}

---

## Company to Analyse:
${fields}

---

## Task:
Based on the knowledge base above and the company data provided, assess whether this company is legitimate.

Return ONLY this JSON shape:
{
  "legitimacyScore": <integer 0-100>,
  "verdict": "legitimate" | "likely_legitimate" | "uncertain" | "suspicious" | "fraudulent",
  "confidence": "high" | "medium" | "low",
  "positiveSignals": ["signal 1", "signal 2"],
  "redFlags": ["flag 1", "flag 2"],
  "recommendation": "approve" | "investigate" | "reject",
  "summary": "<2 sentence honest assessment>"
}

Rules:
- legitimacyScore 80-100 → verdict: "legitimate"
- legitimacyScore 60-79  → verdict: "likely_legitimate"
- legitimacyScore 40-59  → verdict: "uncertain"
- legitimacyScore 20-39  → verdict: "suspicious"
- legitimacyScore 0-19   → verdict: "fraudulent"
- recommendation "approve" only if verdict is legitimate or likely_legitimate
- recommendation "reject" only if verdict is suspicious or fraudulent
- recommendation "investigate" for uncertain
- Be specific in positiveSignals and redFlags — reference actual field values
- If most fields are N/A or missing, that itself is a red flag
`;
};

// ─── Parse response ───────────────────────────────────────────────────────────
const parseResponse = (raw) => {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed  = JSON.parse(cleaned);

    const score    = Math.min(100, Math.max(0, Number(parsed.legitimacyScore) || 0));
    const verdicts = ["legitimate", "likely_legitimate", "uncertain", "suspicious", "fraudulent"];
    const recs     = ["approve", "investigate", "reject"];

    return {
        legitimacyScore : score,
        verdict         : verdicts.includes(parsed.verdict) ? parsed.verdict : deriveVerdict(score),
        confidence      : ["high","medium","low"].includes(parsed.confidence) ? parsed.confidence : "medium",
        positiveSignals : Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals.filter(Boolean) : [],
        redFlags        : Array.isArray(parsed.redFlags)        ? parsed.redFlags.filter(Boolean)        : [],
        recommendation  : recs.includes(parsed.recommendation) ? parsed.recommendation : "investigate",
        summary         : typeof parsed.summary === "string"    ? parsed.summary                         : "",
        usedAI          : true,
        analyzedAt      : new Date().toISOString(),
    };
};

const deriveVerdict = (score) => {
    if (score >= 80) return "legitimate";
    if (score >= 60) return "likely_legitimate";
    if (score >= 40) return "uncertain";
    if (score >= 20) return "suspicious";
    return "fraudulent";
};

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Analyse a company's legitimacy using Gemini + RAG knowledge base.
 *
 * @param {object} company - Mongoose company document (or plain object)
 * @returns {object} { legitimacyScore, verdict, confidence, positiveSignals, redFlags, recommendation, summary, usedAI, analyzedAt }
 */
export const analyzeCompanyLegitimacy = async (company) => {
    try {
        const prompt = buildPrompt(company);
        const raw    = await callGemini(prompt);
        return parseResponse(raw);
    } catch (err) {
        console.error("[CompanyAnalyzer] Gemini call failed:", err.message);

        // Graceful fallback — derive a basic verdict from the existing rule-based trustScore
        const score   = company.trustScore ?? 0;
        return {
            legitimacyScore : score,
            verdict         : deriveVerdict(score),
            confidence      : "low",
            positiveSignals : [],
            redFlags        : ["AI analysis unavailable — falling back to rule-based trust score only."],
            recommendation  : score >= 60 ? "approve" : score >= 40 ? "investigate" : "reject",
            summary         : `AI analysis failed (${err.message}). Verdict is based on the rule-based trust score of ${score}/100.`,
            usedAI          : false,
            analyzedAt      : new Date().toISOString(),
        };
    }
};
