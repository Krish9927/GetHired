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
import { ShieldCheck, AlertCircle } from "lucide-react";

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
      </div>
      <Footer />
    </div>
  );
};

export default JobDescription;
