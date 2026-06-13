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
import { isAIEnabled } from "./utils/aiChatbot.js";

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
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Don't throw a hard server-side error, just deny CORS headers (returns false)
      // This prevents 500 errors on same-origin requests or unconfigured origins
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

// ── Serve Frontend (production) ───────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../Frontend/dist");

  console.log(" Serving frontend from:", frontendDistPath);

  app.use(express.static(frontendDistPath));

  // Catch-all: send React app for any non-API route (must be after API routes)
  app.get("*", (req, res) => {
    const indexPath = path.join(frontendDistPath, "index.html");
    console.log(" Serving index.html from:", indexPath);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(" Error serving index.html:", err.message);
        res.status(500).send("Frontend not found. Build may have failed.");
      }
    });
  });
}

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  connectDB();
  console.log(`Server running at port ${PORT}`);
  if (isAIEnabled()) {
    const provider = process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY?.trim()
      ? "OpenAI"
      : "Gemini";
    console.log(`AI chatbot enabled (${provider})`);
  } else {
    console.warn("AI chatbot disabled — add GEMINI_API_KEY to backend/.env and restart");
  }
});
