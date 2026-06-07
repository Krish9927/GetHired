import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
    sendCompanyOtp,
    verifyCompanyOtp,
    updateCompanyVerificationInfo,
    getCompanyVerificationStatus,
    adminGetAllCompanies,
    adminApproveCompany,
    adminRejectCompany,
    adminBanRecruiter,
    adminGetSuspiciousJobs,
    adminApproveJob,
    adminRejectJob,
} from "../controllers/companyVerification.controller.js";

const router = express.Router();

// Recruiter routes
router.route("/send-otp").post(isAuthenticated, sendCompanyOtp);
router.route("/verify-otp").post(isAuthenticated, verifyCompanyOtp);
router.route("/update-info").post(isAuthenticated, updateCompanyVerificationInfo);
router.route("/status/:id").get(isAuthenticated, getCompanyVerificationStatus);

// Admin routes
router.route("/admin/companies").get(isAuthenticated, isAdmin, adminGetAllCompanies);
router.route("/admin/companies/approve").post(isAuthenticated, isAdmin, adminApproveCompany);
router.route("/admin/companies/reject").post(isAuthenticated, isAdmin, adminRejectCompany);
router.route("/admin/companies/ban").post(isAuthenticated, isAdmin, adminBanRecruiter);
router.route("/admin/jobs/suspicious").get(isAuthenticated, isAdmin, adminGetSuspiciousJobs);
router.route("/admin/jobs/approve").post(isAuthenticated, isAdmin, adminApproveJob);
router.route("/admin/jobs/reject").post(isAuthenticated, isAdmin, adminRejectJob);

export default router;
