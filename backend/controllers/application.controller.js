import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { sendApplicationAcceptedEmail } from "../utils/mailer.js";

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
    // create a new application
    const newApplication = await Application.create({
      job: jobId,
      applicant: userId,
    });

    job.applications.push(newApplication._id);
    await job.save();
    return res.status(201).json({
      message: "Job applied successfully.",
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
