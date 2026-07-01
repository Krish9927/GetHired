import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useParams } from "react-router-dom";
import axios from "axios";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from "@/utils/constant";
import { setSingleJob } from "@/redux/jobSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import Footer from "./shared/Footer";
import Navbar from "./shared/Navbar";
import { ShieldCheck, AlertCircle, ClipboardList } from "lucide-react";

const JobDescription = () => {
  const { singleJob } = useSelector((store) => store.job);
  const { user, verification } = useSelector((store) => store.auth);
  const isIntiallyApplied =
    singleJob?.applications?.some(
      (application) => application.applicant === user?._id
    ) || false;
  const [isApplied, setIsApplied] = useState(isIntiallyApplied);

  const params = useParams();
  const jobId = params.id;
  const dispatch = useDispatch();

  // CGPA eligibility check
  const minimumCgpa = singleJob?.minimumCgpa || 0;
  const userCgpa = user?.profile?.cgpa;
  const cgpaEligible = minimumCgpa === 0 || (userCgpa !== undefined && userCgpa >= minimumCgpa);

  const applyJobHandler = async () => {
    if (!cgpaEligible) {
      toast.error(`This job requires a minimum CGPA of ${minimumCgpa}. Your CGPA: ${userCgpa ?? "not set"}`);
      return;
    }
    try {
      const res = await axios.get(
        `${APPLICATION_API_END_POINT}/apply/${jobId}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        setIsApplied(true);
        const updatedSingleJob = {
          ...singleJob,
          applications: [...singleJob.applications, { applicant: user?._id }],
        };
        dispatch(setSingleJob(updatedSingleJob));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    const fetchSingleJob = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          setIsApplied(
            res.data.job.applications.some(
              (application) => application.applicant === user?._id
            )
          ); // Ensure the state is in sync with fetched data
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchSingleJob();
  }, [jobId, dispatch, user?._id]);

  return (
    <div className="max-w-7xl mx-20 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex items-center justify-between mt-8 mb-4">
        <div>
          <h1 className="font-bold text-xl">{singleJob?.title}</h1>
          <div className="flex items-center gap-2 mt-4">
            <Badge className={"text-blue-700 font-bold"} variant="ghost">
              {singleJob?.postion} Positions
            </Badge>
            <Badge className={"text-[#F83002] font-bold"} variant="ghost">
              {singleJob?.jobType}
            </Badge>
            <Badge className={"text-[#7209b7] font-bold"} variant="ghost">
              {singleJob?.salary}LPA
            </Badge>
          </div>
        </div>
        <Button
          onClick={isApplied ? null : applyJobHandler}
          disabled={isApplied || !cgpaEligible}
          className={`rounded-lg ${isApplied
            ? "bg-gray-600 cursor-not-allowed"
            : !cgpaEligible
              ? "bg-red-400 cursor-not-allowed"
              : "bg-[#7209b7] hover:bg-[#5f32ad]"
            }`}
        >
          {isApplied ? "Already Applied" : !cgpaEligible ? "CGPA Too Low" : "Apply Now"}
        </Button>
      </div>
      {minimumCgpa > 0 && !cgpaEligible && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          This job requires a minimum CGPA of <strong>{minimumCgpa}</strong>. Your CGPA ({userCgpa ?? "not set"}) does not meet the requirement.
        </div>
      )}

      {/* Company Trust Score Section */}
      {singleJob?.company && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {singleJob.company.logo && (
                <img
                  src={singleJob.company.logo}
                  alt={singleJob.company.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                />
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-semibold text-base">{singleJob.company.name}</h2>
                  {singleJob.company.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-green-500" title="Platform Verified" />
                  )}
                </div>
                {singleJob.company.location && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{singleJob.company.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Trust Score Badge */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Platform Trust Score</span>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                    (singleJob.company.trustScore ?? 0) >= 60
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : (singleJob.company.trustScore ?? 0) >= 30
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {singleJob.company.trustScore ?? 0} / 100
                </div>
              </div>
              {/* Verification Status Badge */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                    singleJob.company.verificationStatus === "approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : singleJob.company.verificationStatus === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : singleJob.company.verificationStatus === "banned"
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {singleJob.company.verificationStatus === "approved"
                    ? "✓ Verified"
                    : singleJob.company.verificationStatus === "rejected"
                      ? "✗ Rejected"
                      : singleJob.company.verificationStatus === "banned"
                        ? "⚠ Banned"
                        : "⏳ Pending Review"}
                </span>
              </div>
            </div>
          </div>
          {(singleJob.company.trustScore ?? 0) < 30 && (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-500 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              This company has a low trust score. Please do your own research before applying.
            </div>
          )}
        </div>
      )}

      <h1 className="border-b-2 border-b-gray-300 font-medium py-4">
        Job Description
      </h1>
      <div className="my-4">
        <h1 className="font-bold my-1">
          Role:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.title}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Location:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.location}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Description:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.description}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Experience:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.experienceLevel} yrs
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Salary:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.salary}LPA
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Total Applicants:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.applications?.length}
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Posted Date:{" "}
          <span className="pl-4 font-normal dark:text-gray-300 text-gray-800">
            {singleJob?.createdAt.split("T")[0]}
          </span>
        </h1>
        {singleJob?.minimumCgpa > 0 && (
          <h1 className="font-bold my-1">
            Minimum CGPA:{" "}
            <span className={`pl-4 font-normal ${cgpaEligible ? "text-green-600" : "text-red-500"}`}>
              {singleJob.minimumCgpa} / 10
              {cgpaEligible ? " ✓ You're eligible" : ` ✗ Your CGPA: ${userCgpa ?? "not set"}`}
            </span>
          </h1>
        )}
        {singleJob?.hasTest && (
          <div className="mt-4 p-4 border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800 rounded-xl space-y-2 max-w-2xl">
            <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 text-sm uppercase tracking-wider">
              <ClipboardList className="w-4 h-4" /> Assessment Required
            </h3>
            <p className="text-sm dark:text-gray-300 text-gray-700 font-medium">
              {singleJob.testDescription || "This job requires an online assessment test."}
            </p>
            {singleJob.testDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scheduled Date & Time: <strong>{new Date(singleJob.testDate).toLocaleString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}</strong>
              </p>
            )}
            <p className="text-xs text-gray-400">
              * The test is conducted at the specific scheduled time. Candidates who meet all requirements (CGPA, skills) will receive an invite email.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default JobDescription;
