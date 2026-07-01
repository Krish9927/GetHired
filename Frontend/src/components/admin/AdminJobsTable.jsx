import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Edit2, Eye, MoreHorizontal, ClipboardList, BarChart2, Play, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import axios from "axios";
import { TEST_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";

const AdminJobsTable = () => {
  const { allAdminJobs, searchJobByText } = useSelector((store) => store.job);
  const [filterJobs, setFilterJobs] = useState(allAdminJobs);
  const [testMap, setTestMap] = useState({}); // jobId -> test[]
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = allAdminJobs.filter((job) => {
      if (!searchJobByText) return true;
      return (
        job?.title?.toLowerCase().includes(searchJobByText.toLowerCase()) ||
        job?.company?.name?.toLowerCase().includes(searchJobByText.toLowerCase())
      );
    });
    setFilterJobs(filtered);
  }, [allAdminJobs, searchJobByText]);

  const fetchTests = async (jobId) => {
    if (testMap[jobId]) return;
    try {
      const res = await axios.get(`${TEST_API_END_POINT}/job/${jobId}`, { withCredentials: true });
      if (res.data.success) setTestMap((prev) => ({ ...prev, [jobId]: res.data.tests }));
    } catch { }
  };

  const handleStartTest = async (testId) => {
    try {
      const res = await axios.put(`${TEST_API_END_POINT}/${testId}/start`, {}, { withCredentials: true });
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start test");
    }
  };

  const statusBadge = (status) => ({
    draft: <Badge className="bg-gray-100 text-gray-600 text-xs">Draft</Badge>,
    scheduled: <Badge className="bg-blue-100 text-blue-600 text-xs">Scheduled</Badge>,
    active: <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>,
    completed: <Badge className="bg-purple-100 text-purple-700 text-xs">Completed</Badge>,
  }[status] || null);

  if (!filterJobs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ClipboardList className="w-10 h-10 opacity-20 mb-3" />
        <p className="font-medium text-gray-500 dark:text-gray-400">No jobs found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>A list of your recent posted jobs</TableCaption>
      <TableHeader>
        <TableRow className="bg-gray-50 dark:bg-gray-800/50">
          <TableHead className="font-semibold">Company</TableHead>
          <TableHead className="font-semibold">Role</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Tests</TableHead>
          <TableHead className="font-semibold">Date</TableHead>
          <TableHead className="text-right font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterJobs.map((job) => (
          <TableRow key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
            <TableCell>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm">{job?.company?.name}</span>
                {job?.company?.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
              </div>
            </TableCell>
            <TableCell className="font-semibold text-gray-900 dark:text-white">{job?.title}</TableCell>
            <TableCell>
              {job?.jobStatus === "under_review"
                ? <Badge className="bg-yellow-100 text-yellow-700 text-xs">Under Review</Badge>
                : job?.jobStatus === "rejected"
                  ? <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
                  : <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {(testMap[job._id] || []).map((t) => (
                  <div key={t._id} className="flex items-center gap-1">
                    {statusBadge(t.status)}
                  </div>
                ))}
                {!testMap[job._id] && (
                  <button onClick={() => fetchTests(job._id)} className="text-xs text-gray-400 hover:text-[#6A38C2]">
                    Load
                  </button>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-500">{job?.createdAt?.split("T")[0]}</TableCell>
            <TableCell className="text-right">
              <Popover>
                <PopoverTrigger>
                  <MoreHorizontal className="cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="w-44">
                  <div onClick={() => navigate(`/admin/companies/${job._id}`)} className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm">
                    <Edit2 className="w-4 text-gray-500" /><span>Edit Job</span>
                  </div>
                  <div onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm">
                    <Eye className="w-4 text-gray-500" /><span>Applicants</span>
                  </div>
                  <div onClick={() => navigate(`/admin/jobs/${job._id}/create-test`)} className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-[#6A38C2]">
                    <ClipboardList className="w-4" /><span>Create Test</span>
                  </div>
                  {(testMap[job._id] || []).map((t) => (
                    <div key={t._id}>
                      {t.status === "draft" && (
                        <div onClick={() => handleStartTest(t._id)} className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-green-600">
                          <Play className="w-4" /><span>Start Test</span>
                        </div>
                      )}
                      <div onClick={() => navigate(`/admin/tests/${t._id}/results`)} className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-purple-600">
                        <BarChart2 className="w-4" /><span>Results</span>
                      </div>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AdminJobsTable;
