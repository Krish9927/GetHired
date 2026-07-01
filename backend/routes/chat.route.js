import express from "express";
import jwt from "jsonwebtoken";
import { getWelcome, sendMessage } from "../controllers/chat.controller.js";

const router = express.Router();

/**
 * Optional auth — attaches req.id if a valid token exists, but does NOT
 * reject unauthenticated requests. This lets the chatbot work for guests
 * while still personalising responses for logged-in users.
 */
const optionalAuth = (req, _res, next) => {
    try {
        const token = req.cookies?.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            if (decoded?.userId) req.id = decoded.userId;
        }
    } catch {
        // token invalid / expired — treat as guest
    }
    next();
};

router.get("/welcome", optionalAuth, getWelcome);
router.post("/message", optionalAuth, sendMessage);

export default router;
