import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSearchedQuery } from "@/redux/jobSlice";
import {
  Monitor,
  Server,
  Layers,
  BarChart2,
  Pen,
  Terminal,
  Smartphone,
  Brain,
} from "lucide-react";

const CATEGORIES = [
  { label: "Frontend Developer", icon: Monitor },
  { label: "Backend Developer", icon: Server },
  { label: "FullStack Developer", icon: Layers },
  { label: "Data Science", icon: BarChart2 },
  { label: "Graphic Designer", icon: Pen },
  { label: "DevOps", icon: Terminal },
  { label: "Mobile Developer", icon: Smartphone },
  { label: "Machine Learning", icon: Brain },
];

const CategoryCarousel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allJobs } = useSelector((store) => store.job);

  const getJobCount = (category) => {
    const q = category.toLowerCase();
    return allJobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job.requirements?.some((r) => r?.toLowerCase().includes(q))
    ).length;
  };

  const handleClick = (category) => {
    dispatch(setSearchedQuery(category));
    navigate("/browse");
  };

  return (
    <div className="max-w-5xl mx-auto my-12">
      <h2 className="text-2xl font-bold text-center mb-2">
        Browse by <span className="text-[#6A38C2]">Job Category</span>
      </h2>
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
        Click a category to explore available positions
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const count = getJobCount(cat.label);
          return (
            <button
              key={cat.label}
              onClick={() => handleClick(cat.label)}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#6A38C2] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#6A38C2]/10 flex items-center justify-center group-hover:bg-[#6A38C2] transition-colors duration-200">
                <cat.icon className="w-5 h-5 text-[#6A38C2] group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="w-full">
                <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-[#6A38C2] transition-colors leading-snug">
                  {cat.label}
                </p>
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                  {count > 0 ? (
                    <span className="text-[#6A38C2] font-semibold">{count} job{count !== 1 ? "s" : ""} available</span>
                  ) : (
                    "No jobs yet"
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryCarousel;
