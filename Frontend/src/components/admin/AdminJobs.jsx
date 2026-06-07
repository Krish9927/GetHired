import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AdminJobsTable from "./AdminJobsTable";
import useGetAllAdminJobs from "@/hooks/useGetAllAdminJobs";
import { setSearchJobByText } from "@/redux/jobSlice";
import Footer from "../shared/Footer";
import { Briefcase, Plus, Search } from "lucide-react";

const AdminJobs = () => {
  useGetAllAdminJobs();
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allAdminJobs } = useSelector((store) => store.job);

  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input]);

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Job Postings</h1>
              <p className="text-purple-200 text-sm">{allAdminJobs?.length || 0} jobs posted</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/jobs/create")}
            className="bg-white text-[#6A38C2] hover:bg-gray-100 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" /> Post New Job
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10 h-10"
            placeholder="Search by title or role..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Table card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <AdminJobsTable />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminJobs;
