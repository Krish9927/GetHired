import cron from "node-cron";
import { Test } from "../models/test.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

// ─── Utility: delete a job and all its applications cleanly ──────────────────
const deleteJobWithApplications = async (job) => {
  await Application.deleteMany({ job: job._id });
  await Job.findByIdAndDelete(job._id);
  console.log(`[JobCleanup] Deleted job "${job.title}" (${job._id}) — ${job._deleteReason}`);
};

// ─── Cron 1: Hourly — expired / incomplete test-jobs ─────────────────────────
cron.schedule("0 * * * *", async () => {
  console.log("[JobCleanup] Hourly: checking for expired/incomplete test-jobs...");
  try {
    const now = new Date();

    // 1a. Delete test-jobs with no testDate set
    const noDateJobs = await Job.find({
      hasTest: true,
      $or: [{ testDate: null }, { testDate: { $exists: false } }],
    }).select("_id title");

    for (const job of noDateJobs) {
      job._deleteReason = "hasTest=true but no testDate set";
      await deleteJobWithApplications(job);
    }
    if (noDateJobs.length) {
      console.log(`[JobCleanup] Removed ${noDateJobs.length} test-job(s) with no testDate.`);
    }

    // 1b. Delete test-jobs whose testDeadline has passed
    // testDeadline = last moment a candidate can attempt the test.
    // Once the deadline passes the job listing is meaningless — delete it.
    const deadlineExpiredJobs = await Job.find({
      hasTest: true,
      testDeadline: { $exists: true, $ne: null, $lt: now },
    }).select("_id title testDeadline");

    for (const job of deadlineExpiredJobs) {
      job._deleteReason = `testDeadline ${job.testDeadline.toISOString()} has passed`;
      await deleteJobWithApplications(job);
    }
    if (deadlineExpiredJobs.length) {
      console.log(`[JobCleanup] Removed ${deadlineExpiredJobs.length} job(s) whose test deadline expired.`);
    }

    if (!noDateJobs.length && !deadlineExpiredJobs.length) {
      console.log("[JobCleanup] No incomplete or expired test-jobs found.");
    }
  } catch (err) {
    console.error("[JobCleanup] Hourly cleanup error:", err.message);
  }
});

// ─── Cron 2: Daily at 02:00 AM — expired test schedule limits + test cleanup ──
cron.schedule("0 2 * * *", async () => {
  console.log("[JobCleanup] Daily: running full cleanup...");
  try {
    const now = new Date();

    // ── Expired testScheduleLimit jobs ─────────────────────────────────────
    const expiredLimitJobs = await Job.find({
      testScheduleLimit: { $gt: 0 },
      testScheduleStatus: "pending",
      $expr: {
        $gt: [
          { $dateDiff: { startDate: "$createdAt", endDate: "$$NOW", unit: "day" } },
          "$testScheduleLimit",
        ],
      },
    });

    for (const job of expiredLimitJobs) {
      job.testScheduleStatus = "expired";
      await job.save();
      console.log(`[JobCleanup] Job "${job.title}" (${job._id}) marked expired — schedule limit exceeded.`);
    }

    // ── Completed / overdue tests ──────────────────────────────────────────
    const activeTests = await Test.find({
      status: { $in: ["active", "scheduled"] },
      $or: [
        { scheduledAt: { $exists: true, $ne: null } },
        { createdAt: { $exists: true } },
      ],
    });

    for (const test of activeTests) {
      const start = test.scheduledAt || test.createdAt;
      const endTime = new Date(start.getTime() + (test.durationMinutes || 30) * 60 * 1000);
      if (now >= endTime) {
        test.status = "completed";
        await test.save();
        await Job.findByIdAndUpdate(test.job, {
          hasTest: false,
          testDescription: "",
          testDate: null,
          testDuration: null,
          testMinimumScore: null,
        });
        console.log(`[JobCleanup] Test ${test._id} completed — job ${test.job} cleared of test info.`);
      }
    }

    console.log("[JobCleanup] Daily cleanup complete.");
  } catch (err) {
    console.error("[JobCleanup] Daily cleanup error:", err.message);
  }
});
