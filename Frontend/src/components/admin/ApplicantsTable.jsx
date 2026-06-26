import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { MoreHorizontal, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import axios from "axios";
import Footer from "../shared/Footer";
import { Badge } from "../ui/badge";

const shortlistingStatus = ["Accepted", "Rejected"];

const ApplicantsTable = () => {
  const { applicants } = useSelector((store) => store.application);

  const statusHandler = async (status, id) => {
    console.log("called");
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${id}/update`,
        { status }
      );
      console.log(res);
      if (res.data.success) {
        if (res.data.emailSent) {
          toast.success(res.data.message);
        } else if (status.toLowerCase() === "accepted") {
          toast.warning(res.data.message);
        } else {
          toast.success(res.data.message);
        }
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div>
      <Table>
        <TableCaption className="my-10">
          A list of your recent applied user
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>FullName</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Resume</TableHead>
            <TableHead>Trust Score</TableHead>
            <TableHead>ATS Score</TableHead>
            <TableHead>CGPA</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants &&
            applicants?.applications?.map((item) => (
              <tr key={item._id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {item?.applicant?.fullname}
                    {item?.applicant?.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-green-500" title="Verified Candidate" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{item?.applicant?.email}</span>
                    {item?.applicant?.isCollegeEmail && (
                      <Badge className="text-xs bg-blue-100 text-blue-700 w-fit">College Email</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item?.applicant?.phoneNumber}</TableCell>
                <TableCell>
                  {item.applicant?.profile?.resume ? (
                    <a
                      className="text-blue-600 cursor-pointer"
                      href={item?.applicant?.profile?.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item?.applicant?.profile?.resumeOriginalName}
                    </a>
                  ) : (
                    <span>NA</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${item?.applicant?.trustScore >= 80 ? "text-green-600" :
                      item?.applicant?.trustScore >= 60 ? "text-blue-600" :
                        item?.applicant?.trustScore >= 40 ? "text-yellow-600" : "text-red-500"
                    }`}>
                    {item?.applicant?.trustScore ?? 0}/100
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${item?.applicant?.atsScore >= 60 ? "text-green-600" : "text-red-500"
                    }`}>
                    {item?.applicant?.atsScore ?? 0}/100
                  </span>
                </TableCell>
                <TableCell>{item?.applicant?.profile?.cgpa ?? "N/A"}</TableCell>
                <TableCell>{item?.applicant.createdAt.split("T")[0]}</TableCell>
                <TableCell className="float-right cursor-pointer">
                  <Popover>
                    <PopoverTrigger>
                      <MoreHorizontal />
                    </PopoverTrigger>
                    <PopoverContent className="w-32">
                      {shortlistingStatus.map((status, index) => {
                        return (
                          <div
                            onClick={() => statusHandler(status, item?._id)}
                            key={index}
                            className="flex w-fit items-center my-2 cursor-pointer"
                          >
                            <span>{status}</span>
                          </div>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </tr>
            ))}
        </TableBody>
      </Table>
      <Footer />
    </div>
  );
};

export default ApplicantsTable;
