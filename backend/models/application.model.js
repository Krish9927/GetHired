import mongoose from "mongoose";
const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    // Stamped when selection is closed — preserves job info after job deletion
    jobTitle: { type: String, default: "" },
    companyRef: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);
export const Application = mongoose.model("Application", applicationSchema);
