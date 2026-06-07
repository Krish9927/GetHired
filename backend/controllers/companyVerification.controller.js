import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { sendOtpEmail } from "../utils/mailer.js";
import {
    isPersonalEmail,
    getDomainFromEmail,
    getDomainFromUrl,
    isHttpsWebsite,
    doDomainsMatch,
    calculateCompanyTrustScore,
} from "../utils/companyTrustScore.js";
import crypto from "crypto";

// ─── Send Company Email OTP ───────────────────────────────────────────────────
export const sendCompanyOtp = async (req, res) => {
    try {
        const { companyId, companyEmail } = req.body;
        const company = await Company.findOne({ _id: companyId, userId: req.id });
        if (!company) return res.status(404).json({ message: "Company not found", success: false });

        if (isPersonalEmail(companyEmail))
            return res.status(400).json({
                message: "Personal emails (Gmail, Yahoo, etc.) are not allowed. Use your official company email.",
                success: false,
            });

        const otp = crypto.randomInt(100000, 999999).toString();
        company.companyEmail = companyEmail;
        company.emailOtp = otp;
        company.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        company.emailDomain = getDomainFromEmail(companyEmail);
        await company.save();

        await sendOtpEmail(companyEmail, otp);
        return res.status(200).json({ message: "OTP sent to company email", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Verify Company Email OTP ─────────────────────────────────────────────────
export const verifyCompanyOtp = async (req, res) => {
    try {
        const { companyId, otp } = req.body;
        const company = await Company.findOne({ _id: companyId, userId: req.id });
        if (!company) return res.status(404).json({ message: "Company not found", success: false });

        if (!company.emailOtp || !company.emailOtpExpiry)
            return res.status(400).json({ message: "No OTP requested", success: false });

        if (new Date() > company.emailOtpExpiry)
            return res.status(400).json({ message: "OTP expired", success: false });

        if (company.emailOtp !== otp.toString())
            return res.status(400).json({ message: "Invalid OTP", success: false });

        company.isEmailVerified = true;
        company.emailOtp = undefined;
        company.emailOtpExpiry = undefined;

        // Check domain match with website
        if (company.website) {
            company.isWebsiteHttps = isHttpsWebsite(company.website);
            company.websiteDomain = getDomainFromUrl(company.website);
            company.isDomainMatched = doDomainsMatch(company.emailDomain, company.websiteDomain);
        }

        company.trustScore = calculateCompanyTrustScore(company);
        await company.save();

        return res.status(200).json({
            message: "Company email verified",
            success: true,
            trustScore: company.trustScore,
            isDomainMatched: company.isDomainMatched,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Update Company Verification Info ────────────────────────────────────────
export const updateCompanyVerificationInfo = async (req, res) => {
    try {
        const { companyId, linkedinUrl, gstNumber, cinNumber, website } = req.body;
        const company = await Company.findOne({ _id: companyId, userId: req.id });
        if (!company) return res.status(404).json({ message: "Company not found", success: false });

        if (linkedinUrl !== undefined) company.linkedinUrl = linkedinUrl;
        if (gstNumber !== undefined) company.gstNumber = gstNumber;
        if (cinNumber !== undefined) company.cinNumber = cinNumber;

        if (website) {
            company.website = website;
            company.isWebsiteHttps = isHttpsWebsite(website);
            company.websiteDomain = getDomainFromUrl(website);
            if (company.emailDomain) {
                company.isDomainMatched = doDomainsMatch(company.emailDomain, company.websiteDomain);
            }
        }

        company.trustScore = calculateCompanyTrustScore(company);
        await company.save();

        return res.status(200).json({
            message: "Company info updated",
            success: true,
            trustScore: company.trustScore,
            isWebsiteHttps: company.isWebsiteHttps,
            isDomainMatched: company.isDomainMatched,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get Company Verification Status ─────────────────────────────────────────
export const getCompanyVerificationStatus = async (req, res) => {
    try {
        const company = await Company.findOne({ _id: req.params.id, userId: req.id });
        if (!company) return res.status(404).json({ message: "Company not found", success: false });

        return res.status(200).json({
            success: true,
            verification: {
                companyEmail: company.companyEmail,
                isEmailVerified: company.isEmailVerified,
                isWebsiteHttps: company.isWebsiteHttps,
                isDomainMatched: company.isDomainMatched,
                emailDomain: company.emailDomain,
                websiteDomain: company.websiteDomain,
                linkedinUrl: company.linkedinUrl,
                gstNumber: company.gstNumber,
                cinNumber: company.cinNumber,
                trustScore: company.trustScore,
                verificationStatus: company.verificationStatus,
                isVerified: company.isVerified,
                adminNote: company.adminNote,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Get all companies for review ─────────────────────────────────────
export const adminGetAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find()
            .populate("userId", "fullname email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, companies });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Approve company ───────────────────────────────────────────────────
export const adminApproveCompany = async (req, res) => {
    try {
        const { companyId, adminNote } = req.body;
        const company = await Company.findByIdAndUpdate(
            companyId,
            {
                verificationStatus: "approved",
                isVerified: true,
                adminNote: adminNote || "",
                reviewedBy: req.id,
                reviewedAt: new Date(),
            },
            { new: true }
        );
        if (!company) return res.status(404).json({ message: "Company not found", success: false });
        return res.status(200).json({ message: "Company approved", success: true, company });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Reject company ────────────────────────────────────────────────────
export const adminRejectCompany = async (req, res) => {
    try {
        const { companyId, adminNote } = req.body;
        const company = await Company.findByIdAndUpdate(
            companyId,
            {
                verificationStatus: "rejected",
                isVerified: false,
                adminNote: adminNote || "",
                reviewedBy: req.id,
                reviewedAt: new Date(),
            },
            { new: true }
        );
        if (!company) return res.status(404).json({ message: "Company not found", success: false });
        return res.status(200).json({ message: "Company rejected", success: true, company });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Ban recruiter ─────────────────────────────────────────────────────
export const adminBanRecruiter = async (req, res) => {
    try {
        const { companyId, adminNote } = req.body;
        const company = await Company.findByIdAndUpdate(
            companyId,
            {
                verificationStatus: "banned",
                isVerified: false,
                adminNote: adminNote || "Banned for fraudulent activity",
                reviewedBy: req.id,
                reviewedAt: new Date(),
            },
            { new: true }
        );
        if (!company) return res.status(404).json({ message: "Company not found", success: false });

        // Also set all their active jobs to rejected
        await Job.updateMany({ company: companyId }, { jobStatus: "rejected" });

        return res.status(200).json({ message: "Recruiter banned and jobs removed", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Get suspicious jobs ───────────────────────────────────────────────
export const adminGetSuspiciousJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ jobStatus: "under_review" })
            .populate("company", "name isVerified verificationStatus trustScore")
            .populate("created_by", "fullname email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Approve suspicious job ───────────────────────────────────────────
export const adminApproveJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findByIdAndUpdate(jobId, { jobStatus: "active", isSuspicious: false }, { new: true });
        if (!job) return res.status(404).json({ message: "Job not found", success: false });
        return res.status(200).json({ message: "Job approved and made active", success: true, job });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── ADMIN: Reject suspicious job ────────────────────────────────────────────
export const adminRejectJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await Job.findByIdAndUpdate(jobId, { jobStatus: "rejected" }, { new: true });
        if (!job) return res.status(404).json({ message: "Job not found", success: false });
        return res.status(200).json({ message: "Job rejected", success: true, job });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};
