import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Building2, Globe, MapPin, FileText, Image, Save, ShieldCheck, Clock, XCircle, Ban, AlertTriangle } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import useGetCompanyById from "@/hooks/useGetCompanyById";
import Footer from "../shared/Footer";
import CompanyVerificationCard from "./CompanyVerificationCard";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

const FieldGroup = ({ icon: Icon, label, children }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label}
    </Label>
    {children}
  </div>
);

// ── Approval status banner ─────────────────────────────────────────────────────
const APPROVAL_CONFIG = {
  approved: {
    icon: <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />,
    title: "Company approved",
    body: "Your company has been approved by an admin. You can now post jobs on the platform.",
    cls: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    titleCls: "text-green-800 dark:text-green-200",
    bodyCls: "text-green-700 dark:text-green-300",
    action: (
      <Link
        to="/admin/jobs/create"
        className="inline-flex items-center gap-1 text-sm font-semibold mt-2 underline underline-offset-2 text-green-700 dark:text-green-300 hover:opacity-80"
      >
        Post a job now →
      </Link>
    ),
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-yellow-600 shrink-0" />,
    title: "Awaiting admin approval",
    body: "Your company is under review. An admin will approve or reject it shortly. You cannot post jobs until it is approved.",
    cls: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    titleCls: "text-yellow-800 dark:text-yellow-200",
    bodyCls: "text-yellow-700 dark:text-yellow-300",
    action: (
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
        Tip: completing the verification steps below increases your trust score and speeds up approval.
      </p>
    ),
  },
  rejected: {
    icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
    title: "Registration rejected",
    body: "Your company registration was rejected by an admin. Update your company details and verification info, then wait for re-review.",
    cls: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    titleCls: "text-red-800 dark:text-red-200",
    bodyCls: "text-red-700 dark:text-red-300",
    action: (
      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
        Update your information and complete the verification steps below to request a re-review.
      </p>
    ),
  },
  banned: {
    icon: <Ban className="w-5 h-5 text-gray-600 shrink-0" />,
    title: "Company banned",
    body: "This company has been permanently banned from the platform. All job listings have been removed.",
    cls: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700",
    titleCls: "text-gray-800 dark:text-gray-200",
    bodyCls: "text-gray-600 dark:text-gray-400",
    action: null,
  },
};

const ApprovalBanner = ({ company }) => {
  if (!company) return null;
  const status = company.verificationStatus ?? "pending";
  const cfg = APPROVAL_CONFIG[status] ?? APPROVAL_CONFIG.pending;

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.cls}`}>
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm ${cfg.titleCls}`}>{cfg.title}</p>
          {company.adminNote && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
              Admin note: "{company.adminNote}"
            </span>
          )}
        </div>
        <p className={`text-sm mt-0.5 ${cfg.bodyCls}`}>{cfg.body}</p>
        {cfg.action}
      </div>
    </div>
  );
};

const CompanySetup = () => {
  const params = useParams();
  useGetCompanyById(params.id);
  const [input, setInput] = useState({ name: "", description: "", website: "", location: "", file: null });
  const [preview, setPreview] = useState(null);
  const { singleCompany } = useSelector((store) => store.company);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changeEventHandler = (e) => setInput({ ...input, [e.target.name]: e.target.value });

  const changeFileHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("description", input.description);
    formData.append("website", input.website);
    formData.append("location", input.location);
    if (input.file) formData.append("file", input.file);

    try {
      setLoading(true);
      const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Company updated successfully");
        // Refresh from server to get latest data
        const fresh = await axios.get(`${COMPANY_API_END_POINT}/get/${params.id}`, { withCredentials: true });
        if (fresh.data.success) {
          setInput({
            name: fresh.data.company.name || "",
            description: fresh.data.company.description || "",
            website: fresh.data.company.website || "",
            location: fresh.data.company.location || "",
            file: null,
          });
          setPreview(fresh.data.company.logo || null);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (singleCompany && singleCompany._id === params.id) {
      setInput({
        name: singleCompany.name || "",
        description: singleCompany.description || "",
        website: singleCompany.website || "",
        location: singleCompany.location || "",
        file: null,
      });
      setPreview(singleCompany.logo || null);
    }
  }, [singleCompany, params.id]);

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/companies")}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-xl border-2 border-white/30">
              <AvatarImage src={preview} className="object-contain" />
              <AvatarFallback className="bg-white/20 text-white font-bold rounded-xl text-lg">
                {input.name?.charAt(0).toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-white">{input.name || "Company Setup"}</h1>
              <p className="text-purple-200 text-sm">Manage your company profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Approval status banner */}
        <ApprovalBanner company={singleCompany} />

        {/* Basic Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#6A38C2]" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Company Information</h2>
          </div>
          <form onSubmit={submitHandler} className="p-6 space-y-5">
            {/* Logo upload */}
            <div className="flex items-center gap-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <Avatar className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <AvatarImage src={preview} className="object-contain" />
                <AvatarFallback className="bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <Image className="w-8 h-8 text-gray-300" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo</p>
                <p className="text-xs text-gray-400 mb-2">PNG, JPG up to 2MB. Recommended 200×200px.</p>
                <Input type="file" accept="image/*" onChange={changeFileHandler} className="h-9 text-xs cursor-pointer max-w-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldGroup icon={Building2} label="Company Name">
                <Input type="text" name="name" value={input.name} onChange={changeEventHandler} placeholder="Your company name" className="h-10" />
              </FieldGroup>

              <FieldGroup icon={MapPin} label="Location">
                <Input type="text" name="location" value={input.location} onChange={changeEventHandler} placeholder="e.g. Mumbai, India" className="h-10" />
              </FieldGroup>

              <FieldGroup icon={Globe} label="Website">
                <Input type="url" name="website" value={input.website} onChange={changeEventHandler} placeholder="https://yourcompany.com" className="h-10" />
              </FieldGroup>

              <FieldGroup icon={FileText} label="Description">
                <Input type="text" name="description" value={input.description} onChange={changeEventHandler} placeholder="Brief company description" className="h-10" />
              </FieldGroup>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold gap-2 px-8">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </div>

        {/* Verification Card */}
        <CompanyVerificationCard companyId={params.id} />
      </div>
      <Footer />
    </div>
  );
};

export default CompanySetup;
