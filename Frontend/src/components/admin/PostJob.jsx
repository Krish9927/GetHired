import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2, ShieldCheck, Clock, XCircle, AlertTriangle, Ban, CheckCircle2,
} from "lucide-react";
import Footer from "../shared/Footer";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-green-600" />,
    badgeCls: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    canPost: true,
  },
  pending: {
    label: "Pending approval",
    icon: <Clock className="w-3.5 h-3.5 text-yellow-600" />,
    badgeCls: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
    canPost: false,
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
    badgeCls: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    canPost: false,
  },
  banned: {
    label: "Banned",
    icon: <Ban className="w-3.5 h-3.5 text-gray-600" />,
    badgeCls: "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    canPost: false,
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const PostJob = () => {
  useGetAllCompanies();
  const [input, setInput] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    location: "",
    jobType: "",
    experience: "",
    position: 0,
    companyId: "",
    minimumCgpa: 0,
    hasTest: false,
    testDescription: "",
    testDate: "",
    testDeadline: "",
    testDuration: 30,
    testMinimumScore: 60,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { companies } = useSelector((store) => store.company);

  // The company object currently selected in the dropdown
  const selectedCompany = companies.find((c) => c._id === input.companyId) ?? null;
  const selectedStatus = selectedCompany?.verificationStatus ?? null;
  const canPost = selectedCompany ? STATUS_CONFIG[selectedStatus]?.canPost === true : false;

  const changeEventHandler = (e) => {
    const { name, value, type, checked } = e.target;
    setInput({ ...input, [name]: type === "checkbox" ? checked : value });
  };

  const selectChangeHandler = (value) => {
    const company = companies.find((c) => c.name.toLowerCase() === value);
    if (company) setInput({ ...input, companyId: company._id });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!input.companyId) {
      toast.error("Please select a company.");
      return;
    }
    if (!canPost) {
      toast.error("Only admin-approved companies can post jobs.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${JOB_API_END_POINT}/post`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        if (input.hasTest && res.data.job?._id) {
          const jobId = res.data.job._id;
          const queryParams = new URLSearchParams({
            title: `${input.title} Assessment`,
            description: input.testDescription,
            scheduledAt: input.testDate,
            durationMinutes: input.testDuration,
            minimumScore: input.testMinimumScore,
            testDeadline: input.testDeadline,
          }).toString();
          navigate(`/admin/jobs/${jobId}/create-test?${queryParams}`);
        } else {
          navigate("/admin/jobs");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Banner shown when selected company is not approved ────────────────────
  const renderBlockedBanner = () => {
    if (!selectedCompany || canPost) return null;

    const msgs = {
      pending: {
        icon: <Clock className="w-5 h-5 text-yellow-600 shrink-0" />,
        title: "Awaiting admin approval",
        body: "Your company registration is pending review. Once an admin approves it you can post jobs.",
        cls: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
        titleCls: "text-yellow-800 dark:text-yellow-200",
        bodyCls: "text-yellow-700 dark:text-yellow-300",
      },
      rejected: {
        icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
        title: "Company registration rejected",
        body: "Your company was rejected by an admin. Please update your company information and resubmit for review.",
        cls: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
        titleCls: "text-red-800 dark:text-red-200",
        bodyCls: "text-red-700 dark:text-red-300",
      },
      banned: {
        icon: <Ban className="w-5 h-5 text-gray-600 shrink-0" />,
        title: "Company banned",
        body: "This company has been banned from the platform and cannot post jobs.",
        cls: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700",
        titleCls: "text-gray-800 dark:text-gray-200",
        bodyCls: "text-gray-600 dark:text-gray-400",
      },
    };

    const m = msgs[selectedStatus];
    if (!m) return null;

    return (
      <div className={`col-span-2 flex items-start gap-3 rounded-xl border p-4 ${m.cls}`}>
        {m.icon}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${m.titleCls}`}>{m.title}</p>
          <p className={`text-sm mt-0.5 ${m.bodyCls}`}>{m.body}</p>
          {selectedStatus !== "banned" && (
            <Link
              to={`/admin/companies/${selectedCompany._id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold mt-2 underline underline-offset-2 text-[#6A38C2] hover:text-[#5b30a6]"
            >
              Go to company setup →
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-20 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex items-center justify-center my-5">
        <form
          onSubmit={submitHandler}
          className="p-8 w-full max-w-4xl border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl bg-white dark:bg-gray-900"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Post a New Job</h2>

          <div className="grid grid-cols-2 gap-4">

            {/* Title */}
            <div>
              <Label>Title</Label>
              <Input name="title" value={input.title} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Input name="description" value={input.description} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Requirements */}
            <div>
              <Label>Requirements <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></Label>
              <Input name="requirements" value={input.requirements} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Salary */}
            <div>
              <Label>Salary (LPA)</Label>
              <Input name="salary" value={input.salary} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Location */}
            <div>
              <Label>Location</Label>
              <Input name="location" value={input.location} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Job Type */}
            <div>
              <Label>Job Type</Label>
              <Input name="jobType" value={input.jobType} onChange={changeEventHandler}
                placeholder="Full-time / Part-time / Remote"
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Experience */}
            <div>
              <Label>Experience Level</Label>
              <Input name="experience" value={input.experience} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Position */}
            <div>
              <Label>No. of Positions</Label>
              <Input type="number" name="position" value={input.position} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Min CGPA */}
            <div>
              <Label>Minimum CGPA <span className="text-xs text-gray-400 font-normal">(0 = no requirement)</span></Label>
              <Input type="number" name="minimumCgpa" min="0" max="10" step="0.1"
                value={input.minimumCgpa} onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1" />
            </div>

            {/* Company selector */}
            <div className="space-y-1.5">
              <Label>Company</Label>
              {companies.length === 0 ? (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  No companies registered yet.{" "}
                  <Link to="/admin/companies/create" className="underline text-[#6A38C2]">Create one first →</Link>
                </p>
              ) : (
                <div className="space-y-2">
                  <Select onValueChange={selectChangeHandler}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {companies.map((company) => (
                          <SelectItem
                            key={company._id}
                            value={company.name.toLowerCase()}
                          >
                            <span className="flex items-center gap-2">
                              {company.name}
                              <StatusBadge status={company.verificationStatus} />
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* Selected company status row */}
                  {selectedCompany && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {canPost
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                      <span>
                        {selectedCompany.name} —{" "}
                        <StatusBadge status={selectedStatus} />
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Blocked banner — spans both columns */}
            {renderBlockedBanner()}

            {/* Assessment test toggle */}
            <div className="flex items-center gap-2 col-span-2 py-2 border-t dark:border-gray-700 mt-2">
              <input
                type="checkbox"
                id="hasTest"
                name="hasTest"
                checked={input.hasTest}
                onChange={changeEventHandler}
                className="w-4 h-4 text-[#6A38C2] border-gray-300 rounded focus:ring-[#6A38C2] cursor-pointer"
              />
              <Label htmlFor="hasTest" className="font-bold text-md text-[#6A38C2] cursor-pointer">
                Schedule Assessment Test for this Job
              </Label>
            </div>

            {input.hasTest && (
              <>
                <div className="col-span-2">
                  <Label>Test Description</Label>
                  <Input
                    name="testDescription"
                    placeholder="Brief description of the test topics, syllabus, or instructions"
                    value={input.testDescription}
                    onChange={changeEventHandler}
                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                  />
                </div>
                <div>
                  <Label>Test Date & Time</Label>
                  <Input
                    type="datetime-local"
                    name="testDate"
                    value={input.testDate}
                    onChange={changeEventHandler}
                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                  />
                </div>
                <div>
                  <Label>Last Date & Time to Attempt</Label>
                  <Input
                    type="datetime-local"
                    name="testDeadline"
                    value={input.testDeadline}
                    onChange={changeEventHandler}
                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                  />
                </div>
                <div>
                  <Label>Test Duration (minutes)</Label>
                  <Input
                    type="number"
                    name="testDuration"
                    min="5"
                    max="180"
                    value={input.testDuration}
                    onChange={changeEventHandler}
                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                  />
                </div>
                <div>
                  <Label>Minimum Score to Qualify (%)</Label>
                  <Input
                    type="number"
                    name="testMinimumScore"
                    min="0"
                    max="100"
                    value={input.testMinimumScore}
                    onChange={changeEventHandler}
                    className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !canPost || companies.length === 0}
            className="w-full mt-6 bg-[#6A38C2] hover:bg-[#5b30a6] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
              : canPost
                ? "Post New Job"
                : selectedCompany
                  ? "Company not approved — cannot post"
                  : "Select an approved company to post"
            }
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default PostJob;
