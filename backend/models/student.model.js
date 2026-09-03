import mongoose from "mongoose";
import { BaseUser } from "./baseUser.model.js";

/**
 * Student — extends BaseUser with job-seeker-specific fields.
 * discriminatorKey value = "student"
 */
const studentSchema = new mongoose.Schema({
  profile: {
    skills: [{ type: String }],
    resume: { type: String },
    resumeOriginalName: { type: String },
    githubUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    cgpa: { type: Number, min: 0, max: 10 },
    cgpaProof: { type: String },   // Cloudinary URL
    college: { type: String, default: "" },
  },

  // College email flag
  isCollegeEmail: { type: Boolean, default: false },

  // Scores & verification
  atsScore: { type: Number, default: 0 },
  trustScore: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  profileCompleteness: { type: Number, default: 0 },

  // Detailed ATS feedback from hybrid RAG + Gemini analysis
  atsFeedback: {
    aiScore: { type: Number, default: null },
    keywordScore: { type: Number, default: null },
    source: { type: String, default: "keyword_fallback" }, // "hybrid" | "keyword_fallback"
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    suggestions: [{ type: String }],
    keywordsFound: [{ type: String }],
    keywordsMissing: [{ type: String }],
    sectionsFound: [{ type: String }],
    sectionsMissing: [{ type: String }],
    levelDetected: { type: String, default: "unknown" }, // "fresher"|"junior"|"mid"|"senior"
    summary: { type: String, default: "" },
    analyzedAt: { type: Date, default: null },
  },
});

export const Student = BaseUser.discriminator("student", studentSchema);
