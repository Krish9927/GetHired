import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2, Building2, Globe, MapPin, FileText, Image, Save } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams } from "react-router-dom";
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
