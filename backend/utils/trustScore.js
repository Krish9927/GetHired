/**
 * Student Trust Score utilities
 *
 * Weights:
 *  Email verified              → 20 pts
 *  College email (.edu/.ac.in) → 15 pts
 *  Resume uploaded             → 15 pts
 *  ATS score >= 60             → 10 pts
 *  LinkedIn added              → 10 pts
 *  GitHub added                → 10 pts
 *  CGPA proof uploaded         → 10 pts
 *  Profile completeness >= 80% → 10 pts
 */

export const calculateStudentTrustScore = (student) => {
    let score = 0;

    if (student.isEmailVerified) score += 20;
    if (student.isCollegeEmail) score += 15;
    if (student.profile?.resume) score += 15;
    if (student.atsScore >= 60) score += 10;
    if (student.profile?.linkedinUrl) score += 10;
    if (student.profile?.githubUrl) score += 10;
    if (student.profile?.cgpaProof) score += 10;
    if (student.profileCompleteness >= 80) score += 10;

    return Math.min(100, score);
};

export const calculateStudentProfileCompleteness = (student) => {
    const fields = [
        student.fullname,
        student.email,
        student.phoneNumber,
        student.profile?.bio,
        student.profile?.resume,
        student.profile?.profilePhoto,
        student.profile?.skills?.length > 0,
        student.profile?.githubUrl,
        student.profile?.linkedinUrl,
        student.profile?.cgpa,
        student.profile?.college,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
};

export const isCollegeEmailAddress = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return (
        lower.endsWith(".edu") ||
        lower.includes(".ac.in") ||
        lower.includes(".edu.in") ||
        lower.includes(".ac.uk") ||
        lower.includes(".edu.au")
    );
};

// Legacy aliases — keeps verification.controller.js and other files working
// until they are updated to use the new names
export const calculateTrustScore = calculateStudentTrustScore;
export const calculateProfileCompleteness = calculateStudentProfileCompleteness;
