import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { buildStudentContext, getWelcomeMessage } from "../utils/studentChatbot.js";
import { generateAIReply, isAIEnabled } from "../utils/aiChatbot.js";

const loadStudentContext = async (userId) => {
    if (!userId) return buildStudentContext(null);

    const user = await User.findById(userId).select(
        "fullname email role isEmailVerified isCollegeEmail isVerified atsScore trustScore profileCompleteness profile.cgpa profile.cgpaProof profile.githubUrl profile.linkedinUrl profile.resume profile.skills profile.bio profile.college"
    );

    if (!user || user.role !== "student") {
        return buildStudentContext(null);
    }

    const applications = await Application.find({ applicant: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
            path: "job",
            select: "title",
            populate: { path: "company", select: "name" },
        });

    return buildStudentContext(user, applications);
};

export const getChatWelcome = async (req, res) => {
    try {
        const context = await loadStudentContext(req.id);
        const welcome = getWelcomeMessage(context);

        if (isAIEnabled()) {
            welcome.reply = welcome.reply.replace(
                "I can see your profile",
                "I'm powered by AI and can see your profile"
            );
            if (!context.isLoggedIn) {
                welcome.reply =
                    "Welcome to GetHired! I'm your AI assistant — ask me about verification, resumes, job applications, and career tips. Log in for personalized guidance based on your profile.";
            }
        }

        return res.status(200).json({
            success: true,
            ...welcome,
            isPersonalized: context.isLoggedIn,
            isAI: isAIEnabled(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

export const sendChatMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ message: "Message is required", success: false });
        }

        const context = await loadStudentContext(req.id);
        const { reply, suggestions, usedAI } = await generateAIReply(
            message.trim(),
            context,
            history || []
        );

        return res.status(200).json({
            success: true,
            reply,
            suggestions,
            isPersonalized: context.isLoggedIn,
            isAI: usedAI,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};
