import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    durationMinutes: { type: Number, default: 30 },
    minimumScore: { type: Number, default: 60 }, // percentage to qualify
    scheduledAt: { type: Date },
    status: {
        type: String,
        enum: ["draft", "scheduled", "active", "completed"],
        default: "draft",
    },
    topics: [{ type: String }], // for auto-select from question bank
    autoSelectCount: { type: Number, default: 0 }, // 0 = manual questions only
}, { timestamps: true });

export const Test = mongoose.model("Test", testSchema);
