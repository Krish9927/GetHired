import mongoose from "mongoose";
import { BaseUser } from "./baseUser.model.js";

/**
 * Recruiter — extends BaseUser with company/hiring-specific fields.
 * discriminatorKey value = "recruiter"
 */
const recruiterSchema = new mongoose.Schema({
  profile: {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
});

export const Recruiter = BaseUser.discriminator("recruiter", recruiterSchema);
