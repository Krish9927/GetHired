import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { USER_API_END_POINT } from "@/utils/constant";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Mail, Lock, KeyRound, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 };

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    // Step 1 — send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Enter your email address");
        setLoading(true);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/forgot-password/send-otp`, { email });
            if (res.data.success) {
                toast.success("OTP sent to your email");
                setStep(STEPS.OTP);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 2 — verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
        setLoading(true);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/forgot-password/verify-otp`, { email, otp });
            if (res.data.success) {
                toast.success("OTP verified");
                setStep(STEPS.PASSWORD);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 3 — reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
        if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
        setLoading(true);
        try {
            const res = await axios.post(`${USER_API_END_POINT}/forgot-password/reset`, { email, otp, newPassword });
            if (res.data.success) {
                toast.success("Password reset successfully!");
                setStep(STEPS.DONE);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const stepLabel = ["Enter Email", "Verify OTP", "New Password"];

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#6A38C2] to-[#4f28a0] flex-col justify-between p-12 text-white">
                <div>
                    <h1 className="text-3xl font-bold">Get<span className="text-[#F83002]">Hired</span></h1>
                    <p className="text-purple-200 text-sm mt-1">Your career starts here</p>
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold leading-tight">Reset your<br />password securely</h2>
                    <p className="text-purple-200">We'll send an OTP to your registered email to verify it's you.</p>
                </div>
                <p className="text-purple-300 text-xs">© 2025 GetHired. All rights reserved.</p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <h1 className="text-2xl font-bold">Get<span className="text-[#F83002]">Hired</span></h1>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">

                        {/* Progress steps */}
                        {step !== STEPS.DONE && (
                            <div className="flex items-center gap-2 mb-6">
                                {stepLabel.map((label, i) => (
                                    <React.Fragment key={label}>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? "bg-green-500 text-white" :
                                                step === i + 1 ? "bg-[#6A38C2] text-white" :
                                                    "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                                }`}>
                                                {step > i + 1 ? "✓" : i + 1}
                                            </div>
                                            <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? "text-[#6A38C2]" : "text-gray-400"}`}>
                                                {label}
                                            </span>
                                        </div>
                                        {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {/* Step 1: Email */}
                        {step === STEPS.EMAIL && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your email and we'll send an OTP</p>
                                </div>
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label>Email address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="pl-10 h-11"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold rounded-xl">
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending OTP...</> : "Send OTP"}
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* Step 2: OTP */}
                        {step === STEPS.OTP && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enter OTP</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        We sent a 6-digit OTP to <strong>{email}</strong>
                                    </p>
                                </div>
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label>One-Time Password</Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                placeholder="6-digit OTP"
                                                className="pl-10 h-11 text-center tracking-widest text-lg font-bold"
                                                maxLength={6}
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">Check your inbox and spam folder. OTP expires in 10 minutes.</p>
                                    </div>
                                    <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold rounded-xl">
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying...</> : "Verify OTP"}
                                    </Button>
                                    <button type="button" onClick={handleSendOtp} className="w-full text-sm text-[#6A38C2] hover:underline">
                                        Resend OTP
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Step 3: New Password */}
                        {step === STEPS.PASSWORD && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Password</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose a strong password</p>
                                </div>
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label>New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type={showPass ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="At least 6 characters"
                                                className="pl-10 h-11"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type={showPass ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Repeat password"
                                                className={`pl-10 h-11 ${confirmPassword && newPassword !== confirmPassword ? "border-red-400" : ""}`}
                                                required
                                            />
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500">Passwords don't match</p>
                                        )}
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                                        <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} className="rounded" />
                                        Show password
                                    </label>
                                    <Button
                                        type="submit"
                                        disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                                        className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold rounded-xl"
                                    >
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Resetting...</> : "Reset Password"}
                                    </Button>
                                </form>
                            </>
                        )}

                        {/* Step 4: Done */}
                        {step === STEPS.DONE && (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password Reset!</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Your password has been reset successfully. You can now log in with your new password.
                                </p>
                                <Button onClick={() => navigate("/login")} className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold rounded-xl">
                                    Go to Login
                                </Button>
                            </div>
                        )}

                        {/* Back to login */}
                        {step !== STEPS.DONE && (
                            <div className="mt-6 text-center">
                                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-[#6A38C2]">
                                    <ArrowLeft className="w-3 h-3" /> Back to Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
