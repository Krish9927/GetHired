import { GoogleGenerativeAI } from "@google/generative-ai";

// ── RAG Knowledge Base ────────────────────────────────────────────────────────
// This is our in-memory "vector store" — a curated set of industry standards
// that Gemini uses as context (retrieval) before scoring the resume.
// Think of each entry as a "document chunk" that would normally live in a vector DB.

const RAG_KNOWLEDGE_BASE = [
    // ── ATS Best Practices ─────────────────────────────────────────────────────
    {
        topic: "ats_best_practices",
        content: `ATS-optimized resumes should include:
- Clear section headings: Education, Experience, Skills, Projects, Certifications
- Quantified achievements: "Increased performance by 40%", "Reduced load time by 2s"
- Action verbs: developed, built, implemented, optimized, led, designed, deployed
- Contact information: email address and phone number must be present
- Keyword density: match keywords from job descriptions naturally
- Clean formatting: avoid tables, graphics, special characters that confuse parsers
- Word count: 300-800 words is ideal (1-2 pages)
- No generic objectives — use a professional summary instead`,
    },
    {
        topic: "strong_resume_sections",
        content: `A strong resume has these sections in order:
1. Contact Info (name, email, phone, LinkedIn, GitHub)
2. Professional Summary (2-3 lines tailored to target role)
3. Skills (technical + soft skills listed clearly)
4. Work Experience / Internships (reverse chronological, bullet points)
5. Projects (with tech stack used, outcomes, GitHub links)
6. Education (degree, college name, CGPA if strong)
7. Certifications / Achievements (optional but adds value)
Each experience bullet: [Action verb] + [what you did] + [result/impact]`,
    },

    // ── Skill Taxonomies ───────────────────────────────────────────────────────
    {
        topic: "frontend_skills",
        content: `Frontend development skills taxonomy:
Core: HTML5, CSS3, JavaScript (ES6+), TypeScript
Frameworks: React.js, Angular, Vue.js, Next.js, Svelte
Styling: Tailwind CSS, Bootstrap, Material UI, shadcn/ui, Styled Components
State: Redux, Zustand, Context API, MobX, Recoil
Build Tools: Webpack, Vite, Rollup, Parcel
Testing: Jest, React Testing Library, Cypress, Playwright
Tools: Figma, Storybook, ESLint, Prettier
Related: REST APIs, GraphQL, WebSockets, PWA, accessibility (WCAG)`,
    },
    {
        topic: "backend_skills",
        content: `Backend development skills taxonomy:
Runtime: Node.js, Python, Java, Go, Rust, PHP
Frameworks: Express.js, FastAPI, Django, Flask, Spring Boot, NestJS, Laravel
Databases: MongoDB, PostgreSQL, MySQL, Redis, Cassandra, DynamoDB, Firebase
API: REST, GraphQL, gRPC, WebSockets, OpenAPI/Swagger
Auth: JWT, OAuth2, Passport.js, session management, bcrypt
Cloud: AWS (EC2, S3, Lambda), Azure, GCP, Heroku, Render, Railway
DevOps: Docker, Kubernetes, CI/CD, GitHub Actions, Jenkins, Nginx
ORM: Mongoose, Prisma, Sequelize, TypeORM
Testing: Jest, Mocha, Supertest, Postman`,
    },
    {
        topic: "fullstack_skills",
        content: `Full Stack MERN/MEAN skills:
MERN: MongoDB, Express.js, React.js, Node.js
MEAN: MongoDB, Express.js, Angular, Node.js
Additional: REST API design, JWT authentication, Cloudinary/S3 for file storage
State management: Redux Toolkit, Context API
Deployment: Vercel, Render, Railway, AWS EC2
Version control: Git, GitHub, GitLab, branching strategies
Real-time: Socket.io, WebSockets, Server-Sent Events`,
    },
    {
        topic: "data_science_ml_skills",
        content: `Data Science and ML skills taxonomy:
Languages: Python, R, SQL, Julia
Libraries: NumPy, Pandas, Scikit-learn, TensorFlow, PyTorch, Keras, Matplotlib, Seaborn
Concepts: Supervised/Unsupervised Learning, Neural Networks, NLP, Computer Vision
Tools: Jupyter, Google Colab, Kaggle, Apache Spark, Hadoop
Databases: SQL, MongoDB, BigQuery, Snowflake
Visualization: Tableau, Power BI, matplotlib, plotly
MLOps: MLflow, DVC, Docker for ML, model deployment with FastAPI/Flask`,
    },
    {
        topic: "devops_cloud_skills",
        content: `DevOps and Cloud skills taxonomy:
Cloud: AWS (EC2, S3, RDS, Lambda, EKS), Azure, GCP
Containers: Docker, Kubernetes, Helm, Podman
CI/CD: GitHub Actions, Jenkins, CircleCI, GitLab CI, ArgoCD
IaC: Terraform, Ansible, CloudFormation, Pulumi
Monitoring: Prometheus, Grafana, ELK Stack, Datadog, CloudWatch
OS: Linux, Bash scripting, Shell scripting
Networking: DNS, Load Balancers, VPC, Nginx, Apache`,
    },

    // ── Fresher / Student Resume Standards ────────────────────────────────────
    {
        topic: "fresher_resume_standards",
        content: `For fresher/student resumes (0-2 years experience):
- Projects are the most important section — list 2-4 strong projects
- Each project: title, tech stack, description, outcome, GitHub link
- Internship experience (even 1-2 months) is highly valuable
- Academic achievements: CGPA (if 7.5+), relevant coursework
- Certifications: NPTEL, Coursera, Udemy, HackerRank, LeetCode
- Open source contributions are a strong signal
- Avoid padding — quality over quantity
- GPA/CGPA: include if 7.5 out of 10 or 3.5 out of 4.0 or higher
- Skills section must be realistic — only list what you can explain in interview`,
    },
    {
        topic: "common_resume_mistakes",
        content: `Common ATS-failing resume mistakes:
- Missing contact info (no email, no phone)
- No skills section or skills buried in text
- Using graphics, tables, columns (ATS can't parse these)
- Generic objective: "Seeking a challenging position..." — replace with summary
- No quantification: "worked on a project" vs "built REST API serving 500+ users"
- Typos and grammar errors
- Too long (3+ pages for freshers) or too short (under 200 words)
- Skills listed without context — show where you used them
- No action verbs — start each bullet with a strong verb
- Missing GitHub/portfolio links for technical roles`,
    },
];

// ── Simple keyword retrieval (simulates vector search) ───────────────────────
// In a real RAG system this would be a cosine similarity search on embeddings.
// Here we do keyword-overlap retrieval — fast and good enough for resume scoring.
const retrieveRelevantChunks = (resumeText, topK = 4) => {
    const lower = resumeText.toLowerCase();

    const scored = RAG_KNOWLEDGE_BASE.map((chunk) => {
        const chunkWords = chunk.content.toLowerCase().split(/\W+/);
        const resumeWords = new Set(lower.split(/\W+/));
        const overlap = chunkWords.filter((w) => w.length > 3 && resumeWords.has(w)).length;
        return { ...chunk, overlap };
    });

    // Always include best_practices + most relevant skill chunk
    const sorted = scored.sort((a, b) => b.overlap - a.overlap);
    return sorted.slice(0, topK).map((c) => c.content).join("\n\n---\n\n");
};

// ── Gemini AI Scorer ──────────────────────────────────────────────────────────
const callGeminiForAts = async (resumeText, context) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        generationConfig: {
            temperature: 0.2,       // low temp = more consistent scoring
            maxOutputTokens: 1024,
            responseMimeType: "application/json", // force JSON output
        },
    });

    const prompt = `You are an expert ATS (Applicant Tracking System) evaluator for a job portal.

## Industry Standards & Context (use this as reference):
${context}

## Resume Text to Evaluate:
"""
${resumeText.slice(0, 4000)}
"""

## Task:
Evaluate this resume based on the industry standards above.

Respond ONLY with a valid JSON object in this exact format:
{
  "aiScore": <integer 0-100>,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "keywordsFound": ["keyword1", "keyword2", "keyword3"],
  "keywordsMissing": ["important missing keyword 1", "important missing keyword 2"],
  "sectionsFound": ["Education", "Skills"],
  "sectionsMissing": ["Projects", "Summary"],
  "levelDetected": "fresher|junior|mid|senior",
  "summary": "2 sentence honest assessment of this resume"
}

Be specific and actionable. Base score on: sections (25%), tech keywords (25%), action verbs+quantification (20%), contact info (10%), word count/formatting (20%).`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON — Gemini with responseMimeType should return clean JSON
    try {
        return JSON.parse(text);
    } catch {
        // Fallback: extract JSON block if extra text was added
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error("Gemini returned non-JSON response");
    }
};

// ── Main Hybrid Scorer ────────────────────────────────────────────────────────
/**
 * RAG-based ATS scoring using Gemini AI
 * Returns detailed feedback object
 *
 * @param {string} resumeText - extracted text from PDF
 * @param {number} keywordScore - score from existing keyword matcher (0-100)
 * @returns {object} { aiScore, finalScore, strengths, gaps, suggestions, ... }
 */
export const ragScoreResume = async (resumeText, keywordScore = 0) => {
    try {
        // Step 1: Retrieve relevant knowledge chunks (simulated vector search)
        const relevantContext = retrieveRelevantChunks(resumeText);
        console.log("[RAG-ATS] Retrieved context chunks for scoring");

        // Step 2: Call Gemini with resume + context
        const aiResult = await callGeminiForAts(resumeText, relevantContext);
        console.log(`[RAG-ATS] Gemini AI score: ${aiResult.aiScore}/100`);

        // Step 3: Hybrid blend — 40% keyword + 60% AI
        // Keyword score = fast & rule-based (no hallucination)
        // AI score = semantic & contextual (catches what keywords miss)
        const finalScore = Math.min(100, Math.round(keywordScore * 0.4 + aiResult.aiScore * 0.6));
        console.log(`[RAG-ATS] Hybrid final score: ${finalScore}/100 (keyword: ${keywordScore}, ai: ${aiResult.aiScore})`);

        return {
            finalScore,
            aiScore: aiResult.aiScore,
            keywordScore,
            source: "hybrid",
            strengths: aiResult.strengths || [],
            gaps: aiResult.gaps || [],
            suggestions: aiResult.suggestions || [],
            keywordsFound: aiResult.keywordsFound || [],
            keywordsMissing: aiResult.keywordsMissing || [],
            sectionsFound: aiResult.sectionsFound || [],
            sectionsMissing: aiResult.sectionsMissing || [],
            levelDetected: aiResult.levelDetected || "unknown",
            summary: aiResult.summary || "",
        };
    } catch (err) {
        console.error("[RAG-ATS] Gemini call failed, falling back to keyword score:", err.message);

        // Graceful fallback — return keyword score with empty feedback
        return {
            finalScore: keywordScore,
            aiScore: null,
            keywordScore,
            source: "keyword_fallback",
            strengths: [],
            gaps: [],
            suggestions: ["Upload a well-structured resume with clear sections for detailed feedback."],
            keywordsFound: [],
            keywordsMissing: [],
            sectionsFound: [],
            sectionsMissing: [],
            levelDetected: "unknown",
            summary: "AI analysis unavailable. Score based on keyword matching.",
        };
    }
};
