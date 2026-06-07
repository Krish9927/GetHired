import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: Number, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "recruiter"], required: true },
    profile: {
      bio: { type: String },
      skills: [{ type: String }],
      resume: { type: String },
      resumeOriginalName: { type: String },
      company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      profilePhoto: { type: String, default: "" },
      githubUrl: { type: String, default: "" },
      linkedinUrl: { type: String, default: "" },
      cgpa: { type: Number, min: 0, max: 10 },
      cgpaProof: { type: String }, // cloudinary url
      college: { type: String, default: "" },
    },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },
    isCollegeEmail: { type: Boolean, default: false },
    // Password reset
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpiry: { type: Date },
    // Scores
    atsScore: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },
    // Verification status
    isVerified: { type: Boolean, default: false },
    profileCompleteness: { type: Number, default: 0 }, // percentage 0-100
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
