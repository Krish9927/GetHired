import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { SlidersHorizontal, X, MapPin, Briefcase, DollarSign, Clock } from "lucide-react";
import { Button } from "./ui/button";

const LOCATIONS = ["Delhi", "Gurugram", "Noida", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Kolkata", "Remote"];

const INDUSTRIES = [
  "Frontend Developer", "Backend Developer", "FullStack Developer",
  "Data Science", "Machine Learning", "DevOps", "Mobile Developer",
  "Graphic Designer", "UI/UX Designer", "Product Manager",
];

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

const SALARY_RANGES = [
  { label: "0 – 3 LPA", min: 0, max: 3 },
  { label: "3 – 6 LPA", min: 3, max: 6 },
  { label: "6 – 10 LPA", min: 6, max: 10 },
  { label: "10 – 20 LPA", min: 10, max: 20 },
  { label: "20+ LPA", min: 20, max: 9999 },
];

const EXPERIENCE = ["Fresher (0 yrs)", "1-2 years", "3-5 years", "5+ years"];

// Generic toggle pill group
const PillGroup = ({ options, selected, onToggle }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {options.map((opt) => {
      const label = typeof opt === "string" ? opt : opt.label;
      const isSelected = selected.includes(label);
      return (
        <button
          key={label}
          onClick={() => onToggle(label)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${isSelected
              ? "bg-[#6A38C2] text-white border-[#6A38C2]"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#6A38C2] hover:text-[#6A38C2]"
            }`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// Section wrapper
const FilterSection = ({ icon: Icon, title, children }) => (
  <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-[#6A38C2]" />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
    </div>
    {children}
  </div>
);

const FilterCard = ({ onFilterChange }) => {
  const dispatch = useDispatch();
  const { allJobs } = useSelector((store) => store.job);

  const [locations, setLocations] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [salary, setSalary] = useState(null);   // label string
  const [experience, setExperience] = useState([]);

  const totalActive = locations.length + industries.length + jobTypes.length + (salary ? 1 : 0) + experience.length;

  const toggle = (setter, current) => (value) =>
    setter(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  const clearAll = () => {
    setLocations([]);
    setIndustries([]);
    setJobTypes([]);
    setSalary(null);
    setExperience([]);
    dispatch(setSearchedQuery(""));
    onFilterChange?.({});
  };

  // Notify parent of active filters
  React.useEffect(() => {
    onFilterChange?.({ locations, industries, jobTypes, salary, experience });
  }, [locations, industries, jobTypes, salary, experience]);

  return (
    <div className="w-72 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#6A38C2]" />
          <span className="font-semibold text-gray-900 dark:text-white">Filters</span>
          {totalActive > 0 && (
            <Badge className="bg-[#6A38C2] text-white text-xs px-2 py-0.5">{totalActive}</Badge>
          )}
        </div>
        {totalActive > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="px-5">
        {/* Location */}
        <FilterSection icon={MapPin} title="Location">
          <PillGroup options={LOCATIONS} selected={locations} onToggle={toggle(setLocations, locations)} />
        </FilterSection>

        {/* Industry */}
        <FilterSection icon={Briefcase} title="Job Role">
          <PillGroup options={INDUSTRIES} selected={industries} onToggle={toggle(setIndustries, industries)} />
        </FilterSection>

        {/* Job Type */}
        <FilterSection icon={Clock} title="Job Type">
          <PillGroup options={JOB_TYPES} selected={jobTypes} onToggle={toggle(setJobTypes, jobTypes)} />
        </FilterSection>

        {/* Salary */}
        <FilterSection icon={DollarSign} title="Salary Range">
          <div className="flex flex-wrap gap-2 mt-2">
            {SALARY_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSalary(salary === range.label ? null : range.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${salary === range.label
                    ? "bg-[#6A38C2] text-white border-[#6A38C2]"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#6A38C2] hover:text-[#6A38C2]"
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Experience */}
        <FilterSection icon={Briefcase} title="Experience">
          <PillGroup options={EXPERIENCE} selected={experience} onToggle={toggle(setExperience, experience)} />
        </FilterSection>
      </div>
    </div>
  );
};

export { SALARY_RANGES };
export default FilterCard;
