import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./shared/Navbar";
import Job from "./Job";
import ExternalJobCard from "./ExternalJobCard";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import Footer from "./shared/Footer";
import { Button } from "./ui/button";
import { Loader2, Briefcase, Wifi, WifiOff } from "lucide-react";
import axios from "axios";
import { EXTERNAL_JOBS_API_END_POINT } from "@/utils/constant";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "portal", label: "Portal Jobs", icon: Briefcase },
  { id: "remote", label: "Remote Jobs", icon: Wifi },
  { id: "onsite", label: "On-site Jobs", icon: WifiOff },
];

const Browse = () => {
  useGetAllJobs();
  const dispatch = useDispatch();
  const { allJobs } = useSelector((store) => store.job);

  const [activeTab, setActiveTab] = useState("portal");
  const [externalJobs, setExternalJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState({ remote: false, onsite: false });

  useEffect(() => {
    return () => { dispatch(setSearchedQuery("")); };
  }, []);

  const fetchJobs = useCallback(async (type) => {
    setLoading(true);
    try {
      const endpoint = type === "remote"
        ? `${EXTERNAL_JOBS_API_END_POINT}/remote`
        : `${EXTERNAL_JOBS_API_END_POINT}/non-remote`;
      const res = await axios.get(endpoint);
      if (res.data.success) {
        setExternalJobs(res.data.jobs || []);
        setFetched((prev) => ({ ...prev, [type]: true }));
      }
    } catch (err) {
      console.error(err);
      setExternalJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    setExternalJobs([]);
    if (tabId === "remote" || tabId === "onsite") {
      await fetchJobs(tabId === "remote" ? "remote" : "non-remote");
    }
  };

  const filteredPortal = allJobs;

  const activeTabData = TABS.find((t) => t.id === activeTab);
  const count = activeTab === "portal" ? filteredPortal.length : externalJobs.length;

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#6A38C2] via-[#5530a8] to-[#4f28a0] py-10 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Find Your Next Opportunity</h1>
          <p className="text-purple-200 text-sm">
            Browse portal jobs, remote positions, and on-site roles worldwide
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-8 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-fit shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === id
                ? "bg-[#6A38C2] text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === id && (
                <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {loading ? "..." : count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Portal Jobs */}
            {activeTab === "portal" && (
              filteredPortal.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="w-12 h-12 opacity-20" />}
                  title="No portal jobs found"
                  subtitle="Try a different keyword or check Remote Jobs"
                  action={<Button onClick={() => handleTabChange("remote")} className="mt-4 bg-[#6A38C2]">Browse Remote Jobs</Button>}
                />
              ) : (
                <JobGrid>
                  {filteredPortal.map((job) => (
                    <motion.div key={job._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <Job job={job} />
                    </motion.div>
                  ))}
                </JobGrid>
              )
            )}

            {/* Remote / On-site Jobs */}
            {(activeTab === "remote" || activeTab === "onsite") && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2]" />
                  <p className="text-sm">Fetching {activeTab === "remote" ? "remote" : "on-site"} jobs...</p>
                </div>
              ) : externalJobs.length === 0 ? (
                <EmptyState
                  icon={activeTab === "remote"
                    ? <Wifi className="w-12 h-12 opacity-20" />
                    : <WifiOff className="w-12 h-12 opacity-20" />}
                  title={`No ${activeTab === "remote" ? "remote" : "on-site"} jobs found`}
                  subtitle="Try a different search keyword"
                />
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Showing <strong>{externalJobs.length}</strong> {activeTab === "remote" ? "remote" : "on-site"} jobs
                  </p>
                  <JobGrid>
                    {externalJobs.map((job) => (
                      <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <ExternalJobCard job={job} />
                      </motion.div>
                    ))}
                  </JobGrid>
                </>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

const JobGrid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
);

const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
    {icon}
    <p className="text-lg font-medium mt-4 text-gray-600 dark:text-gray-400">{title}</p>
    <p className="text-sm mt-1">{subtitle}</p>
    {action}
  </div>
);

export default Browse;
