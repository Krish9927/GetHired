// Basic rule-based chatbot — no external API needed
const FAQ = [
    {
        keywords: ["verify", "email", "otp"],
        reply: "To verify your email, go to Profile → Verification section → click 'Verify now' → enter the OTP sent to your email.",
        suggestions: ["What is trust score?", "How to upload resume?"],
    },
    {
        keywords: ["trust score", "trust"],
        reply: "Your Trust Score (0-100) is based on: email verified (+20), college email (+15), resume uploaded (+15), ATS score ≥60 (+10), LinkedIn (+10), GitHub (+10), CGPA proof (+10), profile ≥80% (+10).",
        suggestions: ["How to improve ATS score?", "How to verify email?"],
    },
    {
        keywords: ["ats", "resume score", "resume"],
        reply: "ATS Score measures how well your resume matches job requirements. Upload a PDF resume in Profile. Score above 60 unlocks premium jobs. Tips: add skills, projects, education, and quantify achievements.",
        suggestions: ["What is trust score?", "How to apply for jobs?"],
    },
    {
        keywords: ["apply", "job", "application"],
        reply: "To apply for a job: 1) Browse jobs in the Jobs tab, 2) Click on a job, 3) Click 'Apply Now'. Make sure your profile is complete and email is verified for full access.",
        suggestions: ["How to complete profile?", "What is CGPA eligibility?"],
    },
    {
        keywords: ["cgpa", "eligibility"],
        reply: "Some jobs require a minimum CGPA. You can add your CGPA in Profile → Verification → Academic Info. Upload your marksheet as proof to boost your trust score.",
        suggestions: ["How to apply for jobs?", "What is trust score?"],
    },
    {
        keywords: ["profile", "complete", "completeness"],
        reply: "Complete your profile by adding: bio, skills, resume, profile photo, GitHub URL, LinkedIn URL, college name, and CGPA. A complete profile increases your trust score and job eligibility.",
        suggestions: ["How to verify email?", "How to upload resume?"],
    },
    {
        keywords: ["github", "linkedin", "social"],
        reply: "Add your GitHub and LinkedIn URLs in Profile → Verification → Social Profiles section. Each link adds +10 to your trust score.",
        suggestions: ["What is trust score?", "How to complete profile?"],
    },
    {
        keywords: ["badge", "verified", "candidate"],
        reply: "You receive a 'Verified Candidate' badge when your Trust Score reaches 60 and your email is verified. This badge is shown to recruiters on your applications.",
        suggestions: ["What is trust score?", "How to verify email?"],
    },
    {
        keywords: ["forgot", "password", "reset"],
        reply: "To reset your password: click 'Forgot password?' on the login page → enter your email → check your inbox for an OTP → enter the OTP → set a new password.",
        suggestions: ["How to login?", "How to verify email?"],
    },
    {
        keywords: ["hello", "hi", "hey", "help"],
        reply: "Hi! I'm the GetHired assistant 👋 I can help you with profile verification, resume tips, job applications, and more. What do you need help with?",
        suggestions: ["How to verify email?", "What is trust score?", "How to apply for jobs?"],
    },
];

const DEFAULT_REPLY = "I'm not sure about that. Here are some things I can help with:";
const DEFAULT_SUGGESTIONS = ["How to verify email?", "What is trust score?", "How to apply for jobs?", "How to complete profile?"];

const findReply = (message) => {
    const lower = message.toLowerCase();
    for (const item of FAQ) {
        if (item.keywords.some((kw) => lower.includes(kw))) {
            return { reply: item.reply, suggestions: item.suggestions };
        }
    }
    return { reply: DEFAULT_REPLY, suggestions: DEFAULT_SUGGESTIONS };
};

export const getWelcome = (req, res) => {
    res.json({
        success: true,
        reply: "Hi! I'm the GetHired assistant 👋 I can help you with email verification, resume tips, job applications, trust scores, and more. What do you need help with?",
        suggestions: ["How to verify email?", "What is trust score?", "How to apply for jobs?"],
        isAI: false,
    });
};

export const sendMessage = (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message required" });
    const { reply, suggestions } = findReply(message);
    res.json({ success: true, reply, suggestions, isAI: false });
};
