import express from "express";
import { getWelcome, sendMessage } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/welcome", getWelcome);
router.post("/message", sendMessage);

export default router;
