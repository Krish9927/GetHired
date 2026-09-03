import mongoose from "mongoose";

/**
 * BaseUser — shared fields for Student and Recruiter.
 * Uses Mongoose discriminators so both models live in the same
 * "users" collection but are queryable independently.
 *
 * Discriminator key: "role"  → stored as "student" | "recruiter" in every doc.
 */
const baseUserSchema = new mongoose.Schema(
  {
    fullname:    { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },  // String to preserve leading zeros
    password:    { type: String, required: true },

    profile: {
      bio:          { type: String, default: "" },
      profilePhoto: { type: String, default: "" },
    },

    // Email verification (shared — both roles verify email)
    isEmailVerified:        { type: Boolean, default: false },
    emailOtp:               { type: String },
    emailOtpExpiry:         { type: Date },

    // Password reset (shared)
    resetPasswordOtp:        { type: String },
    resetPasswordOtpExpiry:  { type: Date },
  },
  {
    timestamps: true,
    discriminatorKey: "role",   // "role" field will hold "student" | "recruiter"
    collection: "users",        // both models share one collection
  }
);

export const BaseUser = mongoose.model("User", baseUserSchema);
