const FAQ_TOPICS = [
    {
        keywords: ["hello", "hi", "hey", "help", "start"],
        reply: "Hi! I'm the GetHired student assistant. I can help with profile verification, resume tips, job applications, and more. What would you like to know?",
        suggestions: ["How do I verify my email?", "How to improve my resume?", "Check my application status"],
    },
    {
        keywords: ["verify", "verification", "email", "otp"],
        reply: (ctx) => {
            if (!ctx.isLoggedIn) {
                return "To verify your email, log in and go to Profile → Verification. Click 'Send OTP' and enter the 6-digit code sent to your inbox. College emails (.edu, .ac.in) earn extra trust score points!";
            }
            if (ctx.isEmailVerified) {
                return `Your email (${ctx.email}) is already verified${ctx.isCollegeEmail ? " and recognized as a college email — great for your trust score!" : "."}`;
            }
            return "Your email is not verified yet. Go to Profile → Verification section and click 'Send OTP'. Enter the code within 10 minutes. This unlocks full portal access.";
        },
        suggestions: ["What is trust score?", "How to complete my profile?"],
    },
    {
        keywords: ["trust", "trust score", "trustscore"],
        reply: (ctx) => {
            const base = "Trust score (0–100) reflects profile credibility. Points come from: email verified (20), college email (15), resume uploaded (15), ATS ≥ 60 (10), LinkedIn (10), GitHub (10), CGPA proof (10), profile ≥ 80% complete (10). You need 60+ and verified email to become fully verified.";
            if (!ctx.isLoggedIn) return base;
            return `${base}\n\nYour trust score: ${ctx.trustScore}/100. ${ctx.isVerified ? "You are verified!" : "Keep completing your profile to reach 60+."}`;
        },
        suggestions: ["How to improve ATS score?", "Upload CGPA proof"],
    },
    {
        keywords: ["ats", "resume", "cv", "ats score"],
        reply: (ctx) => {
            const base = "ATS score measures how well your resume passes automated screening. Add clear sections (Education, Skills, Projects, Experience), use relevant keywords, and quantify achievements. Upload your resume in Profile → Edit Profile, then click 'Recalculate ATS' in Verification.";
            if (!ctx.isLoggedIn) return base;
            const feedback = ctx.atsScore >= 80 ? "excellent" : ctx.atsScore >= 60 ? "good" : ctx.atsScore >= 40 ? "fair — needs improvement" : "poor — needs significant work";
            return `${base}\n\nYour ATS score: ${ctx.atsScore}/100 (${feedback}). ${ctx.hasResume ? "" : "You haven't uploaded a resume yet — upload one to get scored."}`;
        },
        suggestions: ["What skills should I add?", "How to verify email?"],
    },
    {
        keywords: ["profile", "complete", "completeness", "bio", "skills"],
        reply: (ctx) => {
            const base = "Complete your profile at /profile → Edit Profile. Fill in: bio, skills, resume, profile photo, GitHub, LinkedIn, college, and CGPA. A complete profile improves trust score and recruiter visibility.";
            if (!ctx.isLoggedIn) return base;
            const missing = [];
            if (!ctx.hasResume) missing.push("resume");
            if (!ctx.hasGithub) missing.push("GitHub");
            if (!ctx.hasLinkedin) missing.push("LinkedIn");
            if (!ctx.cgpa) missing.push("CGPA");
            if (!ctx.hasCgpaProof) missing.push("CGPA proof");
            const extra = missing.length
                ? `\n\nProfile completeness: ${ctx.profileCompleteness}%. Still missing: ${missing.join(", ")}.`
                : `\n\nProfile completeness: ${ctx.profileCompleteness}%. Looking good!`;
            return base + extra;
        },
        suggestions: ["What is trust score?", "How to apply for jobs?"],
    },
    {
        keywords: ["apply", "application", "how to apply", "job apply"],
        reply: (ctx) => {
            const base = "To apply: browse Jobs or Browse page → open a job → click 'Apply Now'. You must be logged in with a complete profile. Some jobs require minimum CGPA — check the job details before applying.";
            if (!ctx.isLoggedIn) return base + "\n\nLog in first to apply and track your applications.";
            if (ctx.eligibilityStatus === "unverified") return base + "\n\n⚠️ Verify your email first — go to Profile → Verification.";
            if (ctx.eligibilityStatus === "limited") return base + `\n\n⚠️ Your profile is only ${ctx.profileCompleteness}% complete. Complete it to apply.`;
            if (ctx.eligibilityStatus === "restricted") return base + `\n\n⚠️ Your ATS score is ${ctx.atsScore}. Improve it above 60 for premium jobs.`;
            return base + "\n\n✅ You are eligible to apply for jobs!";
        },
        suggestions: ["Check my applications", "CGPA requirements"],
    },
    {
        keywords: ["status", "applied", "applications", "pending", "accepted", "rejected"],
        reply: (ctx) => {
            if (!ctx.isLoggedIn) {
                return "Log in and go to Profile → Applied Jobs to see all your applications and their status (pending, accepted, or rejected).";
            }
            if (!ctx.applications?.length) {
                return "You haven't applied to any jobs yet. Visit Jobs or Browse to find opportunities and click 'Apply Now' on jobs you're interested in.";
            }
            const list = ctx.applications
                .slice(0, 5)
                .map((a) => `• ${a.jobTitle} at ${a.companyName} — ${a.status}`)
                .join("\n");
            const more = ctx.applications.length > 5 ? `\n...and ${ctx.applications.length - 5} more. View all at Profile → Applied Jobs.` : "";
            return `You have ${ctx.applications.length} application(s):\n\n${list}${more}`;
        },
        suggestions: ["How to apply for jobs?", "Improve my resume"],
    },
    {
        keywords: ["cgpa", "grade", "minimum cgpa", "gpa"],
        reply: (ctx) => {
            const base = "Add your CGPA in Profile → Verification → CGPA section along with proof document. Some jobs list a minimum CGPA requirement — if your CGPA is below it, you won't be able to apply.";
            if (!ctx.isLoggedIn) return base;
            if (ctx.cgpa) {
                return `${base}\n\nYour CGPA: ${ctx.cgpa}${ctx.hasCgpaProof ? " (proof uploaded)" : " (upload proof to boost trust score)"}.`;
            }
            return base + "\n\nYou haven't added your CGPA yet. Go to Profile → Verification to add it.";
        },
        suggestions: ["How to apply for jobs?", "What is trust score?"],
    },
    {
        keywords: ["browse", "jobs", "search", "find job", "external"],
        reply: "Use the Jobs page for portal listings with filters (location, industry, salary). The Browse page shows both portal jobs and external opportunities from remote job boards. Use the search bar on Home to find roles by title or keyword.",
        suggestions: ["How to apply?", "Resume tips"],
    },
    {
        keywords: ["linkedin", "github", "social"],
        reply: (ctx) => {
            const base = "Add LinkedIn and GitHub links in Profile → Verification → Social Links. Both contribute 10 points each to your trust score and help recruiters review your work.";
            if (!ctx.isLoggedIn) return base;
            const status = [];
            status.push(ctx.hasLinkedin ? "✅ LinkedIn added" : "❌ LinkedIn not added");
            status.push(ctx.hasGithub ? "✅ GitHub added" : "❌ GitHub not added");
            return `${base}\n\n${status.join("\n")}`;
        },
        suggestions: ["What is trust score?", "Complete my profile"],
    },
    {
        keywords: ["eligible", "eligibility", "why can't i apply", "cannot apply"],
        reply: (ctx) => {
            if (!ctx.isLoggedIn) {
                return "To apply for jobs you need to: 1) Log in, 2) Verify email, 3) Complete profile (50%+), 4) ATS score 60+ for premium jobs, 5) Meet CGPA requirements if listed.";
            }
            return `Your eligibility status: ${ctx.eligibilityMessage}\n\nTrust: ${ctx.trustScore}/100 | Profile: ${ctx.profileCompleteness}% | ATS: ${ctx.atsScore}/100 | Email verified: ${ctx.isEmailVerified ? "Yes" : "No"}`;
        },
        suggestions: ["How to verify email?", "Improve resume"],
    },
    {
        keywords: ["login", "sign up", "register", "account", "password"],
        reply: "Create an account at /signup — select 'Student' as your role. Already have an account? Log in at /login. Forgot password? Use /forgot-password to reset via OTP.",
        suggestions: ["How to verify email?", "Complete my profile"],
    },
];

const DEFAULT_REPLY = {
    reply: "I'm not sure about that. I can help with: email verification, trust score, resume/ATS tips, job applications, CGPA, and profile completion. Try one of the suggestions below!",
    suggestions: ["How do I verify my email?", "Check my application status", "How to improve my resume?"],
};

export const buildStudentContext = (user, applications = []) => {
    if (!user) {
        return { isLoggedIn: false };
    }

    const eligibility = getEligibilityStatus(user);

    return {
        isLoggedIn: true,
        fullname: user.fullname,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isCollegeEmail: user.isCollegeEmail,
        isVerified: user.isVerified,
        atsScore: user.atsScore ?? 0,
        trustScore: user.trustScore ?? 0,
        profileCompleteness: user.profileCompleteness ?? 0,
        cgpa: user.profile?.cgpa,
        hasCgpaProof: !!user.profile?.cgpaProof,
        hasResume: !!user.profile?.resume,
        hasGithub: !!user.profile?.githubUrl,
        hasLinkedin: !!user.profile?.linkedinUrl,
        eligibilityStatus: eligibility.status,
        eligibilityMessage: eligibility.message,
        applications: applications.map((app) => ({
            jobTitle: app.job?.title || "Unknown role",
            companyName: app.job?.company?.name || "Unknown company",
            status: app.status || "pending",
        })),
    };
};

const getEligibilityStatus = (user) => {
    if (!user.isEmailVerified) return { status: "unverified", message: "Verify your email to unlock full access." };
    if ((user.profileCompleteness ?? 0) < 50) return { status: "limited", message: "Complete your profile to apply for jobs." };
    if ((user.atsScore ?? 0) < 60) return { status: "restricted", message: "Improve your resume ATS score above 60 to apply for premium jobs." };
    return { status: "eligible", message: "You are eligible to apply for jobs." };
};

const matchTopic = (message) => {
    const lower = message.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const topic of FAQ_TOPICS) {
        let score = 0;
        for (const keyword of topic.keywords) {
            if (lower.includes(keyword)) {
                score += keyword.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = topic;
        }
    }

    return bestMatch;
};

export const generateReply = (message, context = {}) => {
    const topic = matchTopic(message);

    if (!topic) {
        return DEFAULT_REPLY;
    }

    const reply = typeof topic.reply === "function" ? topic.reply(context) : topic.reply;

    return {
        reply,
        suggestions: topic.suggestions || DEFAULT_REPLY.suggestions,
    };
};

export const getWelcomeMessage = (context = {}) => {
    if (!context.isLoggedIn) {
        return {
            reply: "Welcome to GetHired! I'm here to help with student queries — verification, resumes, job applications, and more. Log in for personalized answers about your profile.",
            suggestions: ["How do I verify my email?", "How to apply for jobs?", "What is trust score?"],
        };
    }

    const name = context.fullname?.split(" ")[0] || "there";
    return {
        reply: `Hi ${name}! I can see your profile and help with personalized guidance. Trust score: ${context.trustScore}/100 | Profile: ${context.profileCompleteness}% complete. How can I help?`,
        suggestions: ["Check my application status", "How to improve my resume?", "Am I eligible to apply?"],
    };
};
