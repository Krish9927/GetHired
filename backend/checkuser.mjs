import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);
console.log("connected");

const col = mongoose.connection.collection("users");
const u = await col.findOne({ email: "kusyapk@gmail.com" });

if (!u) {
  console.log("NOT FOUND");
} else {
  console.log("role:", u.role);
  console.log("fullname:", u.fullname);
  console.log("password length:", u.password?.length);
  console.log("password prefix (first 7 chars):", u.password?.slice(0, 7));
  console.log("looks like bcrypt hash:", u.password?.startsWith("$2"));
  console.log("isEmailVerified:", u.isEmailVerified);
  console.log("atsScore:", u.atsScore);
  console.log("trustScore:", u.trustScore);
  console.log("profile.resume:", u.profile?.resume ? "EXISTS" : "NONE");
  console.log("profile.resumeOriginalName:", u.profile?.resumeOriginalName);
  console.log("atsFeedback.source:", u.atsFeedback?.source);
  // Check for any field with very large data
  const jsonStr = JSON.stringify(u);
  console.log("Total document size (bytes):", Buffer.byteLength(jsonStr, "utf8"));
}

await mongoose.disconnect();
process.exit(0);
