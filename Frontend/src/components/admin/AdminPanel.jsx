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
import { ShieldCheck, ShieldAlert, AlertTriangle, Ban } from "lucide-react";

const AdminPanel = () => {
    const [companies, setCompanies] = useState([]);
    const [suspiciousJobs, setSuspiciousJobs] = useState([]);
    const [tab, setTab] = useState("companies");
    const [noteMap, setNoteMap] = useState({});
    const [loading, setLoading] = useState(false);

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

    const statusBadge = (status) => ({
        approved: <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>,
        rejected: <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>,
        banned: <Badge className="bg-gray-900 text-white text-xs">Banned</Badge>,
        pending: <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>,
    }[status]);

    return (
        <div className="mx-20 min-h-screen flex flex-col">
            <Navbar />
            <div className="max-w-6xl mx-auto my-10">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-blue-600" /> Admin Panel
                </h1>

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

                {/* Companies Tab */}
                {tab === "companies" && (
                    <Table>
                        <TableCaption>All registered companies</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Trust Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Admin Note</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-medium">
                                            {company.name}
                                            {company.isVerified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <div className="text-xs text-gray-400">{company.website || "No website"}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{company.userId?.fullname}</TableCell>
                                    <TableCell className="text-sm">{company.companyEmail || company.userId?.email}</TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${company.trustScore >= 80 ? "text-green-600" :
                                            company.trustScore >= 60 ? "text-blue-600" :
                                                company.trustScore >= 40 ? "text-yellow-600" : "text-red-500"
                                            }`}>{company.trustScore ?? 0}/100</span>
                                    </TableCell>
                                    <TableCell>{statusBadge(company.verificationStatus)}</TableCell>
                                    <TableCell>
                                        <Input
                                            className="text-xs h-7 w-36"
                                            placeholder="Add note..."
                                            value={noteMap[company._id] || ""}
                                            onChange={(e) => setNoteMap({ ...noteMap, [company._id]: e.target.value })}
                                        />
                                    </TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Suspicious Jobs Tab */}
                {tab === "jobs" && (
                    <Table>
                        <TableCaption>Jobs flagged for review</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Posted By</TableHead>
                                <TableHead>Suspicious Reasons</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suspiciousJobs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">No suspicious jobs found</TableCell>
                                </TableRow>
                            )}
                            {suspiciousJobs.map((job) => (
                                <TableRow key={job._id}>
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {job.company?.name}
                                            {job.company?.isVerified && <ShieldCheck className="w-3 h-3 text-green-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{job.created_by?.fullname}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {job.suspiciousReasons?.map((reason, i) => (
                                                <Badge key={i} className="bg-red-100 text-red-700 text-xs">{reason}</Badge>
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
                )}
            </div>
            <Footer />
        </div>
    );
};

export default AdminPanel;
