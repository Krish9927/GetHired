import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from "../controllers/forgotPassword.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, singleUpload, updateProfile);
router.route("/forgot-password/send-otp").post(sendResetOtp);
router.route("/forgot-password/verify-otp").post(verifyResetOtp);
router.route("/forgot-password/reset").post(resetPassword);

export default router;
