/**
 * One-time migration script: Remove legacy jobs
 *
 * Deletes all jobs whose company does NOT have verificationStatus === "approved".
 * This cleans up jobs posted before the company verification system was introduced.
 *
 * Usage:
 *   cd backend
 *   node scripts/removeLegacyJobs.js
 *
 * Pass --dry-run to preview without deleting:
 *   node scripts/removeLegacyJobs.js --dry-run
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { Application } from "../models/application.model.js";

dotenv.config({ path: "../.env" });

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // Find all approved company IDs
  const approvedCompanies = await Company.find(
    { verificationStatus: "approved" },
    { _id: 1, name: 1 }
  );
  const approvedIds = approvedCompanies.map((c) => c._id);

  console.log(`✅ Approved companies (${approvedCompanies.length}):`);
  approvedCompanies.forEach((c) => console.log(`   • ${c.name}`));

  // Find all legacy jobs — company is NOT in the approved list
  const legacyJobs = await Job.find(
    { company: { $nin: approvedIds } },
    { _id: 1, title: 1, company: 1, createdAt: 1 }
  ).populate("company", "name verificationStatus");

  if (legacyJobs.length === 0) {
    console.log("\n🎉 No legacy jobs found. Nothing to remove.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n🗑  Legacy jobs to remove (${legacyJobs.length}):`);
  legacyJobs.forEach((j) => {
    const companyName = j.company?.name ?? "unknown company";
    const status = j.company?.verificationStatus ?? "no status";
    console.log(`   • [${j._id}] "${j.title}" — ${companyName} (${status}) — posted ${j.createdAt.toDateString()}`);
  });

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN — no changes made. Remove --dry-run to actually delete.");
    await mongoose.disconnect();
    return;
  }

  // Delete related applications first (referential integrity)
  const legacyJobIds = legacyJobs.map((j) => j._id);
  const appResult = await Application.deleteMany({ job: { $in: legacyJobIds } });
  console.log(`\n🗑  Deleted ${appResult.deletedCount} related applications.`);

  // Delete the jobs
  const jobResult = await Job.deleteMany({ _id: { $in: legacyJobIds } });
  console.log(`🗑  Deleted ${jobResult.deletedCount} legacy jobs.`);

  console.log("\n✅ Done. Database is clean.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
