import express from "express";
import optionalAuth from "../middlewares/optionalAuth.js";
import { getChatWelcome, sendChatMessage } from "../controllers/chat.controller.js";

const router = express.Router();

router.route("/welcome").get(optionalAuth, getChatWelcome);
router.route("/message").post(optionalAuth, sendChatMessage);

export default router;
