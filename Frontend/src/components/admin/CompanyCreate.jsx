import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setSingleCompany } from "@/redux/companySlice";
import Footer from "../shared/Footer";
import { Building2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const registerNewCompany = async () => {
    if (!companyName.trim()) return toast.error("Please enter a company name");
    setLoading(true);
    try {
      const res = await axios.post(
        `${COMPANY_API_END_POINT}/register`,
        { companyName: companyName.trim() },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res?.data?.success) {
        dispatch(setSingleCompany(res.data.company));
        toast.success(res.data.message);
        navigate(`/admin/companies/${res.data.company._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Back */}
        <button
          onClick={() => navigate("/admin/companies")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#6A38C2] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] p-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Register Your Company</h1>
            <p className="text-purple-200 text-sm mt-1">
              Start by giving your company a name. You can add more details in the next step.
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && registerNewCompany()}
                placeholder="e.g. Google, Microsoft, Infosys..."
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-xs text-gray-400">You can change this name later from Company Settings.</p>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">After creating, you'll be able to:</p>
              {["Add logo, description & website", "Verify your company email domain", "Post jobs to attract top candidates"].map((tip) => (
                <div key={tip} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                  {tip}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/admin/companies")} className="flex-1 h-11">
                Cancel
              </Button>
              <Button
                onClick={registerNewCompany}
                disabled={loading || !companyName.trim()}
                className="flex-1 h-11 bg-[#6A38C2] hover:bg-[#5b30a6] font-semibold gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompanyCreate;
