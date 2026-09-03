import { BaseUser } from "../models/baseUser.model.js";
import { Student } from "../models/student.model.js";
import { Recruiter } from "../models/recruiter.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { calculateStudentTrustScore, calculateStudentProfileCompleteness, isCollegeEmailAddress } from "../utils/trustScore.js";
import { scoreResumeFromUrl } from "../utils/atsScorer.js";
import { sendWelcomeEmail } from "../utils/mailer.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: "1d" });

const setCookieAndRespond = (res, status, token, payload) =>
  res.status(status).cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
  }).json(payload);

// Builds the safe user object returned to the frontend
const buildUserPayload = (user) => {
  const base = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profile: user.profile,
    isEmailVerified: user.isEmailVerified,
  };
  if (user.role === "student") {
    return {
      ...base,
      isCollegeEmail: user.isCollegeEmail,
      isVerified: user.isVerified,
      atsScore: user.atsScore,
      trustScore: user.trustScore,
      profileCompleteness: user.profileCompleteness,
    };
  }
  return base; // recruiter — no score fields
};

// ─── Student Register ─────────────────────────────────────────────────────────

export const registerStudent = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password } = req.body;
    if (!fullname || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    const existing = await BaseUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists with this email", success: false });
    }

    let profilePhotoUrl = "";
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloud = await cloudinary.uploader.upload(fileUri.content);
      profilePhotoUrl = cloud.secure_url;
    }

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({
      fullname,
      email,
      phoneNumber,
      password: hashed,
      isCollegeEmail: isCollegeEmailAddress(email),
      profile: { profilePhoto: profilePhotoUrl },
    });

    student.profileCompleteness = calculateStudentProfileCompleteness(student);
    student.trustScore = calculateStudentTrustScore(student);
    await student.save();

    sendWelcomeEmail(email, fullname, "student");

    return res.status(201).json({ message: "Student account created successfully", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", success: false });
  }
};

// ─── Recruiter Register ───────────────────────────────────────────────────────

export const registerRecruiter = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password } = req.body;
    if (!fullname || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    const existing = await BaseUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists with this email", success: false });
    }

    let profilePhotoUrl = "";
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloud = await cloudinary.uploader.upload(fileUri.content);
      profilePhotoUrl = cloud.secure_url;
    }

    const hashed = await bcrypt.hash(password, 10);
    await Recruiter.create({
      fullname,
      email,
      phoneNumber,
      password: hashed,
      profile: { profilePhoto: profilePhotoUrl },
    });

    sendWelcomeEmail(email, fullname, "recruiter");

    return res.status(201).json({ message: "Recruiter account created successfully", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", success: false });
  }
};

// ─── Login (role-aware) ───────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required", success: false });
    }
    if (!["student", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Invalid role", success: false });
    }

    // Query the correct discriminator model so only that role matches
    const Model = role === "student" ? Student : Recruiter;
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password", success: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect email or password", success: false });
    }

    const token = signToken(user._id);
    return setCookieAndRespond(res, 200, token, {
      message: `Welcome back, ${user.fullname}`,
      user: buildUserPayload(user),
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (_req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// ─── Admin Login ──────────────────────────────────────────────────────────────

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required", success: false });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!adminEmails.includes(email.trim().toLowerCase())) {
      return res.status(403).json({ message: "Access denied. Not an admin account.", success: false });
    }

    // Admin can be stored as any role — search BaseUser (covers both)
    const user = await BaseUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password", success: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password", success: false });
    }

    const token = signToken(user._id);
    return setCookieAndRespond(res, 200, token, {
      message: `Welcome, ${user.fullname}`,
      user: { _id: user._id, fullname: user.fullname, email: user.email, role: user.role, isAdmin: true },
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// ─── Update Profile (Student) ─────────────────────────────────────────────────

export const updateStudentProfile = async (req, res) => {
  try {
    const { fullname, phoneNumber, bio, skills } = req.body;
    const student = await Student.findById(req.id);
    if (!student) return res.status(404).json({ message: "Student not found", success: false });

    if (fullname) student.fullname = fullname;
    if (phoneNumber) student.phoneNumber = phoneNumber;
    if (bio) student.profile.bio = bio;
    if (skills) student.profile.skills = skills.split(",").map((s) => s.trim());

    if (req.file) {
      const isPdf = req.file.mimetype === "application/pdf" ||
        req.file.originalname.toLowerCase().endsWith(".pdf");
      const fileUri = getDataUri(req.file);
      const cloud = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: isPdf ? "raw" : "auto",
        folder: "resumes",
        access_mode: "public",
      });
      student.profile.resume = cloud.secure_url;
      student.profile.resumeOriginalName = req.file.originalname;

      // Hybrid ATS scoring — returns { score, feedback }
      const atsResult = await scoreResumeFromUrl(cloud.secure_url);
      student.atsScore = atsResult.score;
      if (atsResult.feedback) {
        student.atsFeedback = { ...atsResult.feedback, analyzedAt: new Date() };
      }
    }

    student.profileCompleteness = calculateStudentProfileCompleteness(student);
    student.trustScore = calculateStudentTrustScore(student);
    student.isVerified = student.trustScore >= 60 && student.isEmailVerified;
    await student.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildUserPayload(student),
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// ─── Update Profile (Recruiter) ───────────────────────────────────────────────

export const updateRecruiterProfile = async (req, res) => {
  try {
    const { fullname, phoneNumber, bio } = req.body;
    const recruiter = await Recruiter.findById(req.id);
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found", success: false });

    if (fullname) recruiter.fullname = fullname;
    if (phoneNumber) recruiter.phoneNumber = phoneNumber;
    if (bio) recruiter.profile.bio = bio;

    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloud = await cloudinary.uploader.upload(fileUri.content);
      recruiter.profile.profilePhoto = cloud.secure_url;
    }

    await recruiter.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildUserPayload(recruiter),
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
