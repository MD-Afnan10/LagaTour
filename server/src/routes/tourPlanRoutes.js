import express from "express";
import {
  getAllTourPlans,
  getTourPlanById,
  createTourPlan,
  updateTourPlan,
  deleteTourPlan,
  startTourPlan,
  endTourPlan,
  restartTourPlan,
  checkInStop,
  skipStop,
  addSpontaneousStop,
  addTourExpense,
  deleteTourExpense,
  toggleLikeTourPlan,
  toggleSaveTourPlan,
  rateTourPlan,
  addTourPlanComment
} from "../controllers/tourPlanController.js";

const router = express.Router();

// Main Tour Plan CRUD & Discovery
router.get("/", getAllTourPlans);
router.get("/:id", getTourPlanById);
router.post("/", createTourPlan);
router.put("/:id", updateTourPlan);
router.delete("/:id", deleteTourPlan);

// Lifecycle Status Transitions
router.patch("/:id/start", startTourPlan);
router.patch("/:id/end", endTourPlan);
router.patch("/:id/restart", restartTourPlan);

// Stop Check-ins & Live Tracking
router.post("/:id/stops/checkin", checkInStop);
router.patch("/:id/stops/:stopId/skip", skipStop);
router.post("/:id/stops/spontaneous", addSpontaneousStop);

// Expenses
router.post("/:id/expenses", addTourExpense);
router.delete("/:id/expenses/:expenseId", deleteTourExpense);

// Interactions (Like, Save, Rate, Comment)
router.post("/:id/like", toggleLikeTourPlan);
router.post("/:id/save", toggleSaveTourPlan);
router.post("/:id/rate", rateTourPlan);
router.post("/:id/comment", addTourPlanComment);

export default router;
