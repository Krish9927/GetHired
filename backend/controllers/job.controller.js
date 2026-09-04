import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { Application } from "../models/application.model.js";
import { detectFakeJob } from "../utils/fakeJobDetector.js";

// admin post karega job
export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experience,
      position,
      companyId,
      minimumCgpa,
      hasTest,
      testDescription,
      testDate,
      testDuration,
      testMinimumScore,
      testDeadline,
    } = req.body;
    const userId = req.id;

    if (
      !title ||
      !description ||
      !requirements ||
      salary === undefined ||
      !location ||
      !jobType ||
      experience === undefined ||
      !position ||
      !companyId
    ) {
      return res.status(400).json({
        message: "Something is missing.",
        success: false,
      });
    }

    const parsedSalary = Number(salary);
    if (isNaN(parsedSalary)) {
      return res.status(400).json({
        message: "Invalid salary value. Provide a numeric salary.",
        success: false,
      });
    }

    // If an assessment test is required, a scheduled date is mandatory
    const wantsTest = hasTest === true || hasTest === "true";
    if (wantsTest && !testDate) {
      return res.status(400).json({
        message: "A scheduled test date is required when 'Schedule Assessment Test' is enabled. Please set a date or disable the test option.",
        success: false,
      });
    }

    const experienceValue = isNaN(Number(experience)) ? String(experience) : Number(experience);

    // Look up company first — needed for companyName in AI prompt
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found.", success: false });

    // ── Company must be approved by admin before posting jobs ───────────────
    if (company.verificationStatus !== "approved") {
      const messages = {
        pending: "Your company is pending admin approval. You can post jobs once it is approved.",
        rejected: "Your company registration was rejected. Please contact support or update your company details.",
        banned: "Your company has been banned from the platform.",
      };
      return res.status(403).json({
        message: messages[company.verificationStatus] || "Company not approved.",
        verificationStatus: company.verificationStatus,
        success: false,
      });
    }

    // ── Hybrid fake-job detection ────────────────────────────────────────────
    // Tier 1: hard scam phrases → instant flag (no API call)
    // Tier 2: soft signals below threshold → skip AI, mark safe
    // Tier 3: borderline soft score → call Gemini for semantic verdict
    const detection = await detectFakeJob({
      title,
      description,
      requirements,
      salary: parsedSalary,
      companyName: company.name,
      location,
      jobType,
      experience,
    });

    const { isSuspicious, suspiciousReasons, aiConfidenceScore, aiVerdict, detectionMethod } = detection;

    if (detectionMethod === "ai" || detectionMethod === "hybrid") {
      console.log(`[FakeJobDetector] Gemini verdict for "${title}": ${aiVerdict} (score: ${aiConfidenceScore})`);
    }

    const jobStatus = isSuspicious ? "under_review" : "active";

    const job = await Job.create({
      title,
      description,
      requirements: requirements.split(","),
      salary: parsedSalary,
      location,
      jobType,
      experienceLevel: experienceValue,
      position,
      company: companyId,
      created_by: userId,
      minimumCgpa: minimumCgpa ? parseFloat(minimumCgpa) : 0,
      isSuspicious,
      suspiciousReasons,
      jobStatus,
      aiConfidenceScore,
      aiVerdict,
      detectionMethod,
      hasTest: hasTest === "true" || hasTest === true,
      testDescription: testDescription || "",
      testDate: testDate ? new Date(testDate) : null,
      testDeadline: testDeadline ? new Date(testDeadline) : null,
      testDuration: testDuration ? Number(testDuration) : 30,
      testMinimumScore: testMinimumScore ? Number(testMinimumScore) : 60,
      testScheduleLimit: testDate ? 7 : 0, // 7 days limit if test scheduled, 0 if no test
      testScheduleStatus: testDate ? "pending" : "none",
    });

    return res.status(201).json({
      message: "New job created successfuly.",
      job,
      isSuspicious,
      detectionMethod,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// student ke liye
export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const now = new Date();
    const query = {
      jobStatus: "active",
      selectionClosed: { $ne: true },
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
      $and: [
        {
          $or: [
            { hasTest: { $ne: true } },
            {
              $and: [
                { testDate: { $gt: now } },
                { testScheduleLimit: { $gt: 0 } },
                {
                  $expr: {
                    $lt: [
                      {
                        $dateDiff: {
                          startDate: "$createdAt",
                          endDate: "$$NOW",
                          unit: "day"
                        }
                      },
                      "$testScheduleLimit"
                    ]
                  }
                }
              ]
            },
            { testDate: null },
          ],
        },
      ],
    };
    const jobs = await Job.find(query)
      .populate({
        path: "company",
      })
      .sort({ createdAt: -1 });

    if (!jobs) {
      return res.status(404).json({
        message: "Jobs not found.",
        success: false,
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// student ke liye
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId)
      .populate({ path: "applications" })
      .populate({
        path: "company",
        select: "name logo description website location trustScore verificationStatus isVerified linkedinUrl",
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

// admin ne kitne job create kiye hain abhi tak
export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId, selectionClosed: { $ne: true } })
      .populate({ path: "company" })
      .sort({ createdAt: -1 });

    if (!jobs) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }
    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// ─── Get selected candidates for a company ───────────────────────────────────
export const getSelectedCandidates = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Case 1: jobs still exist (selection not yet closed)
    const liveJobIds = await Job.find({ company: companyId }).select("_id");
    const liveIds = liveJobIds.map((j) => j._id);

    // Case 2: jobs deleted after selection closed — applications stamped with companyRef
    const selectedApplications = await Application.find({
      status: "accepted",
      $or: [
        { job: { $in: liveIds } },
        { companyRef: companyId },
      ],
    })
      .populate({ path: "applicant", select: "fullname email phoneNumber profile.profilePhoto" })
      .populate({ path: "job", select: "title" })
      .populate({ path: "companyRef", select: "name" })
      .sort({ closedAt: -1, createdAt: -1 });

    // Normalise — use stamped jobTitle if live job is gone
    const candidates = selectedApplications.map((app) => ({
      _id: app._id,
      applicant: app.applicant,
      status: app.status,
      closedAt: app.closedAt,
      job: app.job
        ? app.job
        : { title: app.jobTitle || "Unknown Role" },
    }));

    return res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found.", success: false });
    }

    // Only the creator can delete their job
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorised to delete this job.", success: false });
    }

    // Delete related applications too
    await Application.deleteMany({ job: jobId });
    await Job.findByIdAndDelete(jobId);

    return res.status(200).json({ message: "Job deleted successfully.", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error.", success: false });
  }
};

export const closeSelection = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found.", success: false });

    if (job.created_by.toString() !== userId) {
      return res.status(403).json({ message: "Not authorised.", success: false });
    }

    // Stamp the accepted applications with the job title and company before deleting
    // (so SelectedCandidates page can still show job/company info after deletion)
    const acceptedApps = await Application.find({ job: jobId, status: "accepted" })
      .populate({ path: "job", select: "title company" });

    for (const app of acceptedApps) {
      app.jobTitle = job.title;
      app.companyRef = job.company;
      app.closedAt = new Date();
      await app.save();
    }

    // Delete only non-accepted applications (pending / rejected) — keep hired candidates' records
    await Application.deleteMany({ job: jobId, status: { $in: ["pending", "rejected"] } });

    // Hard-delete the job — it's no longer needed on the portal
    await Job.findByIdAndDelete(jobId);

    return res.status(200).json({
      message: "Selection closed. Job removed from the platform. Accepted candidates' records are preserved.",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error.", success: false });
  }
};
