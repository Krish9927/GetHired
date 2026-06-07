import React, { useEffect } from "react";
import Navbar from "./shared/Navbar";
import HeroSection from "./HeroSection";
import CategoryCarousel from "./CategoryCarousel";
import LatestJobs from "./LatestJobs";
import Footer from "./shared/Footer";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Briefcase, Globe, ShieldCheck } from "lucide-react";

const Home = () => {
  useGetAllJobs();
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "recruiter") {
      navigate("/admin/companies");
    }
  }, []);

  return (
    <div className="dark:bg-gray-950 bg-gray-50 min-h-screen">
      <div className="mx-20">
        <Navbar />
        <HeroSection />
      </div>

      {user && user.role === "student" ? (
        // ── Logged in: show categories + latest jobs ──
        <div className="mx-20">
          <CategoryCarousel />
          <LatestJobs />
        </div>
      ) : !user ? (
        // ── Not logged in: show feature highlights + CTA ──
        <div className="max-w-5xl mx-auto px-6 pb-16">
          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            {[
              {
                icon: <Briefcase className="w-7 h-7 text-[#6A38C2]" />,
                title: "GetHired Jobs",
                desc: "Browse verified job listings from top companies posted directly on our platform.",
              },
              {
                icon: <Globe className="w-7 h-7 text-[#F83002]" />,
                title: "Global Job Board",
                desc: "Explore remote and on-site opportunities from Remotive, Arbeitnow, and The Muse.",
              },
              {
                icon: <ShieldCheck className="w-7 h-7 text-green-500" />,
                title: "Candidate Verification",
                desc: "Get verified with email OTP, ATS resume scoring, and a trust score badge.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center space-y-4 py-8 bg-gradient-to-br from-[#6A38C2] to-[#4f28a0] rounded-2xl px-8">
            <h2 className="text-2xl font-bold text-white">Ready to find your dream job?</h2>
            <p className="text-purple-200 text-sm">
              Sign in to browse jobs, explore categories, and get your candidate profile verified.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/login">
                <Button className="bg-white text-[#6A38C2] hover:bg-gray-100 font-semibold px-8">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-[#F83002] hover:bg-[#d42a02] text-white font-semibold px-8">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-20">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
