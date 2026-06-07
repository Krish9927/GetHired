import React, { useEffect, useState } from "react";
import Navbar from "./shared/Navbar";
import FilterCard, { SALARY_RANGES } from "./FilterCard";
import Job from "./Job";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "./shared/Footer";
import { SlidersHorizontal, X, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import useGetAllJobs from "@/hooks/useGetAllJobs";

const Jobs = () => {
  useGetAllJobs();
  const { allJobs, searchedQuery } = useSelector((store) => store.job);
  const [filters, setFilters] = useState({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const applyFilters = (jobs) => {
    let result = [...jobs];

    // Keyword from HeroSection/CategoryCarousel
    if (searchedQuery) {
      const q = searchedQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(q) ||
          job.description?.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q)
      );
    }

    // Location filter (multi-select)
    if (filters.locations?.length > 0) {
      result = result.filter((job) =>
        filters.locations.some((loc) =>
          job.location?.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Industry / role filter (multi-select)
    if (filters.industries?.length > 0) {
      result = result.filter((job) =>
        filters.industries.some((ind) =>
          job.title?.toLowerCase().includes(ind.toLowerCase()) ||
          job.description?.toLowerCase().includes(ind.toLowerCase())
        )
      );
    }

    // Job type filter (multi-select)
    if (filters.jobTypes?.length > 0) {
      result = result.filter((job) =>
        filters.jobTypes.some((jt) =>
          job.jobType?.toLowerCase().includes(jt.toLowerCase())
        )
      );
    }

    // Salary filter (single select range)
    if (filters.salary) {
      const range = SALARY_RANGES.find((r) => r.label === filters.salary);
      if (range) {
        result = result.filter(
          (job) => job.salary >= range.min && job.salary <= range.max
        );
      }
    }

    // Experience filter (multi-select)
    if (filters.experience?.length > 0) {
      result = result.filter((job) =>
        filters.experience.some((exp) => {
          const jobExp = Number(job.experienceLevel) || 0;
          if (exp === "Fresher (0 yrs)") return jobExp === 0;
          if (exp === "1-2 years") return jobExp >= 1 && jobExp <= 2;
          if (exp === "3-5 years") return jobExp >= 3 && jobExp <= 5;
          if (exp === "5+ years") return jobExp > 5;
          return true;
        })
      );
    }

    return result;
  };

  const filteredJobs = applyFilters(allJobs);

  const activeFilterCount =
    (filters.locations?.length || 0) +
    (filters.industries?.length || 0) +
    (filters.jobTypes?.length || 0) +
    (filters.salary ? 1 : 0) +
    (filters.experience?.length || 0);

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-[#6A38C2] to-[#4f28a0] py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Portal Jobs</h1>
            <p className="text-purple-200 text-sm mt-1">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available
              {searchedQuery && <> for <strong>"{searchedQuery}"</strong></>}
            </p>
          </div>
          {/* Mobile filter toggle */}
          <Button
            className="lg:hidden bg-white/20 hover:bg-white/30 text-white border-white/30"
            variant="outline"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">

          {/* Sidebar filter — hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block sticky top-6">
            <FilterCard onFilterChange={setFilters} />
          </div>

          {/* Mobile filter overlay */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-semibold">Filters</span>
                  <button onClick={() => setMobileFilterOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterCard onFilterChange={setFilters} />
              </div>
            </div>
          )}

          {/* Job grid */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.locations?.map((l) => (
                  <ActiveChip key={l} label={l} onRemove={() =>
                    setFilters((f) => ({ ...f, locations: f.locations.filter((x) => x !== l) }))} />
                ))}
                {filters.industries?.map((i) => (
                  <ActiveChip key={i} label={i} onRemove={() =>
                    setFilters((f) => ({ ...f, industries: f.industries.filter((x) => x !== i) }))} />
                ))}
                {filters.jobTypes?.map((j) => (
                  <ActiveChip key={j} label={j} onRemove={() =>
                    setFilters((f) => ({ ...f, jobTypes: f.jobTypes.filter((x) => x !== j) }))} />
                ))}
                {filters.salary && (
                  <ActiveChip label={filters.salary} onRemove={() =>
                    setFilters((f) => ({ ...f, salary: null }))} />
                )}
                {filters.experience?.map((e) => (
                  <ActiveChip key={e} label={e} onRemove={() =>
                    setFilters((f) => ({ ...f, experience: f.experience.filter((x) => x !== e) }))} />
                ))}
              </div>
            )}

            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Briefcase className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No jobs match your filters</p>
                <p className="text-sm mt-1">Try adjusting or clearing some filters</p>
                <Button
                  onClick={() => setFilters({})}
                  className="mt-4 bg-[#6A38C2] hover:bg-[#5b30a6]"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Job job={job} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const ActiveChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#6A38C2]/10 text-[#6A38C2] text-xs font-medium border border-[#6A38C2]/30">
    {label}
    <button onClick={onRemove} className="ml-1 hover:text-red-500">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default Jobs;
