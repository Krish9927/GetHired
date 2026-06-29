import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }], // 4 options
    correctIndex: { type: Number, required: true }, // 0-3
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    topic: { type: String, required: true }, // e.g. "JavaScript", "DSA", "React"
    explanation: { type: String, default: "" },
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);
