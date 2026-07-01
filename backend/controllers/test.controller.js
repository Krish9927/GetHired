import { Test } from "../models/test.model.js";
import { Question } from "../models/question.model.js";
import { TestSubmission } from "../models/testSubmission.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { User } from "../models/user.model.js";
import { sendTestInviteEmail, sendTestResultEmail, sendApplicationAcceptedEmail } from "../utils/mailer.js";
import { QUESTION_BANK } from "../utils/questionBank.js";

// ─── Seed question bank if empty ─────────────────────────────────────────────
export const seedQuestions = async () => {
    const count = await Question.countDocuments();
    if (count === 0) {
        await Question.insertMany(QUESTION_BANK);
        console.log(`✅ Seeded ${QUESTION_BANK.length} questions`);
    }
};

// ─── Get available topics ─────────────────────────────────────────────────────
export const getTopics = async (req, res) => {
    try {
        const topics = await Question.distinct("topic");
        return res.status(200).json({ success: true, topics });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get questions from bank by topic ────────────────────────────────────────
export const getQuestionsByTopic = async (req, res) => {
    try {
        const { topic, difficulty = "medium", limit = 10 } = req.query;
        const filter = {};
        if (topic) filter.topic = topic;
        if (difficulty) filter.difficulty = difficulty;
        const questions = await Question.find(filter).limit(Number(limit)).select("-correctIndex -explanation");
        return res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Create test for a job ────────────────────────────────────────────────────
export const createTest = async (req, res) => {
    try {
        const {
            jobId, title, description, durationMinutes,
            minimumScore, scheduledAt, topics, autoSelectCount,
            customQuestionIds,
        } = req.body;

        const job = await Job.findOne({ _id: jobId, created_by: req.id });
        if (!job) return res.status(404).json({ message: "Job not found", success: false });

        let questionIds = customQuestionIds || [];

        // Auto-select questions from bank if requested
        if (autoSelectCount > 0 && topics?.length > 0) {
            const autoQuestions = await Question.find({
                topic: { $in: topics },
                difficulty: "medium",
            }).limit(Number(autoSelectCount));
            questionIds = [...questionIds, ...autoQuestions.map((q) => q._id.toString())];
        }

        const test = await Test.create({
            job: jobId,
            company: job.company,
            createdBy: req.id,
            title,
            description,
            questions: questionIds,
            durationMinutes: durationMinutes || 30,
            minimumScore: minimumScore || 60,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? "scheduled" : "draft",
            topics: topics || [],
            autoSelectCount: autoSelectCount || 0,
        });

        return res.status(201).json({ message: "Test created", success: true, test });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Start test (company manually activates) ──────────────────────────────────
export const startTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findOne({ _id: testId, createdBy: req.id }).populate("questions");
        if (!test) return res.status(404).json({ message: "Test not found", success: false });
        if (test.status === "active") return res.status(400).json({ message: "Test already active", success: false });

        test.status = "active";
        test.scheduledAt = new Date();
        await test.save();

        // Notify all applicants for this job
        const applications = await Application.find({ job: test.job }).populate("applicant", "fullname email");
        const invitePromises = applications.map((app) =>
            sendTestInviteEmail(app.applicant.email, app.applicant.fullname, {
                testTitle: test.title,
                jobTitle: test.job,
                duration: test.durationMinutes,
                minimumScore: test.minimumScore,
                testId: test._id,
            }).catch(() => { })
        );
        await Promise.allSettled(invitePromises);

        return res.status(200).json({
            message: `Test started. ${applications.length} candidates notified.`,
            success: true,
            test,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get test for candidate (without answers) ─────────────────────────────────
export const getTestForCandidate = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId)
            .populate("questions", "-correctIndex -explanation") // hide answers
            .populate("job", "title");

        if (!test) return res.status(404).json({ message: "Test not found", success: false });

        const now = new Date();
        let canTake = false;
        if (test.status === "active") {
            canTake = true;
        } else if (test.status === "scheduled" && test.scheduledAt) {
            const schedTime = new Date(test.scheduledAt);
            const endTime = new Date(schedTime.getTime() + (test.durationMinutes || 30) * 60 * 1000);
            if (now >= schedTime && now <= endTime) {
                canTake = true;
            } else if (now < schedTime) {
                return res.status(400).json({ message: `Test has not started yet. It is scheduled for ${schedTime.toLocaleString("en-IN")}`, success: false });
            } else {
                return res.status(400).json({ message: "Test window has closed", success: false });
            }
        }

        if (!canTake) {
            return res.status(400).json({ message: "Test is not active or available at this time", success: false });
        }

        // Check if already submitted
        const existing = await TestSubmission.findOne({ test: testId, candidate: req.id });
        if (existing) return res.status(400).json({ message: "You have already submitted this test", success: false });

        return res.status(200).json({ success: true, test });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Submit test answers ──────────────────────────────────────────────────────
export const submitTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { answers, timeTakenSeconds } = req.body;

        const test = await Test.findById(testId).populate("questions");
        if (!test) return res.status(404).json({ message: "Test not found", success: false });

        const now = new Date();
        let canSubmit = false;
        if (test.status === "active") {
            canSubmit = true;
        } else if (test.status === "scheduled" && test.scheduledAt) {
            const schedTime = new Date(test.scheduledAt);
            const endTime = new Date(schedTime.getTime() + ((test.durationMinutes || 30) + 5) * 60 * 1000); // 5 mins grace
            if (now >= schedTime && now <= endTime) {
                canSubmit = true;
            }
        }

        if (!canSubmit) {
            return res.status(400).json({ message: "Test window has closed or test is not active", success: false });
        }

        const existing = await TestSubmission.findOne({ test: testId, candidate: req.id });
        if (existing) return res.status(400).json({ message: "Already submitted", success: false });

        // Grade the test
        let correctCount = 0;
        test.questions.forEach((q, i) => {
            if (answers[i] === q.correctIndex) correctCount++;
        });

        const score = Math.round((correctCount / test.questions.length) * 100);
        const qualified = score >= test.minimumScore;

        const submission = await TestSubmission.create({
            test: testId,
            candidate: req.id,
            answers,
            score,
            correctCount,
            totalQuestions: test.questions.length,
            qualified,
            timeTakenSeconds: timeTakenSeconds || 0,
        });

        // Calculate rankings after a short delay (async)
        updateRankings(testId).catch(() => { });

        // Send result email ONLY if qualified (interview invite)
        if (qualified) {
            const user = await User.findById(req.id).select("fullname email");
            if (user) {
                // Auto-accept the application and send interview invite
                const application = await Application.findOne({ job: test.job, applicant: req.id })
                    .populate({ path: "job", select: "title", populate: { path: "company", select: "name" } });

                if (application && application.status === "pending") {
                    application.status = "accepted";
                    await application.save();
                }

                // Send interview invite email
                sendApplicationAcceptedEmail(
                    user.email,
                    user.fullname,
                    application?.job?.title || test.title,
                    application?.job?.company?.name || "the company"
                ).catch(() => { });
            }
        }

        return res.status(200).json({
            success: true,
            message: qualified ? "Congratulations! You qualified!" : "Test submitted. You did not meet the minimum score.",
            score,
            correctCount,
            totalQuestions: test.questions.length,
            qualified,
            minimumScore: test.minimumScore,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get test results / leaderboard ──────────────────────────────────────────
export const getTestResults = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId).populate("job", "title");
        if (!test) return res.status(404).json({ message: "Test not found", success: false });

        const submissions = await TestSubmission.find({ test: testId })
            .populate("candidate", "fullname email profile.profilePhoto")
            .sort({ score: -1, timeTakenSeconds: 1 });

        return res.status(200).json({ success: true, test, submissions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get tests for a job ──────────────────────────────────────────────────────
export const getTestsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const tests = await Test.find({ job: jobId }).select("-questions");
        return res.status(200).json({ success: true, tests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Get active tests for candidate's applied jobs ────────────────────────────
export const getActiveTestsForCandidate = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.id }).select("job");
        const jobIds = applications.map((a) => a.job);
        const tests = await Test.find({
            job: { $in: jobIds },
            status: { $in: ["active", "scheduled"] },
        }).select("title job durationMinutes minimumScore scheduledAt status").populate("job", "title company");
        return res.status(200).json({ success: true, tests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};
export const getMySubmission = async (req, res) => {
    try {
        const { testId } = req.params;
        const submission = await TestSubmission.findOne({ test: testId, candidate: req.id })
            .populate({ path: "test", populate: { path: "questions" } });
        if (!submission) return res.status(404).json({ message: "No submission found", success: false });
        return res.status(200).json({ success: true, submission });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

// ─── Helper: update rankings ──────────────────────────────────────────────────
const updateRankings = async (testId) => {
    const submissions = await TestSubmission.find({ test: testId })
        .sort({ score: -1, timeTakenSeconds: 1 });
    for (let i = 0; i < submissions.length; i++) {
        submissions[i].rank = i + 1;
        await submissions[i].save();
    }
};
