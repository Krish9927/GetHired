import { User } from "../models/user.model.js";
import { sendForgotPasswordEmail } from "../utils/mailer.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── Step 1: Send OTP to email ────────────────────────────────────────────────
export const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required", success: false });

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email address", success: false });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        await sendForgotPasswordEmail(email, otp, user.fullname);

        return res.status(200).json({ message: "OTP sent to your email", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Step 2: Verify OTP ───────────────────────────────────────────────────────
export const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required", success: false });

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "No reset request found. Please request a new OTP.", success: false });
        }

        if (new Date() > user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one.", success: false });
        }

        if (user.resetPasswordOtp !== otp.toString()) {
            return res.status(400).json({ message: "Invalid OTP", success: false });
        }

        return res.status(200).json({ message: "OTP verified", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Step 3: Reset password ───────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters", success: false });
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "No reset request found", success: false });
        }

        if (new Date() > user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired", success: false });
        }

        if (user.resetPasswordOtp !== otp.toString()) {
            return res.status(400).json({ message: "Invalid OTP", success: false });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpiry = undefined;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully. You can now log in.", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};
