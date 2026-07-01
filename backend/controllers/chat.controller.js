import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { generateAIReply } from "../utils/aiChatbot.js";
import { buildStudentContext, getWelcomeMessage } from "../utils/studentChatbot.js";

/**
 * Build context object from the authenticated user (if any).
 */
const getUserContext = async (userId) => {
    if (!userId) return { isLoggedIn: false };

    try {
        const user = await User.findById(userId);
        if (!user) return { isLoggedIn: false };

        const applications = await Application.find({ applicant: userId })
            .populate({
                path: "job",
                populate: { path: "company", select: "name" },
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return buildStudentContext(user, applications);
    } catch (err) {
        console.error("Chat context error:", err.message);
        return { isLoggedIn: false };
    }
};

export const getWelcome = async (req, res) => {
    try {
        const context = await getUserContext(req.id);
        const { reply, suggestions } = getWelcomeMessage(context);

        res.json({ success: true, reply, suggestions, isAI: false });
    } catch (error) {
        console.error("Welcome error:", error.message);
        res.json({
            success: true,
            reply: "Hi! I'm the GetHired assistant 👋 I can help you with email verification, resume tips, job applications, trust scores, and more. What do you need help with?",
            suggestions: ["How to verify email?", "What is trust score?", "How to apply for jobs?"],
            isAI: false,
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: "Message required" });
        }

        const context = await getUserContext(req.id);
        const { reply, suggestions, usedAI } = await generateAIReply(message, context, history || []);

        res.json({ success: true, reply, suggestions, isAI: !!usedAI });
    } catch (error) {
        console.error("Chat message error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again.",
        });
    }
};
