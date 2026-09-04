import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { USER_API_END_POINT } from "@/utils/constant";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Loader2, Lock, Mail, ShieldCheck,
  KeyRound, ArrowLeft, Eye, EyeOff,
} from "lucide-react";

// ─── Forgot-password steps (inline, no separate page) ─────────────────────────
// "login"  → main sign-in form
// "email"  → enter admin email to receive OTP
// "otp"    → enter OTP
// "reset"  → enter + confirm new password

const AdminLogin = () => {
  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // ── Login form state ─────────────────────────────────────────────────────
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // ── Forgot-password state ─────────────────────────────────────────────────
  const [fpStep, setFpStep] = useState("login"); // login | email | otp | reset
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPwd, setFpNewPwd] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (user?.isAdmin) navigate("/admin/panel");
    }
  }, [user]);

  // ── Login submit ──────────────────────────────────────────────────────────
  const submitLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.email || !loginInput.password)
      return toast.error("Email and password are required");
    try {
      dispatch(setLoading(true));
      const res = await axios.post(
        `${USER_API_END_POINT}/admin/login`,
        loginInput,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        navigate("/admin/panel");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ── Forgot: step 1 — send OTP ─────────────────────────────────────────────
  const sendOtp = async () => {
    if (!fpEmail.trim()) return toast.error("Enter your admin email");
    setFpLoading(true);
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/forgot-password/send-otp`,
        { email: fpEmail.trim() }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setFpStep("otp");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot: step 2 — verify OTP ──────────────────────────────────────────
  const verifyOtp = async () => {
    if (fpOtp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setFpLoading(true);
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/forgot-password/verify-otp`,
        { email: fpEmail.trim(), otp: fpOtp }
      );
      if (res.data.success) {
        toast.success("OTP verified");
        setFpStep("reset");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot: step 3 — reset password ──────────────────────────────────────
  const resetPassword = async () => {
    if (fpNewPwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (fpNewPwd !== fpConfirm) return toast.error("Passwords do not match");
    setFpLoading(true);
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/forgot-password/reset`,
        { email: fpEmail.trim(), otp: fpOtp, newPassword: fpNewPwd }
      );
      if (res.data.success) {
        toast.success("Password reset successfully. You can now sign in.");
        // return to login form and pre-fill email
        setLoginInput({ email: fpEmail.trim(), password: "" });
        setFpStep("login");
        setFpOtp("");
        setFpNewPwd("");
        setFpConfirm("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Shared back button ────────────────────────────────────────────────────
  const backToLogin = () => {
    setFpStep("login");
    setFpEmail("");
    setFpOtp("");
    setFpNewPwd("");
    setFpConfirm("");
  };

  // ── Step labels for the header ────────────────────────────────────────────
  const stepMeta = {
    login: { title: "Administrator Sign In", sub: "Restricted access — authorised personnel only" },
    email: { title: "Forgot Password", sub: "Enter your admin email to receive a reset OTP" },
    otp: { title: "Enter OTP", sub: `A 6-digit code was sent to ${fpEmail}` },
    reset: { title: "Set New Password", sub: "Choose a strong new password for your admin account" },
  };
  const { title, sub } = stepMeta[fpStep];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6A38C2] shadow-lg shadow-purple-900/50 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <Link to="/">
              <h1 className="text-3xl font-bold text-white hover:opacity-80 transition-opacity">
                Get<span className="text-[#F83002]">Hired</span>
              </h1>
            </Link>
            <p className="text-gray-400 text-sm mt-1">Admin Control Panel</p>
          </div>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">

            {/* Card header — back arrow for forgot-password steps */}
            <div className="mb-6">
              {fpStep !== "login" && (
                <button
                  onClick={backToLogin}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </button>
              )}
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-gray-400 text-sm mt-1">{sub}</p>
            </div>

            {/* ── Step: Login ── */}
            {fpStep === "login" && (
              <form onSubmit={submitLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-300">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="email"
                      value={loginInput.email}
                      onChange={(e) => setLoginInput({ ...loginInput, email: e.target.value })}
                      placeholder="admin@example.com"
                      autoComplete="username"
                      className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Password</Label>
                    <button
                      type="button"
                      onClick={() => setFpStep("email")}
                      className="text-xs text-[#6A38C2] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={loginInput.password}
                      onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pl-10 pr-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl"
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                    : <><ShieldCheck className="mr-2 h-4 w-4" /> Sign In as Admin</>}
                </Button>
              </form>
            )}

            {/* ── Step: Enter email for OTP ── */}
            {fpStep === "email" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-300">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="email"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                    />
                  </div>
                </div>
                <Button
                  onClick={sendOtp}
                  disabled={fpLoading}
                  className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl"
                >
                  {fpLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                    : "Send OTP to Email"}
                </Button>
              </div>
            )}

            {/* ── Step: Enter OTP ── */}
            {fpStep === "otp" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-300">6-digit OTP</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    className="h-14 text-center tracking-[0.5em] text-2xl font-bold bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                  />
                  <p className="text-xs text-gray-500">
                    Check your inbox (and spam). OTP expires in 10 minutes.
                  </p>
                </div>
                <Button
                  onClick={verifyOtp}
                  disabled={fpLoading || fpOtp.length !== 6}
                  className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl"
                >
                  {fpLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                    : "Verify OTP"}
                </Button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={fpLoading}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            )}

            {/* ── Step: Reset password ── */}
            {fpStep === "reset" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-300">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type={showNewPwd ? "text" : "password"}
                      value={fpNewPwd}
                      onChange={(e) => setFpNewPwd(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pl-10 pr-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type={showNewPwd ? "text" : "password"}
                      value={fpConfirm}
                      onChange={(e) => setFpConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                    />
                  </div>
                  {fpConfirm && fpNewPwd !== fpConfirm && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={resetPassword}
                  disabled={fpLoading || fpNewPwd.length < 6 || fpNewPwd !== fpConfirm}
                  className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl"
                >
                  {fpLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                    : "Reset Password"}
                </Button>
              </div>
            )}

            {/* Footer note — only on login step */}
            {fpStep === "login" && (
              <p className="text-center text-xs text-gray-600 mt-6">
                This page is for administrators only. Unauthorised access attempts are logged.
              </p>
            )}
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Not an admin?{" "}
            <Link to="/login" className="text-[#6A38C2] hover:underline font-medium">
              Go to regular login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
