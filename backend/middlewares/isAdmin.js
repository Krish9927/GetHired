import { User } from "../models/user.model.js";

// Simple admin check — users with role "recruiter" and a special admin flag
// For now we use a hardcoded admin email from env, or you can add an isAdmin field to User
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.id);
        if (!user) return res.status(401).json({ message: "Unauthorized", success: false });

        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
        if (!adminEmails.includes(user.email.toLowerCase())) {
            return res.status(403).json({ message: "Admin access required", success: false });
        }
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", success: false });
    }
};

export default isAdmin;
