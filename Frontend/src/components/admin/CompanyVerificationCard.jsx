import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_VERIFICATION_API_END_POINT } from "@/utils/constant";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
    ShieldCheck, ShieldAlert, Globe, Mail, Building2,
    CheckCircle2, XCircle, Star, AlertCircle,
} from "lucide-react";

const ScoreBar = ({ value, color = "bg-blue-500" }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
);

const StatusIcon = ({ ok }) =>
    ok ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-400 shrink-0" />;

const CompanyVerificationCard = ({ companyId }) => {
    const [verification, setVerification] = useState(null);
    const [companyEmail, setCompanyEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [linkedin, setLinkedin] = useState("");
    const [gst, setGst] = useState("");
    const [cin, setCin] = useState("");
    const [website, setWebsite] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companyId) fetchStatus();
    }, [companyId]);

    useEffect(() => {
        if (verification) {
            setLinkedin(verification.linkedinUrl || "");
            setGst(verification.gstNumber || "");
            setCin(verification.cinNumber || "");
            setWebsite(verification.websiteDomain ? `https://${verification.websiteDomain}` : "");
            if (verification.companyEmail) setCompanyEmail(verification.companyEmail);
        }
    }, [verification]);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${COMPANY_VERIFICATION_API_END_POINT}/status/${companyId}`, { withCredentials: true });
            if (res.data.success) setVerification(res.data.verification);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendOtp = async () => {
        if (!companyEmail) return toast.error("Enter your company email");
        setLoading(true);
        try {
            const res = await axios.post(`${COMPANY_VERIFICATION_API_END_POINT}/send-otp`, { companyId, companyEmail }, { withCredentials: true });
            if (res.data.success) { setOtpSent(true); toast.success("OTP sent to company email"); }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) return toast.error("Enter a valid 6-digit OTP");
        setLoading(true);
        try {
            const res = await axios.post(`${COMPANY_VERIFICATION_API_END_POINT}/verify-otp`, { companyId, otp }, { withCredentials: true });
            if (res.data.success) { toast.success("Company email verified!"); fetchStatus(); setOtpSent(false); }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally { setLoading(false); }
    };

    const handleSaveInfo = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${COMPANY_VERIFICATION_API_END_POINT}/update-info`,
                { companyId, linkedinUrl: linkedin, gstNumber: gst, cinNumber: cin, website },
                { withCredentials: true }
            );
            if (res.data.success) { toast.success("Company info saved"); fetchStatus(); }
        } catch (err) {
            toast.error("Failed to save info");
        } finally { setLoading(false); }
    };

    if (!verification) return null;

    const {
        isEmailVerified, isWebsiteHttps, isDomainMatched,
        trustScore, verificationStatus, isVerified, adminNote,
    } = verification;

    const trustColor = trustScore >= 80 ? "bg-green-500" : trustScore >= 60 ? "bg-blue-500" : trustScore >= 40 ? "bg-yellow-500" : "bg-red-500";

    const statusBadge = {
        approved: <Badge className="bg-green-100 text-green-700">Approved</Badge>,
        rejected: <Badge className="bg-red-100 text-red-700">Rejected</Badge>,
        banned: <Badge className="bg-gray-900 text-white">Banned</Badge>,
        pending: <Badge className="bg-yellow-100 text-yellow-700">Pending Review</Badge>,
    }[verificationStatus] || null;

    return (
        <div className="space-y-4 mt-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <div className="flex items-center gap-2 flex-1">
                    {isVerified ? <ShieldCheck className="w-7 h-7 text-green-500" /> : <ShieldAlert className="w-7 h-7 text-yellow-500" />}
                    <div>
                        <h2 className="font-semibold text-lg">Company Verification</h2>
                        <p className="text-sm text-gray-500">
                            {isVerified ? "Your company is verified and can post jobs publicly." : "Complete verification to post jobs publicly."}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isVerified && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified Company
                        </Badge>
                    )}
                    {statusBadge}
                </div>
            </div>

            {adminNote && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Admin note:</strong> {adminNote}
                </div>
            )}

            {/* Trust Score */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">Company Trust Score</span>
                    <span className="ml-auto text-2xl font-bold">{trustScore}<span className="text-sm font-normal text-gray-400">/100</span></span>
                </div>
                <ScoreBar value={trustScore} color={trustColor} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                    <div className="flex items-center gap-2"><StatusIcon ok={isEmailVerified} /><span>Official email verified</span></div>
                    <div className="flex items-center gap-2"><StatusIcon ok={isWebsiteHttps} /><span>Website uses HTTPS</span></div>
                    <div className="flex items-center gap-2"><StatusIcon ok={isDomainMatched} /><span>Email & website domain match</span></div>
                    <div className="flex items-center gap-2"><StatusIcon ok={!!verification.linkedinUrl} /><span>LinkedIn page added</span></div>
                    <div className="flex items-center gap-2"><StatusIcon ok={!!(verification.gstNumber || verification.cinNumber)} /><span>GST / CIN provided</span></div>
                </div>
            </div>

            {/* Email Verification */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4" /> Company Email Verification</h3>
                {isEmailVerified ? (
                    <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Verified: {verification.companyEmail}</p>
                ) : (
                    <>
                        <p className="text-xs text-gray-500">Use your official company domain email (not Gmail/Yahoo).</p>
                        <div className="space-y-2">
                            <Label>Company Email</Label>
                            <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="you@yourcompany.com" disabled={otpSent} />
                        </div>
                        {!otpSent ? (
                            <Button onClick={handleSendOtp} disabled={loading} size="sm">{loading ? "Sending..." : "Send OTP"}</Button>
                        ) : (
                            <div className="space-y-2">
                                <Label>Enter OTP</Label>
                                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" maxLength={6} />
                                <div className="flex gap-2">
                                    <Button onClick={handleVerifyOtp} disabled={loading} size="sm">{loading ? "Verifying..." : "Verify OTP"}</Button>
                                    <button onClick={() => setOtpSent(false)} className="text-xs text-blue-500 hover:underline">Change email</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Website & Legal Info */}
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Website & Legal Details</h3>
                {verification.websiteDomain && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${isWebsiteHttps ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {isWebsiteHttps ? "✓ HTTPS" : "✗ Not HTTPS"}
                        </span>
                        <span className={`px-2 py-1 rounded ${isDomainMatched ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {isDomainMatched ? "✓ Domain matched" : "✗ Domain mismatch"}
                        </span>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label>Company Website</Label>
                        <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
                    </div>
                    <div className="space-y-1">
                        <Label>LinkedIn Page</Label>
                        <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..." />
                    </div>
                    <div className="space-y-1">
                        <Label>GST Number</Label>
                        <Input value={gst} onChange={(e) => setGst(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div className="space-y-1">
                        <Label>CIN Number</Label>
                        <Input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="U12345MH2020PTC123456" />
                    </div>
                </div>
                <Button onClick={handleSaveInfo} disabled={loading} size="sm">{loading ? "Saving..." : "Save Info"}</Button>
            </div>
        </div>
    );
};

export default CompanyVerificationCard;
