import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Trash2, Eye, MoreHorizontal, ClipboardList,
  BarChart2, Play, ShieldCheck, CheckCheck, AlertCircle,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import axios from "axios";
import { JOB_API_END_POINT, TEST_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { setAllAdminJobs } from "@/redux/jobSlice";

const AdminJobsTable = () => {
  const { allAdminJobs, searchJobByText } = useSelector((store) => store.job);
  const [filterJobs, setFilterJobs] = useState(allAdminJobs);
  const [testMap, setTestMap] = useState({}); // jobId -> test[] | null (null = loading, [] = no test)
  const [testsLoaded, setTestsLoaded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Filter jobs by search text
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

  // Auto-load tests for all jobs on mount so we know which have tests
  useEffect(() => {
    if (!allAdminJobs.length || testsLoaded) return;
    const loadAllTests = async () => {
      const results = await Promise.allSettled(
        allAdminJobs.map((job) =>
          axios
            .get(`${TEST_API_END_POINT}/job/${job._id}`, { withCredentials: true })
            .then((res) => ({ jobId: job._id, tests: res.data.success ? res.data.tests : [] }))
            .catch(() => ({ jobId: job._id, tests: [] }))
        )
      );
      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") map[r.value.jobId] = r.value.tests;
      });
      setTestMap(map);
      setTestsLoaded(true);
    };
    loadAllTests();
  }, [allAdminJobs]);

  const handleStartTest = async (testId) => {
    try {
      const res = await axios.put(`${TEST_API_END_POINT}/${testId}/start`, {}, { withCredentials: true });
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start test");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${JOB_API_END_POINT}/delete/${confirmDeleteId}`, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setAllAdminJobs(allAdminJobs.filter((j) => j._id !== confirmDeleteId)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete job");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCloseSelection = async (jobId) => {
    if (!window.confirm("Close selection for this job? It will be removed from the student job list.")) return;
    setClosingId(jobId);
    try {
      const res = await axios.patch(`${JOB_API_END_POINT}/close-selection/${jobId}`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setAllAdminJobs(allAdminJobs.filter((j) => j._id !== jobId)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close selection");
    } finally {
      setClosingId(null);
    }
  };

  const testStatusBadge = (status) => ({
    draft: <Badge className="bg-gray-100 text-gray-600 text-xs">Draft</Badge>,
    scheduled: <Badge className="bg-blue-100 text-blue-600 text-xs">Scheduled</Badge>,
    active: <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>,
    completed: <Badge className="bg-purple-100 text-purple-700 text-xs">Completed</Badge>,
  }[status] || null);

  const confirmingJob = allAdminJobs.find((j) => j._id === confirmDeleteId);

  // A job "needs a test" when hasTest is true but no test document exists yet
  const needsTest = (job) => job?.hasTest && testsLoaded && (testMap[job._id]?.length ?? 0) === 0;

  if (!filterJobs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ClipboardList className="w-10 h-10 opacity-20 mb-3" />
        <p className="font-medium text-gray-500 dark:text-gray-400">No jobs found</p>
      </div>
    );
  }

  return (
    <>
      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Delete Job</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 dark:text-white">{confirmingJob?.title}</strong>
              ? All applications for this job will also be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableCaption>Your active job postings — newest first</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Test</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterJobs.map((job) => {
            const jobNeedsTest = needsTest(job);
            const tests = testMap[job._id] || [];
            const hasTestCreated = tests.length > 0;

            return (
              <TableRow
                key={job._id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${jobNeedsTest
                    ? "border-l-4 border-l-orange-400 bg-orange-50/40 dark:bg-orange-900/10"
                    : ""
                  }`}
              >
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{job?.company?.name}</span>
                    {job?.company?.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{job?.title}</span>
                    {jobNeedsTest && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Test missing
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {job?.jobStatus === "under_review"
                    ? <Badge className="bg-yellow-100 text-yellow-700 text-xs">Under Review</Badge>
                    : job?.jobStatus === "rejected"
                      ? <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
                      : job?.testScheduleStatus === "expired"
                        ? <Badge className="bg-red-100 text-red-700 text-xs">Expired</Badge>
                        : <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>}
                </TableCell>

                <TableCell>
                  {!testsLoaded ? (
                    <span className="text-xs text-gray-400">Loading…</span>
                  ) : hasTestCreated ? (
                    <div className="flex flex-wrap gap-1">
                      {tests.map((t) => (
                        <span key={t._id}>{testStatusBadge(t.status)}</span>
                      ))}
                    </div>
                  ) : job?.hasTest ? (
                    <span className="text-xs text-orange-600 font-semibold">Not created</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm text-gray-500">{job?.createdAt?.split("T")[0]}</TableCell>

                <TableCell className="text-right">
                  <Popover>
                    <PopoverTrigger>
                      <MoreHorizontal className="cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      {/* Delete */}
                      <div
                        onClick={() => setConfirmDeleteId(job._id)}
                        className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4" /><span>Delete Job</span>
                      </div>

                      {/* Close Selection */}
                      <div
                        onClick={() => handleCloseSelection(job._id)}
                        className={`flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-green-700 hover:text-green-800 ${closingId === job._id ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <CheckCheck className="w-4" />
                        <span>{closingId === job._id ? "Closing…" : "Close Selection"}</span>
                      </div>

                      {/* Applicants */}
                      <div
                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                        className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm"
                      >
                        <Eye className="w-4 text-gray-500" /><span>Applicants</span>
                      </div>

                      {/* Create Test — only show if no test exists yet */}
                      {job?.hasTest && !hasTestCreated && (
                        <div
                          onClick={() => navigate(`/admin/jobs/${job._id}/create-test`)}
                          className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-orange-600 font-semibold hover:text-orange-700"
                        >
                          <ClipboardList className="w-4" /><span>Create Test ⚠</span>
                        </div>
                      )}

                      {/* Test actions — only when test exists */}
                      {tests.map((t) => (
                        <div key={t._id}>
                          {t.status === "draft" && (
                            <div
                              onClick={() => handleStartTest(t._id)}
                              className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-green-600"
                            >
                              <Play className="w-4" /><span>Start Test</span>
                            </div>
                          )}
                          <div
                            onClick={() => navigate(`/admin/tests/${t._id}/results`)}
                            className="flex items-center gap-2 w-fit cursor-pointer py-1.5 text-sm text-purple-600"
                          >
                            <BarChart2 className="w-4" /><span>Results</span>
                          </div>
                        </div>
                      ))}
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default AdminJobsTable;
