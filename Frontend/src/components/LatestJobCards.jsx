import React from "react";
import { Badge } from "./ui/badge";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LatestJobCards = ({ job }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/description/${job._id}`)}
      className="p-5 rounded-md shadow-xl dark:bg-gray-900 border dark:border-gray-600 border-gray-100 cursor-pointer overflow-hidden transition-transform transform hover:scale-105 duration-300"
    >
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="font-medium text-lg">{job?.company?.name}</h1>
          {job?.company?.isVerified && (
            <ShieldCheck className="w-4 h-4 text-green-500" title="Verified Company" />
          )}
          {job?.company?.trustScore != null && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                job.company.trustScore >= 60
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : job.company.trustScore >= 30
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
              title="Company Trust Score"
            >
              <ShieldCheck className="w-3 h-3" />
              {job.company.trustScore}
            </span>
          )}
        </div>
        <p className="text-sm dark:text-gray-400 text-gray-500">
          {job?.location}
        </p>
      </div>
      <div>
        <h1 className="font-bold text-lg my-2">{job?.title}</h1>
        <p className="text-sm dark:text-gray-500 text-gray-600">
          {job?.description}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Badge className={"text-blue-700 font-bold"} variant="ghost">
          {job?.position} Positions
        </Badge>
        <Badge className={"text-[#F83002] font-bold"} variant="ghost">
          {job?.jobType}
        </Badge>
        <Badge className={"text-[#7209b7] font-bold"} variant="ghost">
          {job?.salary}LPA
        </Badge>
      </div>
    </div>
  );
};

export default LatestJobCards;
