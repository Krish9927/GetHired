import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    website: { type: String },
    location: { type: String },
    logo: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Verification fields
    companyEmail: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },

    // Domain & website checks
    emailDomain: { type: String },
    websiteDomain: { type: String },
    isDomainMatched: { type: Boolean, default: false },
    isWebsiteHttps: { type: Boolean, default: false },

    // Social / legal
    linkedinUrl: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    cinNumber: { type: String, default: "" },

    // Trust & approval
    trustScore: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", companySchema);
