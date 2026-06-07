import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";
import { calculateTrustScore, calculateProfileCompleteness, isCollegeEmailAddress } from "../utils/trustScore.js";
import { scoreResumeFromUrl } from "../utils/atsScorer.js";
import { sendWelcomeEmail } from "../utils/mailer.js";

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }
    const file = req.file;
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      isCollegeEmail: isCollegeEmailAddress(email),
      profile: {
        profilePhoto: cloudResponse.secure_url,
      },
    });
    newUser.profileCompleteness = calculateProfileCompleteness(newUser);
    newUser.trustScore = calculateTrustScore(newUser);
    await newUser.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, fullname, role);

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email and password",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email and password",
        success: false,
      });
    }
    // check role is correct or not
    if (role !== user.role) {
      return res.status(400).json({
        message: "Account does not exist with current role",
        success: false,
      });
    }

    const tokenData = {
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      isCollegeEmail: user.isCollegeEmail,
      isVerified: user.isVerified,
      atsScore: user.atsScore,
      trustScore: user.trustScore,
      profileCompleteness: user.profileCompleteness,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const file = req.file;

    let skillsArray;
    if (skills) {
      skillsArray = skills.split(",");
    }

    const userId = req.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skillsArray;

    // Only upload if a file was actually provided
    if (file) {
      const isPdf = file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf");
      const fileUri = getDataUri(file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: isPdf ? "raw" : "auto",
        folder: "resumes",
        access_mode: "public",  // ensure public access
      });
      console.log("[Upload] Resume URL:", cloudResponse.secure_url);
      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = file.originalname;
      user.atsScore = await scoreResumeFromUrl(cloudResponse.secure_url);
    }

    user.profileCompleteness = calculateProfileCompleteness(user);
    user.trustScore = calculateTrustScore(user);
    user.isVerified = user.trustScore >= 60 && user.isEmailVerified;

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      isEmailVerified: user.isEmailVerified,
      isCollegeEmail: user.isCollegeEmail,
      isVerified: user.isVerified,
      atsScore: user.atsScore,
      trustScore: user.trustScore,
      profileCompleteness: user.profileCompleteness,
    };

    return res.status(200).json({ message: "Profile updated successfully", user, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
