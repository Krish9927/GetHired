import express from "express";
import {
    getRemoteJobs,
    getNonRemoteJobs,
    searchAllExternal,
} from "../controllers/externalJobs.controller.js";

const router = express.Router();

router.get("/remote", getRemoteJobs);
router.get("/non-remote", getNonRemoteJobs);
router.get("/search", searchAllExternal);

export default router;
