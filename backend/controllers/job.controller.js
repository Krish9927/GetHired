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
      testDuration: testDuration ? Number(testDuration) : 30,
      testMinimumScore: testMinimumScore ? Number(testMinimumScore) : 60,
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
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
      $and: [
        {
          $or: [
            { hasTest: { $ne: true } },
            { testDate: { $gt: now } },
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
    const jobs = await Job.find({ created_by: adminId }).populate({
      path: "company",
    });

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

// ─── Get selected candidates for a company ────────────────────────────────────────
export const getSelectedCandidates = async (req, res) => {
  try {
    const { companyId } = req.params;
    // Find jobs belonging to the company
    const jobs = await Job.find({ company: companyId }).select('_id');
    const jobIds = jobs.map(j => j._id);
    const selectedApplications = await Application.find({
      job: { $in: jobIds },
      status: 'accepted',
    })
      .populate({ path: 'applicant', select: 'fullname email profile.profilePhoto' })
      .populate({ path: 'job', select: 'title' });
    return res.status(200).json({ success: true, candidates: selectedApplications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};
