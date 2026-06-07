import { User } from "../models/user.model.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { scoreResumeFromUrl } from "../utils/atsScorer.js";
import {
    calculateTrustScore,
    calculateProfileCompleteness,
    isCollegeEmailAddress,
} from "../utils/trustScore.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";

// ─── Send OTP ────────────────────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: "User not found", success: false });
        if (user.isEmailVerified)
            return res.status(400).json({ message: "Email already verified", success: false });

        const otp = crypto.randomInt(100000, 999999).toString();
        user.emailOtp = otp;
        user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        await sendOtpEmail(user.email, otp);
        return res.status(200).json({ message: "OTP sent to your email", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        if (!user.emailOtp || !user.emailOtpExpiry)
            return res.status(400).json({ message: "No OTP requested", success: false });

        if (new Date() > user.emailOtpExpiry)
            return res.status(400).json({ message: "OTP expired", success: false });

        if (user.emailOtp !== otp.toString())
            return res.status(400).json({ message: "Invalid OTP", success: false });

        user.isEmailVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpiry = undefined;
        user.isCollegeEmail = isCollegeEmailAddress(user.email);

        await recalculateScores(user);
        await user.save();

        return res.status(200).json({
            message: "Email verified successfully",
            success: true,
            isCollegeEmail: user.isCollegeEmail,
            trustScore: user.trustScore,
            profileCompleteness: user.profileCompleteness,
            isVerified: user.isVerified,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Upload CGPA Proof ───────────────────────────────────────────────────────
export const uploadCgpaProof = async (req, res) => {
    try {
        const { cgpa, college } = req.body;
        const file = req.file;
        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        if (cgpa !== undefined) {
            const parsed = parseFloat(cgpa);
            if (isNaN(parsed) || parsed < 0 || parsed > 10)
                return res.status(400).json({ message: "CGPA must be between 0 and 10", success: false });
            user.profile.cgpa = parsed;
        }

        if (college) user.profile.college = college;

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            user.profile.cgpaProof = cloudResponse.secure_url;
        }

        await recalculateScores(user);
        await user.save();

        return res.status(200).json({
            message: "CGPA info updated",
            success: true,
            trustScore: user.trustScore,
            profileCompleteness: user.profileCompleteness,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Update Social Links ─────────────────────────────────────────────────────
export const updateSocialLinks = async (req, res) => {
    try {
        const { githubUrl, linkedinUrl } = req.body;
        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        if (githubUrl !== undefined) user.profile.githubUrl = githubUrl;
        if (linkedinUrl !== undefined) user.profile.linkedinUrl = linkedinUrl;

        await recalculateScores(user);
        await user.save();

        return res.status(200).json({
            message: "Social links updated",
            success: true,
            trustScore: user.trustScore,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Recalculate ATS Score ───────────────────────────────────────────────────
export const recalculateAts = async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) return res.status(404).json({ message: "User not found", success: false });
        if (!user.profile?.resume)
            return res.status(400).json({ message: "No resume uploaded", success: false });

        user.atsScore = await scoreResumeFromUrl(user.profile.resume);
        await recalculateScores(user);
        await user.save();

        return res.status(200).json({
            message: "ATS score updated",
            success: true,
            atsScore: user.atsScore,
            trustScore: user.trustScore,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get Verification Status ─────────────────────────────────────────────────
export const getVerificationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.id).select(
            "fullname email isEmailVerified isCollegeEmail isVerified atsScore trustScore profileCompleteness profile.cgpa profile.cgpaProof profile.githubUrl profile.linkedinUrl profile.resume profile.skills profile.bio profile.college"
        );
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        const atsFeedback = getAtsFeedback(user.atsScore);
        const eligibilityStatus = getEligibilityStatus(user);

        return res.status(200).json({
            success: true,
            verification: {
                isEmailVerified: user.isEmailVerified,
                isCollegeEmail: user.isCollegeEmail,
                isVerified: user.isVerified,
                atsScore: user.atsScore,
                atsFeedback,
                trustScore: user.trustScore,
                profileCompleteness: user.profileCompleteness,
                cgpa: user.profile?.cgpa,
                hasCgpaProof: !!user.profile?.cgpaProof,
                hasResume: !!user.profile?.resume,
                hasGithub: !!user.profile?.githubUrl,
                hasLinkedin: !!user.profile?.linkedinUrl,
                eligibilityStatus,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const recalculateScores = async (user) => {
    // Always recalculate ATS if resume exists
    if (user.profile?.resume) {
        user.atsScore = await scoreResumeFromUrl(user.profile.resume);
    }
    user.profileCompleteness = calculateProfileCompleteness(user);
    user.trustScore = calculateTrustScore(user);
    user.isVerified = user.trustScore >= 60 && user.isEmailVerified;
};

const getAtsFeedback = (score) => {
    if (score >= 80) return { level: "excellent", message: "Your resume is ATS-optimized." };
    if (score >= 60) return { level: "good", message: "Good resume. Minor improvements can help." };
    if (score >= 40) return { level: "fair", message: "Improve your resume: add more sections, keywords, and quantify achievements." };
    return { level: "poor", message: "Your resume needs significant improvement. Add skills, projects, education, and experience sections." };
};

const getEligibilityStatus = (user) => {
    if (!user.isEmailVerified) return { status: "unverified", message: "Verify your email to unlock full access." };
    if (user.profileCompleteness < 50) return { status: "limited", message: "Complete your profile to apply for jobs." };
    if (user.atsScore < 60) return { status: "restricted", message: "Improve your resume ATS score above 60 to apply for premium jobs." };
    return { status: "eligible", message: "You are eligible to apply for jobs." };
};
