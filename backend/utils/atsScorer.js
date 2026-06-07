import axios from "axios";
import cloudinary from "./cloudinary.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // v1.1.1 exports the function directly

// ── Section headings ──────────────────────────────────────────────────────────
const SECTION_KEYWORDS = [
    "education", "experience", "skills", "projects", "certifications",
    "achievements", "summary", "objective", "internship", "work experience",
    "academic", "courses", "coursework", "awards", "publications",
    "volunteer", "extracurricular", "languages", "interests",
];

// ── Technical keywords ────────────────────────────────────────────────────────
const TECH_KEYWORDS = [
    "javascript", "python", "java", "c++", "c#", "typescript", "kotlin",
    "swift", "go", "rust", "php", "ruby", "scala", "r", "matlab",
    "react", "angular", "vue", "html", "css", "tailwind", "bootstrap",
    "nextjs", "next.js", "redux", "webpack",
    "node", "express", "django", "flask", "spring", "fastapi", "laravel",
    "rest", "graphql", "microservices", "api",
    "sql", "mysql", "postgresql", "mongodb", "redis", "firebase",
    "elasticsearch", "dynamodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins",
    "terraform", "linux", "bash", "git", "github", "gitlab",
    "machine learning", "deep learning", "tensorflow", "pytorch", "pandas",
    "numpy", "data analysis", "nlp", "computer vision", "tableau",
    "developed", "built", "implemented", "designed", "optimized", "deployed",
    "integrated", "managed", "led", "created", "improved", "automated",
];

const ACTION_VERBS = [
    "achieved", "delivered", "launched", "spearheaded", "coordinated",
    "established", "streamlined", "enhanced", "resolved", "maintained",
    "analyzed", "evaluated", "trained", "mentored",
];

const QUANTIFICATION_REGEX = /\d+[\s]*(%|percent|users|customers|projects|times|hours|days|months|years|million|lpa|lakh)/gi;

// ── Score calculator ──────────────────────────────────────────────────────────
export const calculateAtsScore = (text) => {
    if (!text || text.trim().length < 100) return 0;

    const lower = text.toLowerCase();
    let score = 0;

    const sectionsFound = SECTION_KEYWORDS.filter((s) => lower.includes(s));
    score += Math.min(25, sectionsFound.length * 5);

    const techFound = TECH_KEYWORDS.filter((k) => lower.includes(k));
    score += Math.min(25, techFound.length);

    const verbsFound = ACTION_VERBS.filter((v) => lower.includes(v));
    score += Math.min(10, verbsFound.length * 2);

    const quantMatches = (text.match(QUANTIFICATION_REGEX) || []).length;
    score += Math.min(10, quantMatches * 2);

    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(text);
    score += (hasEmail ? 5 : 0) + (hasPhone ? 5 : 0);

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 300 && wordCount <= 800) score += 10;
    else if (wordCount >= 200) score += 6;
    else if (wordCount >= 100) score += 3;

    const specialChars = (text.match(/[^a-zA-Z0-9\s.,;:()\-@/+#&']/g) || []).length;
    const ratio = specialChars / Math.max(text.length, 1);
    score += ratio < 0.03 ? 10 : ratio < 0.06 ? 6 : ratio < 0.10 ? 3 : 0;

    const finalScore = Math.min(100, Math.round(score));
    console.log(`[ATS] Score: ${finalScore}/100 | Words: ${wordCount} | Sections: ${sectionsFound.length} | Tech: ${techFound.length}`);
    return finalScore;
};

// ── Extract public_id from Cloudinary URL ────────────────────────────────────
const extractPublicId = (url) => {
    try {
        const match = url.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

// ── Fetch PDF buffer with multiple fallback strategies ────────────────────────
const fetchPdfBuffer = async (resumeUrl, publicId) => {
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    // Strategy 1: Direct public fetch (works when uploaded with access_mode: public)
    try {
        const res = await axios.get(resumeUrl, {
            responseType: "arraybuffer",
            timeout: 20000,
            headers: { "Accept": "application/pdf,*/*", "User-Agent": "Mozilla/5.0" },
        });
        const buf = Buffer.from(res.data);
        if (buf.length > 4 && buf.toString("ascii", 0, 4) === "%PDF") {
            console.log("[ATS] Strategy 1 (direct) succeeded");
            return buf;
        }
        console.warn("[ATS] Strategy 1 returned non-PDF content");
    } catch (e) {
        console.warn("[ATS] Strategy 1 failed:", e.message);
    }

    // Strategy 2: Cloudinary private_download_url (signed)
    if (publicId) {
        try {
            const signedUrl = cloudinary.utils.private_download_url(publicId, "", {
                resource_type: "raw",
                expires_at: Math.floor(Date.now() / 1000) + 120,
            });
            console.log("[ATS] Strategy 2 signed URL:", signedUrl);
            const res = await axios.get(signedUrl, {
                responseType: "arraybuffer",
                timeout: 20000,
                headers: { "Accept": "application/pdf,*/*" },
            });
            const buf = Buffer.from(res.data);
            if (buf.length > 4 && buf.toString("ascii", 0, 4) === "%PDF") {
                console.log("[ATS] Strategy 2 (signed URL) succeeded");
                return buf;
            }
        } catch (e) {
            console.warn("[ATS] Strategy 2 failed:", e.message);
        }
    }

    // Strategy 3: Basic auth with API key/secret
    try {
        const res = await axios.get(resumeUrl, {
            responseType: "arraybuffer",
            timeout: 20000,
            auth: { username: apiKey, password: apiSecret },
            headers: { "Accept": "application/pdf,*/*" },
        });
        console.log("[ATS] Strategy 3 (basic auth) succeeded");
        return Buffer.from(res.data);
    } catch (e) {
        console.warn("[ATS] Strategy 3 failed:", e.message);
    }

    throw new Error("All download strategies failed");
};

// ── Main scorer ───────────────────────────────────────────────────────────────
export const scoreResumeFromUrl = async (resumeUrl) => {
    try {
        console.log("[ATS] Scoring resume:", resumeUrl);
        const publicId = resumeUrl.includes("cloudinary.com") ? extractPublicId(resumeUrl) : null;
        if (publicId) console.log("[ATS] publicId:", publicId);

        const buffer = await fetchPdfBuffer(resumeUrl, publicId);

        if (!buffer || buffer.length < 4 || buffer.toString("ascii", 0, 4) !== "%PDF") {
            console.error("[ATS] Not a valid PDF after all strategies. First bytes:", buffer?.toString("ascii", 0, 20));
            return 0;
        }

        const data = await pdfParse(buffer, { max: 10 });
        const text = data.text?.trim();

        if (!text || text.length < 50) {
            console.error("[ATS] No readable text — likely image-based PDF");
            return 5;
        }

        console.log("[ATS] Text length:", text.length, "chars");
        return calculateAtsScore(text);
    } catch (err) {
        console.error("[ATS] Error scoring resume:", err.message);
        return 0;
    }
};
