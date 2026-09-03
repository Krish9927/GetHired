import express from "express";
import {
  login,
  logout,
  registerStudent,
  registerRecruiter,
  updateStudentProfile,
  updateRecruiterProfile,
  adminLogin,
} from "../controllers/user.controller.js";
import {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from "../controllers/forgotPassword.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isStudent, isRecruiter } from "../middlewares/roleGuard.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// Auth
router.route("/register/student").post(singleUpload, registerStudent);
router.route("/register/recruiter").post(singleUpload, registerRecruiter);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/admin/login").post(adminLogin);

// Profile updates
router.route("/profile/student/update").post(isAuthenticated, isStudent, singleUpload, updateStudentProfile);
router.route("/profile/recruiter/update").post(isAuthenticated, isRecruiter, singleUpload, updateRecruiterProfile);

// Forgot password
router.route("/forgot-password/send-otp").post(sendResetOtp);
router.route("/forgot-password/verify-otp").post(verifyResetOtp);
router.route("/forgot-password/reset").post(resetPassword);

export default router;
