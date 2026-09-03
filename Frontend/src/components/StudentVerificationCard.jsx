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
    XCircle, Loader2, RefreshCw, Mail, Sparkles, TrendingUp,
    TrendingDown, Lightbulb, Tag, BadgeCheck, User,
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

// ── AI ATS Feedback Panel ─────────────────────────────────────────────────────
const AiAtsFeedbackPanel = ({ feedback, atsScore }) => {
    if (!feedback || feedback.source === "keyword_fallback") return null;

    const levelColors = {
        fresher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        junior: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        mid: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        senior: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        unknown: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };

    return (
        <div className="p-5 bg-white dark:bg-gray-900 border border-[#6A38C2]/30 dark:border-[#6A38C2]/20 rounded-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6A38C2]" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Resume Analysis</h3>
                    <span className="text-xs text-gray-400 font-normal">(powered by Gemini)</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Level badge */}
                    {feedback.levelDetected && feedback.levelDetected !== "unknown" && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${levelColors[feedback.levelDetected] || levelColors.unknown}`}>
                            <User className="w-3 h-3 inline mr-1" />
                            {feedback.levelDetected}
                        </span>
                    )}
                    {/* Score breakdown badge */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                        AI: {feedback.aiScore ?? "—"} · KW: {feedback.keywordScore ?? "—"} · Final: {atsScore}
                    </span>
                </div>
            </div>

            {/* Summary */}
            {feedback.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 leading-relaxed border border-gray-100 dark:border-gray-700">
                    {feedback.summary}
                </p>
            )}

            {/* Strengths + Gaps side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Strengths */}
                {feedback.strengths?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            <TrendingUp className="w-3.5 h-3.5" /> Strengths
                        </p>
                        <ul className="space-y-1.5">
                            {feedback.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Gaps */}
                {feedback.gaps?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
                            <TrendingDown className="w-3.5 h-3.5" /> Gaps
                        </p>
                        <ul className="space-y-1.5">
                            {feedback.gaps.map((g, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    {g}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {feedback.suggestions?.length > 0 && (
                <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6A38C2] uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5" /> Suggestions
                    </p>
                    <ul className="space-y-1.5">
                        {feedback.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="w-5 h-5 rounded-full bg-[#6A38C2]/10 text-[#6A38C2] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Found */}
                {feedback.keywordsFound?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" /> Keywords Found
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {feedback.keywordsFound.map((k, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Missing */}
                {feedback.keywordsMissing?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" /> Keywords Missing
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {feedback.keywordsMissing.map((k, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {feedback.sectionsFound?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            <BadgeCheck className="w-3.5 h-3.5" /> Sections Found
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {feedback.sectionsFound.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {feedback.sectionsMissing?.length > 0 && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" /> Sections Missing
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {feedback.sectionsMissing.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Analyzed at */}
            {feedback.analyzedAt && (
                <p className="text-xs text-gray-400 text-right">
                    Last analyzed: {new Date(feedback.analyzedAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", hour12: true,
                    })}
                </p>
            )}
        </div>
    );
};
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
            if (res.data.success) {
                toast.success(`ATS Score: ${res.data.atsScore}/100 — AI analysis updated`);
                fetchStatus(); // re-fetch full verification including aiAtsFeedback
            }
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
        eligibilityStatus, aiAtsFeedback,
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

            {/* ── AI ATS Feedback Panel ── */}
            {hasResume && (
                <AiAtsFeedbackPanel feedback={aiAtsFeedback} atsScore={atsScore} />
            )}

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
