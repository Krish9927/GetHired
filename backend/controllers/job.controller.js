import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { detectScamPhrases } from "../utils/companyTrustScore.js";

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

    // Fake job detection
    const textToScan = `${title} ${description} ${requirements}`;
    const scamMatches = detectScamPhrases(textToScan);
    const isSuspicious = scamMatches.length > 0;

    // Check if company is verified — unverified companies can't post publicly
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found.", success: false });

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
      suspiciousReasons: scamMatches,
      jobStatus,
    });

    return res.status(201).json({
      message: "New job created successfuly.",
      job,
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
    const query = {
      jobStatus: "active",
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
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
    const job = await Job.findById(jobId).populate({
      path: "applications",
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
