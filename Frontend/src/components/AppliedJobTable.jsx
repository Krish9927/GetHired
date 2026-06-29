import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TEST_API_END_POINT } from "@/utils/constant";
import { ClipboardList, Clock, AlertCircle } from "lucide-react";

const AppliedJobTable = () => {
  const { allAppliedJobs } = useSelector((store) => store.job);
  const [testMap, setTestMap] = useState({}); // jobId -> test
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTests();
  }, []);

  const fetchMyTests = async () => {
    try {
      const res = await axios.get(`${TEST_API_END_POINT}/my-tests`, { withCredentials: true });
      if (res.data.success) {
        const map = {};
        res.data.tests.forEach((t) => {
          map[t.job?._id || t.job] = t;
        });
        setTestMap(map);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="dark:bg-gray-900">
      <Table>
        <TableCaption className="my-6">A list of your applied jobs</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Job Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assessment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allAppliedJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                You haven't applied to any jobs yet.
              </TableCell>
            </TableRow>
          ) : (
            allAppliedJobs.map((appliedJob) => {
              const jobId = appliedJob.job?._id;
              const test = testMap[jobId];
              return (
                <TableRow key={appliedJob._id}>
                  <TableCell className="text-sm text-gray-500">
                    {appliedJob?.createdAt?.split("T")[0]}
                  </TableCell>
                  <TableCell className="font-medium">{appliedJob.job?.title}</TableCell>
                  <TableCell>{appliedJob.job?.company?.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${appliedJob?.status === "rejected" ? "bg-red-100 text-red-700" :
                        appliedJob?.status === "pending" ? "bg-gray-100 text-gray-600" :
                          "bg-green-100 text-green-700"
                      }`}>
                      {appliedJob.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {test ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-[#6A38C2]" />
                          <span className="text-xs font-semibold text-[#6A38C2]">{test.title}</span>
                        </div>
                        {test.scheduledAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatDate(test.scheduledAt)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <AlertCircle className="w-3 h-3" />
                          {test.durationMinutes} min · Min {test.minimumScore}% to qualify
                        </div>
                        {test.status === "active" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[#6A38C2] hover:bg-[#5b30a6] mt-1"
                            onClick={() => navigate(`/test/${test._id}`)}
                          >
                            Take Test →
                          </Button>
                        )}
                        {test.status === "scheduled" && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Scheduled</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppliedJobTable;
