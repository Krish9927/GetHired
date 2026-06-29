import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import verificationRoute from "./routes/verification.route.js";
import companyVerificationRoute from "./routes/companyVerification.route.js";
import externalJobsRoute from "./routes/externalJobs.route.js";
import chatRoute from "./routes/chat.route.js";
import testRoute from "./routes/test.route.js";
import { seedQuestions } from "./controllers/test.controller.js";

dotenv.config({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

const PORT = process.env.PORT || 8000;

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/verification", verificationRoute);
app.use("/api/v1/company-verification", companyVerificationRoute);
app.use("/api/v1/external-jobs", externalJobsRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/test", testRoute);

// ── Serve Frontend (production) ───────────────────────────────────────────────
const frontendDistPath = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  const indexPath = path.join(frontendDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send(`Frontend not found at: ${indexPath}`);
    }
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  connectDB().then(() => seedQuestions());
  console.log(`✅ Server running at port ${PORT}`);
});
