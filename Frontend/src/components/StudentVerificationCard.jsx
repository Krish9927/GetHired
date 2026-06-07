import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { VERIFICATION_API_END_POINT } from "@/utils/constant";
import { setVerification, setUser } from "@/redux/authSlice";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    ShieldCheck, ShieldAlert, GraduationCap, FileText,
    Github, Linkedin, Star, AlertCircle, CheckCircle2,
    XCircle, Loader2, RefreshCw, Mail,
} from "lucide-react";

// ── Sub-components ────────────────────────────────────────────────────────────
const ScoreBar = ({ value, color = "bg-blue-500" }) => (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
);

const CheckItem = ({ ok, label, action }) => (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        {ok
            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            : <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
        <span className={`text-sm flex-1 ${ok ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}`}>{label}</span>
        {action && !ok && action}
    </div>
);

// ── OTP Section (inline, no dialog) ──────────────────────────────────────────
const OtpSection = ({ userEmail, onVerified }) => {
    const [step, setStep] = useState("idle"); // idle | sent | verifying
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const sendOtp = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/send-otp`, {}, { withCredentials: true });
            if (res.data.success) {
                setStep("sent");
                toast.success(`OTP sent to ${userEmail}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (otp.length !== 6) return toast.error("Enter a valid 6-digit OTP");
        setLoading(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/verify-otp`, { otp }, { withCredentials: true });
            if (res.data.success) {
                toast.success("Email verified!");
                onVerified();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-3 p-4 rounded-xl border border-dashed border-[#6A38C2]/40 bg-[#6A38C2]/5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-[#6A38C2]" />
                Verify <strong>{userEmail}</strong>
            </div>
            {step === "idle" && (
                <Button size="sm" onClick={sendOtp} disabled={loading} className="bg-[#6A38C2] hover:bg-[#5b30a6] w-full">
                    {loading ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />Sending...</> : "Send OTP to Email"}
                </Button>
            )}
            {step === "sent" && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                        Check your inbox (and spam folder). OTP expires in 10 minutes.
                        <br />
                        <span className="text-amber-600 font-medium">No email configured? Check the backend console for the OTP.</span>
                    </p>
                    <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="text-center tracking-widest text-lg font-bold h-12"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={verifyOtp} disabled={loading || otp.length !== 6} className="bg-[#6A38C2] hover:bg-[#5b30a6] flex-1">
                            {loading ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />Verifying...</> : "Verify OTP"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={sendOtp} disabled={loading}>
                            Resend
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentVerificationCard = () => {
    const dispatch = useDispatch();
    const { user, verification } = useSelector((store) => store.auth);
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [cgpa, setCgpa] = useState("");
    const [college, setCollege] = useState("");
    const [cgpaFile, setCgpaFile] = useState(null);
    const [savingLinks, setSavingLinks] = useState(false);
    const [savingCgpa, setSavingCgpa] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [showOtp, setShowOtp] = useState(false);

    useEffect(() => { fetchStatus(); }, []);

    useEffect(() => {
        if (verification) {
            setGithub(user?.profile?.githubUrl || "");
            setLinkedin(user?.profile?.linkedinUrl || "");
            setCgpa(verification.cgpa?.toString() || "");
            setCollege(user?.profile?.college || "");
        }
    }, [verification]);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${VERIFICATION_API_END_POINT}/status`, { withCredentials: true });
            if (res.data.success) dispatch(setVerification(res.data.verification));
        } catch (err) { console.error(err); }
    };

    const handleSaveLinks = async () => {
        setSavingLinks(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/social-links`,
                { githubUrl: github, linkedinUrl: linkedin }, { withCredentials: true });
            if (res.data.success) { toast.success("Social links saved"); fetchStatus(); }
        } catch { toast.error("Failed to save links"); }
        finally { setSavingLinks(false); }
    };

    const handleSaveCgpa = async () => {
        setSavingCgpa(true);
        try {
            const formData = new FormData();
            if (cgpa) formData.append("cgpa", cgpa);
            if (college) formData.append("college", college);
            if (cgpaFile) formData.append("file", cgpaFile);
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/cgpa`, formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
            if (res.data.success) { toast.success("CGPA info saved"); fetchStatus(); }
        } catch (err) { toast.error(err.response?.data?.message || "Failed to save CGPA"); }
        finally { setSavingCgpa(false); }
    };

    const handleRecalculateAts = async () => {
        setRecalculating(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/recalculate-ats`, {}, { withCredentials: true });
            if (res.data.success) { toast.success(`ATS Score: ${res.data.atsScore}/100`); fetchStatus(); }
        } catch (err) { toast.error(err.response?.data?.message || "Failed to recalculate"); }
        finally { setRecalculating(false); }
    };

    if (!verification) return (
        <div className="max-w-4xl mx-auto my-5 p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A38C2]" />
        </div>
    );

    const {
        isEmailVerified, isCollegeEmail, isVerified,
        atsScore, atsFeedback, trustScore, profileCompleteness,
        cgpa: verCgpa, hasCgpaProof, hasResume, hasGithub, hasLinkedin,
        eligibilityStatus,
    } = verification;

    const trustColor = trustScore >= 80 ? "bg-green-500" : trustScore >= 60 ? "bg-blue-500" : trustScore >= 40 ? "bg-yellow-400" : "bg-red-400";
    const atsColor = atsScore >= 80 ? "bg-green-500" : atsScore >= 60 ? "bg-blue-500" : atsScore >= 40 ? "bg-yellow-400" : "bg-red-400";

    return (
        <div className="max-w-4xl mx-auto space-y-4 my-6">

            {/* ── Status Banner ── */}
            <div className={`rounded-2xl p-5 border ${isVerified ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"}`}>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {isVerified
                            ? <ShieldCheck className="w-8 h-8 text-green-500 shrink-0" />
                            : <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />}
                        <div>
                            <h2 className="font-bold text-base text-gray-900 dark:text-white">
                                {isVerified ? "Verified Candidate" : "Verification Incomplete"}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{eligibilityStatus?.message}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {isVerified && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified
                            </Badge>
                        )}
                        {isCollegeEmail && (
                            <Badge className="bg-blue-100 text-blue-700 gap-1">
                                <GraduationCap className="w-3 h-3" /> College Email
                            </Badge>
                        )}
                        <Badge className={`${eligibilityStatus?.status === "eligible" ? "bg-green-100 text-green-700" :
                                eligibilityStatus?.status === "limited" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-600"}`}>
                            {eligibilityStatus?.status?.toUpperCase()}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* ── Score Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Trust Score", value: trustScore, color: trustColor, icon: <Star className="w-4 h-4 text-yellow-500" />, unit: "/100" },
                    { label: "ATS Score", value: atsScore, color: atsColor, icon: <FileText className="w-4 h-4 text-blue-500" />, unit: "/100", extra: atsFeedback?.message },
                    { label: "Profile Complete", value: profileCompleteness, color: "bg-purple-500", icon: <AlertCircle className="w-4 h-4 text-purple-500" />, unit: "%" },
                ].map(({ label, value, color, icon, unit, extra }) => (
                    <div key={label} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {icon} {label}
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{value}</span>
                            <span className="text-sm text-gray-400 mb-1">{unit}</span>
                        </div>
                        <ScoreBar value={value} color={color} />
                        {extra && <p className={`text-xs ${value >= 60 ? "text-green-600" : "text-amber-600"}`}>{extra}</p>}
                        {label === "ATS Score" && hasResume && (
                            <button onClick={handleRecalculateAts} disabled={recalculating} className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                <RefreshCw className={`w-3 h-3 ${recalculating ? "animate-spin" : ""}`} />
                                {recalculating ? "Recalculating..." : "Recalculate"}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Verification Checklist ── */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Verification Checklist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <CheckItem ok={isEmailVerified} label="Email verified"
                        action={
                            <button onClick={() => setShowOtp(!showOtp)} className="text-xs font-semibold text-[#6A38C2] hover:underline shrink-0">
                                {showOtp ? "Hide" : "Verify now →"}
                            </button>
                        }
                    />
                    <CheckItem ok={isCollegeEmail} label="College email (.edu / .ac.in)" />
                    <CheckItem ok={hasResume} label="Resume uploaded" />
                    <CheckItem ok={atsScore >= 60} label={`ATS score ≥ 60 (current: ${atsScore})`} />
                    <CheckItem ok={hasLinkedin} label="LinkedIn profile added" />
                    <CheckItem ok={hasGithub} label="GitHub profile added" />
                    <CheckItem ok={hasCgpaProof} label="CGPA proof uploaded" />
                    <CheckItem ok={profileCompleteness >= 80} label={`Profile ≥ 80% complete (current: ${profileCompleteness}%)`} />
                </div>

                {/* Inline OTP */}
                {showOtp && !isEmailVerified && (
                    <OtpSection userEmail={user?.email} onVerified={() => { fetchStatus(); setShowOtp(false); }} />
                )}
            </div>

            {/* ── Social Links ── */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Social Profiles
                    <span className="text-xs text-gray-400 font-normal">(adds +10 pts each to trust score)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm"><Github className="w-4 h-4" /> GitHub URL</Label>
                        <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm"><Linkedin className="w-4 h-4" /> LinkedIn URL</Label>
                        <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="h-10" />
                    </div>
                </div>
                <Button onClick={handleSaveLinks} disabled={savingLinks} size="sm" className="bg-[#6A38C2] hover:bg-[#5b30a6]">
                    {savingLinks ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />Saving...</> : "Save Links"}
                </Button>
            </div>

            {/* ── CGPA & College ── */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#6A38C2]" /> Academic Info
                    <span className="text-xs text-gray-400 font-normal">(+10 pts to trust score)</span>
                </h3>
                {verCgpa && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        Current CGPA: <strong className="text-gray-900 dark:text-white">{verCgpa} / 10</strong>
                        {hasCgpaProof && <Badge className="bg-green-100 text-green-700 text-xs ml-auto">Proof uploaded</Badge>}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-sm">CGPA (out of 10)</Label>
                        <Input type="number" min="0" max="10" step="0.01" value={cgpa}
                            onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 8.5" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">College / University</Label>
                        <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="IIT Bombay, VIT, etc." className="h-10" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm">Upload CGPA Proof <span className="text-gray-400">(marksheet, transcript — PDF/image)</span></Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCgpaFile(e.target.files[0])} className="h-10 cursor-pointer" />
                </div>
                <Button onClick={handleSaveCgpa} disabled={savingCgpa} size="sm" className="bg-[#6A38C2] hover:bg-[#5b30a6]">
                    {savingCgpa ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />Saving...</> : "Save Academic Info"}
                </Button>
            </div>
        </div>
    );
};

export default StudentVerificationCard;
