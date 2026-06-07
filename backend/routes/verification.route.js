import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import {
    sendOtp,
    verifyOtp,
    uploadCgpaProof,
    updateSocialLinks,
    recalculateAts,
    getVerificationStatus,
} from "../controllers/verification.controller.js";

const router = express.Router();

router.route("/send-otp").post(isAuthenticated, sendOtp);
router.route("/verify-otp").post(isAuthenticated, verifyOtp);
router.route("/cgpa").post(isAuthenticated, singleUpload, uploadCgpaProof);
router.route("/social-links").post(isAuthenticated, updateSocialLinks);
router.route("/recalculate-ats").post(isAuthenticated, recalculateAts);
router.route("/status").get(isAuthenticated, getVerificationStatus);

export default router;
