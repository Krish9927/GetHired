import React from "react";

const HeroSection = () => {
  return (
    <div className="text-center py-16">
      <div className="flex flex-col gap-5">
        <span className="mx-auto px-4 py-2 rounded-full dark:bg-gray-800 bg-gray-100 text-[#F83002] font-medium text-sm">
          No. 1 Job Search Platform
        </span>
        <h1 className="text-5xl font-bold leading-tight">
          Discover, Apply & <br /> Land Your{" "}
          <span className="text-[#6A38C2]">Dream Job</span>
        </h1>
        <p className="dark:text-gray-400 text-gray-500 max-w-xl mx-auto">
          Connect with top companies, get verified, and take the next step in your career — all in one place.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
