import express from "express";
import {
  getRankingsOverview,
  getRankedTravelers,
  getRankedGuides,
  getRankedPlans,
  getRankedPlaces,
} from "../controllers/rankingController.js";

const router = express.Router();

// ── Rankings Overview (Top 3 in all categories + platform stats) ─────────────
router.get("/overview", getRankingsOverview);

// ── Category Specific Leaderboards ───────────────────────────────────────────
router.get("/travelers", getRankedTravelers);
router.get("/guides", getRankedGuides);
router.get("/plans", getRankedPlans);
router.get("/places", getRankedPlaces);

export default router;
