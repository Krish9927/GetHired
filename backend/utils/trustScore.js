/**
 * Calculate student trust score (0-100) based on profile completeness signals
 *
 * Weights:
 *  Email verified          → 20 pts
 *  College email (.edu/.ac.in) → 15 pts
 *  Resume uploaded         → 15 pts
 *  ATS score >= 60         → 10 pts
 *  LinkedIn added          → 10 pts
 *  GitHub added            → 10 pts
 *  CGPA proof uploaded     → 10 pts
 *  Profile completeness >= 80% → 10 pts
 */
export const calculateTrustScore = (user) => {
    let score = 0;

    if (user.isEmailVerified) score += 20;
    if (user.isCollegeEmail) score += 15;
    if (user.profile?.resume) score += 15;
    if (user.atsScore >= 60) score += 10;
    if (user.profile?.linkedinUrl) score += 10;
    if (user.profile?.githubUrl) score += 10;
    if (user.profile?.cgpaProof) score += 10;
    if (user.profileCompleteness >= 80) score += 10;

    return Math.min(100, score);
};

/**
 * Calculate profile completeness percentage
 */
export const calculateProfileCompleteness = (user) => {
    const fields = [
        user.fullname,
        user.email,
        user.phoneNumber,
        user.profile?.bio,
        user.profile?.resume,
        user.profile?.profilePhoto,
        user.profile?.skills?.length > 0,
        user.profile?.githubUrl,
        user.profile?.linkedinUrl,
        user.profile?.cgpa,
        user.profile?.college,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
};

/**
 * Determine if user has a college email
 */
export const isCollegeEmailAddress = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.endsWith(".edu") ||
        lower.includes(".ac.in") ||
        lower.includes(".edu.in") ||
        lower.includes(".ac.uk") ||
        lower.includes(".edu.au");
};
