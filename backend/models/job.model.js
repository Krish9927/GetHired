import mongoose from "mongoose";
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: Array,
    },
    salary: {
      type: Number,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
    minimumCgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    // Fake job detection
    isSuspicious: { type: Boolean, default: false },
    suspiciousReasons: [{ type: String }],
    jobStatus: {
      type: String,
      enum: ["active", "under_review", "rejected"],
      default: "active",
    },
  },
  { timestamps: true }
);
export const Job = mongoose.model("Job", jobSchema);
