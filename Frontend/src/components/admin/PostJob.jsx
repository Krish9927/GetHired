import React, { useState } from "react";
import Navbar from "../shared/Navbar";
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
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Footer from "../shared/Footer";

const companyArray = [];

const PostJob = () => {
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
    testDuration: 30,
    testMinimumScore: 60,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { companies } = useSelector((store) => store.company);
  
  const changeEventHandler = (e) => {
    const { name, value, type, checked } = e.target;
    setInput({
      ...input,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (company) => company.name.toLowerCase() === value
    );
    setInput({ ...input, companyId: selectedCompany._id });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${JOB_API_END_POINT}/post`, input, {
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <div className="mx-20 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex items-center justify-center my-5">
        <form
          onSubmit={submitHandler}
          className="p-8 max-w-4xl border border-gray-200 shadow-lg rounded-md"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Title</Label>
              <Input
                type="text"
                name="title"
                value={input.title}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                type="text"
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Requirements</Label>
              <Input
                type="text"
                name="requirements"
                value={input.requirements}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Salary</Label>
              <Input
                type="text"
                name="salary"
                value={input.salary}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                type="text"
                name="location"
                value={input.location}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Job Type</Label>
              <Input
                type="text"
                name="jobType"
                value={input.jobType}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Experience Level</Label>
              <Input
                type="text"
                name="experience"
                value={input.experience}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>No of Postion</Label>
              <Input
                type="number"
                name="position"
                value={input.position}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            <div>
              <Label>Minimum CGPA (0 = no requirement)</Label>
              <Input
                type="number"
                name="minimumCgpa"
                min="0"
                max="10"
                step="0.1"
                value={input.minimumCgpa}
                onChange={changeEventHandler}
                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
              />
            </div>
            {companies.length > 0 && (
              <Select onValueChange={selectChangeHandler}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {companies.map((company) => {
                      return (
                        <SelectItem value={company?.name?.toLowerCase()}>
                          {company.name}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

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
                    type="text"
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
                  <Label>Test Duration (Minutes)</Label>
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
          {loading ? (
            <Button className="w-full my-4">
              {" "}
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait{" "}
            </Button>
          ) : (
            <Button type="submit" className="w-full my-4">
              Post New Job
            </Button>
          )}
          {companies.length === 0 && (
            <p className="text-xs text-red-600 font-bold text-center my-3">
              *Please register a company first, before posting a jobs
            </p>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default PostJob;
