import mongoose from "mongoose";

const testSubmissionSchema = new mongoose.Schema({
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: Number }], // selected option index per question (-1 = skipped)
    score: { type: Number, default: 0 }, // percentage 0-100
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    qualified: { type: Boolean, default: false },
    rank: { type: Number },
    submittedAt: { type: Date, default: Date.now },
    timeTakenSeconds: { type: Number, default: 0 },
}, { timestamps: true });

export const TestSubmission = mongoose.model("TestSubmission", testSubmissionSchema);
