import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Test } from "../models/test.model.js";
import { sendApplicationAcceptedEmail, sendTestInviteEmail } from "../utils/mailer.js";

export const applyJob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;

    if (!jobId) {
      return res.status(400).json({
        message: "Job id is required.",
        success: false,
      });
    }

    // check if the user has already applied for the job
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
        success: false,
      });
    }

    // check if the jobs exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // check if the user meets all eligibility requirements
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // 1. CGPA check
    if (job.minimumCgpa > 0) {
      if (user.profile?.cgpa === undefined || user.profile?.cgpa < job.minimumCgpa) {
        return res.status(400).json({
          message: `Eligibility check failed: Minimum CGPA required is ${job.minimumCgpa}. Your CGPA: ${user.profile?.cgpa ?? "N/A"}`,
          success: false,
        });
      }
    }

    // 2. Skills check
    if (job.requirements && job.requirements.length > 0) {
      const userSkills = (user.profile?.skills || []).map((s) => s.toLowerCase().trim());
      const missingSkills = job.requirements
        .map((r) => r.trim())
        .filter((r) => r && !userSkills.includes(r.toLowerCase()));
      
      if (missingSkills.length > 0) {
        return res.status(400).json({
          message: `Eligibility check failed: Missing required skill(s): ${missingSkills.join(", ")}`,
          success: false,
        });
      }
    }

    // create a new application
    const newApplication = await Application.create({
      job: jobId,
      applicant: userId,
    });

    job.applications.push(newApplication._id);
    await job.save();

    // Send email invitation if job has a test
    if (job.hasTest) {
      const test = await Test.findOne({ job: jobId });
      if (test) {
        sendTestInviteEmail(user.email, user.fullname, {
          testTitle: test.title,
          duration: test.durationMinutes,
          minimumScore: test.minimumScore,
          testId: test._id,
          scheduledAt: test.scheduledAt,
        }).catch((err) => console.error("Email send failed:", err));
      } else {
        // Fallback if test document not created yet
        sendTestInviteEmail(user.email, user.fullname, {
          testTitle: `${job.title} Assessment`,
          duration: job.testDuration || 30,
          minimumScore: job.testMinimumScore || 60,
          testId: "",
          scheduledAt: job.testDate,
        }).catch((err) => console.error("Email send failed:", err));
      }
    }

    return res.status(201).json({
      message: job.hasTest
        ? "Job applied successfully. You qualified all requirements! An assessment test invite has been sent to your email."
        : "Job applied successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAppliedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const application = await Application.find({ applicant: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "company",
          options: { sort: { createdAt: -1 } },
        },
      });

    if (!application) {
      return res.status(404).json({
        message: "No Applications",
        success: false,
      });
    }

    return res.status(200).json({
      application,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// Admin dekhega kitne users ne apply kiya hai
export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId).populate({
      path: "applications",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "applicant",
        select: "fullname email phoneNumber profile isEmailVerified isCollegeEmail isVerified atsScore trustScore profileCompleteness createdAt",
      },
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    return res.status(200).json({
      job,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
        success: false,
      });
    }

    const application = await Application.findById(applicationId).populate({
      path: "applicant",
      select: "fullname email",
    }).populate({
      path: "job",
      select: "title",
      populate: { path: "company", select: "name" },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
        success: false,
      });
    }

    const newStatus = status.toLowerCase();
    let emailSent = false;

    application.status = newStatus;
    await application.save();

    if (newStatus === "accepted") {
      const { applicant, job } = application;

      if (!applicant?.email) {
        console.warn(`⚠️ No applicant email for application ${applicationId}`);
      } else {
        emailSent = await sendApplicationAcceptedEmail(
          applicant.email,
          applicant.fullname,
          job?.title || "the role",
          job?.company?.name || "the company"
        );
      }
    }

    return res.status(200).json({
      message: newStatus === "accepted"
        ? emailSent
          ? `Applicant selected. Email sent to ${application.applicant?.email}.`
          : "Applicant selected, but the notification email could not be sent. Check server logs."
        : "Status updated successfully.",
      success: true,
      emailSent,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
