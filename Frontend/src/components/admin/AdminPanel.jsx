import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_VERIFICATION_API_END_POINT } from "@/utils/constant";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Table, TableBody, TableCaption, TableCell,
    TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
    ShieldCheck, ShieldAlert, AlertTriangle, Ban,
    Bot, Loader2, ChevronDown, ChevronUp,
    CheckCircle2, XCircle, TrendingUp, TrendingDown,
    Lightbulb, ThumbsUp, ThumbsDown, HelpCircle,
} from "lucide-react";

// ─── AI analysis result panel ─────────────────────────────────────────────────

const VERDICT_CONFIG = {
    legitimate: {
        label: "Legitimate",
        cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        bar: "bg-green-500",
        icon: <ShieldCheck className="w-4 h-4 text-green-600" />,
    },
    likely_legitimate: {
        label: "Likely Legitimate",
        cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        bar: "bg-emerald-400",
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    },
    uncertain: {
        label: "Uncertain",
        cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        bar: "bg-yellow-400",
        icon: <HelpCircle className="w-4 h-4 text-yellow-600" />,
    },
    suspicious: {
        label: "Suspicious",
        cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        bar: "bg-orange-500",
        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
    },
    fraudulent: {
        label: "Fraudulent",
        cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        bar: "bg-red-500",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
    },
};

const REC_CONFIG = {
    approve: {
        label: "Recommend: Approve",
        cls: "text-green-700 dark:text-green-300",
        icon: <ThumbsUp className="w-3.5 h-3.5" />,
    },
    investigate: {
        label: "Recommend: Investigate",
        cls: "text-yellow-700 dark:text-yellow-300",
        icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
    reject: {
        label: "Recommend: Reject",
        cls: "text-red-700 dark:text-red-300",
        icon: <ThumbsDown className="w-3.5 h-3.5" />,
    },
};

const AiAnalysisPanel = ({ analysis }) => {
    const verdict = VERDICT_CONFIG[analysis.verdict] ?? VERDICT_CONFIG.uncertain;
    const rec = REC_CONFIG[analysis.recommendation] ?? REC_CONFIG.investigate;

    return (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3 text-sm">

            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Verdict badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${verdict.cls}`}>
                    {verdict.icon} {verdict.label}
                </span>

                {/* Score bar */}
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${verdict.bar}`}
                            style={{ width: `${analysis.legitimacyScore}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 shrink-0">
                        {analysis.legitimacyScore}/100
                    </span>
                </div>

                {/* Recommendation */}
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${rec.cls}`}>
                    {rec.icon} {rec.label}
                </span>

                {/* Confidence */}
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    Confidence: {analysis.confidence}
                    {!analysis.usedAI && " · fallback mode"}
                </span>
            </div>

            {/* Summary */}
            {analysis.summary && (
                <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700 leading-relaxed">
                    {analysis.summary}
                </p>
            )}

            {/* Signals + Red flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.positiveSignals?.length > 0 && (
                    <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                            <TrendingUp className="w-3 h-3" /> Positive Signals
                        </p>
                        <ul className="space-y-1">
                            {analysis.positiveSignals.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {analysis.redFlags?.length > 0 && (
                    <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                            <TrendingDown className="w-3 h-3" /> Red Flags
                        </p>
                        <ul className="space-y-1">
                            {analysis.redFlags.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Analyzed at */}
            {analysis.analyzedAt && (
                <p className="text-right text-xs text-gray-400">
                    Analysed at {new Date(analysis.analyzedAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", hour12: true,
                    })}
                </p>
            )}
        </div>
    );
};

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

const AdminPanel = () => {
    const [companies, setCompanies] = useState([]);
    const [suspiciousJobs, setSuspiciousJobs] = useState([]);
    const [tab, setTab] = useState("companies");
    const [noteMap, setNoteMap] = useState({});
    const [loading, setLoading] = useState(false);

    // analysisMap: { [companyId]: { status: "idle"|"loading"|"done"|"error", data: analysisObj|null } }
    const [analysisMap, setAnalysisMap] = useState({});
    // expandedMap: { [companyId]: boolean } — whether the panel is open
    const [expandedMap, setExpandedMap] = useState({});

    useEffect(() => {
        fetchCompanies();
        fetchSuspiciousJobs();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${COMPANY_VERIFICATION_API_END_POINT}/admin/companies`, { withCredentials: true });
            if (res.data.success) setCompanies(res.data.companies);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load companies");
        }
    };

    const fetchSuspiciousJobs = async () => {
        try {
            const res = await axios.get(`${COMPANY_VERIFICATION_API_END_POINT}/admin/jobs/suspicious`, { withCredentials: true });
            if (res.data.success) setSuspiciousJobs(res.data.jobs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompanyAction = async (action, companyId) => {
        setLoading(true);
        try {
            const endpoint = { approve: "approve", reject: "reject", ban: "ban" }[action];
            const res = await axios.post(
                `${COMPANY_VERIFICATION_API_END_POINT}/admin/companies/${endpoint}`,
                { companyId, adminNote: noteMap[companyId] || "" },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCompanies();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed");
        } finally { setLoading(false); }
    };

    const handleJobAction = async (action, jobId) => {
        setLoading(true);
        try {
            const endpoint = action === "approve" ? "approve" : "reject";
            const res = await axios.post(
                `${COMPANY_VERIFICATION_API_END_POINT}/admin/jobs/${endpoint}`,
                { jobId },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchSuspiciousJobs();
            }
        } catch (err) {
            toast.error("Action failed");
        } finally { setLoading(false); }
    };

    // ── AI analysis ───────────────────────────────────────────────────────────
    const handleAnalyze = async (companyId) => {
        // If already done, just toggle expand/collapse
        const existing = analysisMap[companyId];
        if (existing?.status === "done") {
            setExpandedMap((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
            return;
        }

        // Start loading
        setAnalysisMap((prev) => ({ ...prev, [companyId]: { status: "loading", data: null } }));
        setExpandedMap((prev) => ({ ...prev, [companyId]: true }));

        try {
            const res = await axios.get(
                `${COMPANY_VERIFICATION_API_END_POINT}/admin/companies/${companyId}/analyze`,
                { withCredentials: true }
            );
            if (res.data.success) {
                setAnalysisMap((prev) => ({
                    ...prev,
                    [companyId]: { status: "done", data: res.data.analysis },
                }));
            }
        } catch (err) {
            toast.error("AI analysis failed. Check backend logs.");
            setAnalysisMap((prev) => ({ ...prev, [companyId]: { status: "error", data: null } }));
        }
    };

    const statusBadge = (status) => ({
        approved: <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>,
        rejected: <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>,
        banned: <Badge className="bg-gray-900 text-white text-xs">Banned</Badge>,
        pending: <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>,
    }[status]);

    return (
        <div className="min-h-screen flex flex-col dark:bg-gray-950 bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto w-full px-6 my-10 flex-1">

                {/* Header */}
                <div className="flex items-center mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShieldCheck className="w-6 h-6 text-[#6A38C2]" /> Admin Panel
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={tab === "companies" ? "default" : "outline"}
                        onClick={() => setTab("companies")}
                        className="flex items-center gap-1"
                    >
                        <ShieldAlert className="w-4 h-4" /> Companies ({companies.length})
                    </Button>
                    <Button
                        variant={tab === "jobs" ? "default" : "outline"}
                        onClick={() => setTab("jobs")}
                        className="flex items-center gap-1"
                    >
                        <AlertTriangle className="w-4 h-4" /> Suspicious Jobs ({suspiciousJobs.length})
                    </Button>
                </div>

                {/* ── Companies Tab ── */}
                {tab === "companies" && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                        <Table>
                            <TableCaption className="mb-3">All registered companies</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Trust Score</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>AI Analysis</TableHead>
                                    <TableHead>Admin Note</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-gray-400 py-10">
                                            No companies registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {companies.map((company) => {
                                    const ai = analysisMap[company._id];
                                    const expanded = expandedMap[company._id];

                                    return (
                                        <React.Fragment key={company._id}>
                                            <TableRow className="align-top">

                                                {/* Company name + website */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                                        {company.name}
                                                        {company.isVerified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{company.website || "No website"}</div>
                                                </TableCell>

                                                {/* Owner */}
                                                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                                                    {company.userId?.fullname}
                                                </TableCell>

                                                {/* Email */}
                                                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                                                    {company.companyEmail || company.userId?.email}
                                                </TableCell>

                                                {/* Trust score */}
                                                <TableCell>
                                                    <span className={`font-semibold text-sm ${company.trustScore >= 80 ? "text-green-600" :
                                                        company.trustScore >= 60 ? "text-blue-600" :
                                                            company.trustScore >= 40 ? "text-yellow-600" : "text-red-500"
                                                        }`}>
                                                        {company.trustScore ?? 0}/100
                                                    </span>
                                                </TableCell>

                                                {/* Status badge */}
                                                <TableCell>{statusBadge(company.verificationStatus)}</TableCell>

                                                {/* AI Analysis button */}
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs flex items-center gap-1 border-[#6A38C2]/40 text-[#6A38C2] hover:bg-[#6A38C2]/5 dark:text-purple-300 dark:border-purple-700"
                                                        onClick={() => handleAnalyze(company._id)}
                                                        disabled={ai?.status === "loading"}
                                                    >
                                                        {ai?.status === "loading" ? (
                                                            <><Loader2 className="w-3 h-3 animate-spin" /> Analysing…</>
                                                        ) : ai?.status === "done" ? (
                                                            expanded
                                                                ? <><ChevronUp className="w-3 h-3" /> Hide</>
                                                                : <><ChevronDown className="w-3 h-3" /> View</>
                                                        ) : (
                                                            <><Bot className="w-3 h-3" /> AI Analyse</>
                                                        )}
                                                    </Button>
                                                </TableCell>

                                                {/* Admin note */}
                                                <TableCell>
                                                    <Input
                                                        className="text-xs h-7 w-36"
                                                        placeholder="Add note..."
                                                        value={noteMap[company._id] || ""}
                                                        onChange={(e) => setNoteMap({ ...noteMap, [company._id]: e.target.value })}
                                                    />
                                                </TableCell>

                                                {/* Approve / Reject / Ban */}
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                            disabled={loading || company.verificationStatus === "approved"}
                                                            onClick={() => handleCompanyAction("approve", company._id)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-red-600 border-red-300"
                                                            disabled={loading || company.verificationStatus === "rejected"}
                                                            onClick={() => handleCompanyAction("reject", company._id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs bg-gray-900 hover:bg-gray-800 text-white"
                                                            disabled={loading || company.verificationStatus === "banned"}
                                                            onClick={() => handleCompanyAction("ban", company._id)}
                                                        >
                                                            <Ban className="w-3 h-3 mr-1" /> Ban
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* AI analysis expansion row — full width */}
                                            {expanded && ai?.status === "done" && ai.data && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-0 pb-3 px-4">
                                                        <AiAnalysisPanel analysis={ai.data} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* ── Suspicious Jobs Tab ── */}
                {tab === "jobs" && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                        <Table>
                            <TableCaption className="mb-3">Jobs flagged for review</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Posted By</TableHead>
                                    <TableHead>Detection Method</TableHead>
                                    <TableHead>Suspicious Reasons</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suspiciousJobs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                                            No suspicious jobs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {suspiciousJobs.map((job) => (
                                    <TableRow key={job._id}>
                                        <TableCell className="font-medium text-gray-900 dark:text-white">
                                            {job.title}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                {job.company?.name}
                                                {job.company?.isVerified && <ShieldCheck className="w-3 h-3 text-green-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                                            {job.created_by?.fullname}
                                        </TableCell>
                                        <TableCell>
                                            {job.detectionMethod && (
                                                <Badge className={`text-xs ${job.detectionMethod === "hybrid" ? "bg-purple-100 text-purple-700" :
                                                    job.detectionMethod === "ai" ? "bg-blue-100 text-blue-700" :
                                                        job.detectionMethod === "keyword" ? "bg-orange-100 text-orange-700" :
                                                            "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {job.detectionMethod}
                                                    {job.aiConfidenceScore > 0 && ` · ${job.aiConfidenceScore}%`}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {job.suspiciousReasons?.map((reason, i) => (
                                                    <Badge key={i} className="bg-red-100 text-red-700 text-xs">
                                                        {reason}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                    disabled={loading}
                                                    onClick={() => handleJobAction("approve", job._id)}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs text-red-600 border-red-300"
                                                    disabled={loading}
                                                    onClick={() => handleJobAction("reject", job._id)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default AdminPanel;
