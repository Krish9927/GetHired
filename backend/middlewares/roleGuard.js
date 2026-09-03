import { BaseUser } from "../models/baseUser.model.js";

/**
 * Resolves the user from the DB and attaches it to req.user.
 * Must be used AFTER isAuthenticated (which sets req.id).
 */
const resolveUser = async (req, res, next) => {
    if (req.user) return next(); // already resolved
    try {
        const user = await BaseUser.findById(req.id).lean();
        if (!user) return res.status(401).json({ message: "Unauthorized", success: false });
        req.user = user;
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

export const isStudent = [
    resolveUser,
    (req, res, next) => {
        if (req.user?.role !== "student") {
            return res.status(403).json({ message: "Student access required", success: false });
        }
        next();
    },
];

export const isRecruiter = [
    resolveUser,
    (req, res, next) => {
        if (req.user?.role !== "recruiter") {
            return res.status(403).json({ message: "Recruiter access required", success: false });
        }
        next();
    },
];
