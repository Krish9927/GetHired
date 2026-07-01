import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    getTopics,
    getQuestionsByTopic,
    createTest,
    startTest,
    getTestForCandidate,
    submitTest,
    getTestResults,
    getTestsForJob,
    getMySubmission,
    getActiveTestsForCandidate,
} from "../controllers/test.controller.js";

const router = express.Router();

// Question bank
router.get("/topics", getTopics);
router.get("/questions", isAuthenticated, getQuestionsByTopic);

// Recruiter
router.post("/create", isAuthenticated, createTest);
router.put("/:testId/start", isAuthenticated, startTest);
router.get("/job/:jobId", isAuthenticated, getTestsForJob);
router.get("/:testId/results", isAuthenticated, getTestResults);

// Candidate
router.get("/my-tests", isAuthenticated, getActiveTestsForCandidate);
router.get("/:testId/take", isAuthenticated, getTestForCandidate);
router.post("/:testId/submit", isAuthenticated, submitTest);
router.get("/:testId/my-submission", isAuthenticated, getMySubmission);

export default router;
