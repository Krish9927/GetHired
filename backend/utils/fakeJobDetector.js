import axios from "axios";

// ─── Tier 1: Hard scam phrases — instant flag, no AI needed ──────────────────
// These are unambiguous fraud signals. A single match = suspicious.
const HARD_SCAM_PHRASES = [
    "registration fee",
    "pay first",
    "security deposit",
    "processing fee",
    "training fee",
    "joining fee",
    "refundable deposit",
    "advance payment",
    "send money",
    "wire transfer",
    "western union",
    "moneygram",
    "money gram",
    "whatsapp only",
    "pay to apply",
    "investment required",
    "buy our kit",
    "purchase starter kit",
];

// ─── Tier 2: Soft / ambiguous signals — accumulate a score ───────────────────
// These are common in scam postings but can appear in legit jobs too.
// Each match adds to a soft score; threshold decides if Gemini is called.
const SOFT_SIGNALS = [
    { phrase: "work from home", weight: 10 },
    { phrase: "earn per day", weight: 20 },
    { phrase: "earn daily", weight: 20 },
    { phrase: "no experience required", weight: 10 },
    { phrase: "no experience needed", weight: 10 },
    { phrase: "guaranteed income", weight: 25 },
    { phrase: "guaranteed job", weight: 25 },
    { phrase: "100% placement", weight: 20 },
    { phrase: "immediate joining bonus", weight: 15 },
    { phrase: "part time earn", weight: 20 },
    { phrase: "data entry earn", weight: 20 },
    { phrase: "typing work", weight: 15 },
    { phrase: "online survey", weight: 15 },
    { phrase: "mlm", weight: 25 },
    { phrase: "multi level marketing", weight: 25 },
    { phrase: "network marketing", weight: 15 },
    { phrase: "refer and earn", weight: 15 },
    { phrase: "earn from home", weight: 15 },
    { phrase: "passive income", weight: 15 },
    { phrase: "unlimited earning", weight: 20 },
    { phrase: "be your own boss", weight: 10 },
    { phrase: "no interview", weight: 20 },
    { phrase: "selected immediately", weight: 15 },
    { phrase: "apply now limited seats", weight: 10 },
    { phrase: "urgent hiring", weight: 5 },
    { phrase: "lakhs per month", weight: 20 },
    { phrase: "crore per year", weight: 15 },
];

// Soft score thresholds
const SOFT_SCORE_CLEAN_MAX = 15;  // below this → skip Gemini, mark safe
const SOFT_SCORE_BORDERLINE = 40;  // 16–40  → call Gemini (uncertain)
// above 40  → flag as suspicious immediately (enough soft signals stacked)

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Hybrid fake-job detector.
 *
 * Flow:
 *   1. Check hard phrases  → instant suspicious if any match
 *   2. Tally soft signals  → compute a soft risk score
 *      a. score ≤ CLEAN_MAX          → mark safe, skip Gemini
 *      b. score > BORDERLINE_THRESH  → mark suspicious, skip Gemini
 *      c. CLEAN_MAX < score ≤ BORDER → call Gemini for semantic verdict
 *
 * Returns:
 * {
 *   isSuspicious:     boolean,
 *   suspiciousReasons: string[],   // phrase matches + AI reasons
 *   aiConfidenceScore: number,     // 0–100 (0 if AI not called)
 *   aiVerdict:        "safe" | "suspicious" | "likely_fake" | "skipped",
 *   detectionMethod:  "keyword" | "ai" | "hybrid" | "none",
 * }
 */
export const detectFakeJob = async (jobData) => {
    const { title = "", description = "", requirements = "", salary, companyName = "", location = "", jobType = "", experience = "" } = jobData;
    const fullText = `${title} ${description} ${requirements}`.toLowerCase();

    // ── Step 1: Hard phrase check ─────────────────────────────────────────────
    const hardMatches = HARD_SCAM_PHRASES.filter((p) => fullText.includes(p));
    if (hardMatches.length > 0) {
        return {
            isSuspicious: true,
            suspiciousReasons: hardMatches.map((p) => `Contains prohibited phrase: "${p}"`),
            aiConfidenceScore: 95,
            aiVerdict: "likely_fake",
            detectionMethod: "keyword",
        };
    }

    // ── Step 2: Soft signal scoring ───────────────────────────────────────────
    const softMatches = SOFT_SIGNALS.filter((s) => fullText.includes(s.phrase));
    const softScore = softMatches.reduce((sum, s) => sum + s.weight, 0);
    const softReasons = softMatches.map((s) => `Soft signal detected: "${s.phrase}"`);

    // Clean — no need for AI
    if (softScore <= SOFT_SCORE_CLEAN_MAX) {
        return {
            isSuspicious: false,
            suspiciousReasons: [],
            aiConfidenceScore: 0,
            aiVerdict: "skipped",
            detectionMethod: "none",
        };
    }

    // Too many soft signals stacked — flag directly without Gemini
    if (softScore > SOFT_SCORE_BORDERLINE) {
        return {
            isSuspicious: true,
            suspiciousReasons: softReasons,
            aiConfidenceScore: Math.min(softScore, 90),
            aiVerdict: "suspicious",
            detectionMethod: "keyword",
        };
    }

    // ── Step 3: Borderline — call Gemini ──────────────────────────────────────
    const aiResult = await callGemini({ title, description, requirements, salary, companyName, location, jobType, experience, softSignalsFound: softReasons });

    // Merge keyword soft reasons with AI reasons
    const allReasons = [...softReasons, ...aiResult.reasons];
    const isSuspicious = aiResult.verdict !== "safe";

    return {
        isSuspicious,
        suspiciousReasons: allReasons,
        aiConfidenceScore: aiResult.confidenceScore,
        aiVerdict: aiResult.verdict,
        detectionMethod: isSuspicious ? "hybrid" : "ai",
    };
};

// ─── Gemini integration ───────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a strict fake-job-listing detection model for a job portal in India.
You will receive a job posting along with soft-signal keywords already flagged by a rule-based system.
Your task is to do a SEMANTIC analysis — decide if the overall posting is fraudulent or legitimate.

Return ONLY a valid JSON object. No markdown, no explanation outside the JSON.

Required shape:
{
  "confidenceScore": number,
  "verdict": "safe" | "suspicious" | "likely_fake",
  "reasons": string[]
}

Scoring:
- confidenceScore: 0 = definitely real, 100 = definitely fake
- "safe":        0–29
- "suspicious":  30–59
- "likely_fake": 60–100

Evaluate:
- Is the salary realistic for the role and experience level in India?
- Does the description have real responsibilities, or is it vague/copy-pasted?
- Is there any hidden fee, deposit, or equipment-purchase angle?
- Does the role sound like MLM, chain referral, or pyramid scheme?
- Is the job title consistent with the description?
- Weigh the soft signals already found — do they form a pattern in context?

Be concise. Return empty reasons array if the job appears legitimate.`;

const buildPrompt = ({ title, description, requirements, salary, companyName, location, jobType, experience, softSignalsFound }) => `
Job Posting to Analyze:

Title: ${title || "N/A"}
Company: ${companyName || "N/A"}
Location: ${location || "N/A"}
Job Type: ${jobType || "N/A"}
Experience Required: ${experience || "N/A"}
Salary: ${salary !== undefined ? salary : "N/A"}
Requirements: ${requirements || "N/A"}

Description:
${description || "N/A"}

Rule-based soft signals already detected (for context):
${softSignalsFound.length ? softSignalsFound.join("\n") : "None"}
`.trim();

const callGemini = async (jobData) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
        console.warn("[FakeJobDetector] GEMINI_API_KEY not set — skipping AI analysis.");
        return { confidenceScore: 0, verdict: "safe", reasons: [] };
    }

    try {
        const { data } = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [{ role: "user", parts: [{ text: buildPrompt(jobData) }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 400,
                    responseMimeType: "application/json",
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                timeout: 20000,
            }
        );

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Empty response from Gemini");

        return parseGeminiResponse(rawText);
    } catch (err) {
        console.error("[FakeJobDetector] Gemini call failed:", err.message);
        // Non-blocking — treat as safe so job posting is not disrupted
        return { confidenceScore: 0, verdict: "safe", reasons: [] };
    }
};

const parseGeminiResponse = (rawText) => {
    try {
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const confidenceScore = clamp(Number(parsed.confidenceScore) || 0, 0, 100);
        const verdict = deriveVerdict(confidenceScore, parsed.verdict);
        const reasons = Array.isArray(parsed.reasons)
            ? parsed.reasons.filter((r) => typeof r === "string" && r.trim())
            : [];

        return { confidenceScore, verdict, reasons };
    } catch (e) {
        console.error("[FakeJobDetector] JSON parse error:", e.message);
        return { confidenceScore: 0, verdict: "safe", reasons: [] };
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const deriveVerdict = (score, raw) => {
    if (score >= 60) return "likely_fake";
    if (score >= 30) return "suspicious";
    if (["safe", "suspicious", "likely_fake"].includes(raw)) return raw;
    return "safe";
};
