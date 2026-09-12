import express from "express";
import {
  getAllGroups,
  getGroupDetails,
  createGroup,
  requestToJoinGroup,
  withdrawJoinRequest,
  updateMemberStatus,
  addChecklistTask,
  toggleChecklistTask,
  deleteChecklistTask,
  addExpense,
  deleteExpense,
  deleteGroup,
  createItinerarySuggestion,
  respondToItinerarySuggestion,
  deleteItinerarySuggestion
} from "../controllers/groupController.js";

const router = express.Router();

// ── Groups / Expeditions Discovery & Management ──────────────────────────────
router.get("/", getAllGroups);                          // GET /api/groups
router.get("/:id", getGroupDetails);                    // GET /api/groups/:id
router.post("/", createGroup);                          // POST /api/groups
router.delete("/:id", deleteGroup);                     // DELETE /api/groups/:id

// ── Members & Join Requests ──────────────────────────────────────────────────
router.post("/:id/join", requestToJoinGroup);           // POST /api/groups/:id/join
router.delete("/:id/join", withdrawJoinRequest);         // DELETE /api/groups/:id/join (Withdraw request)
router.patch("/:id/members/:targetUserId", updateMemberStatus); // PATCH /api/groups/:id/members/:userId

// ── Collaborative Checklist ──────────────────────────────────────────────────
router.post("/:id/checklist", addChecklistTask);        // POST /api/groups/:id/checklist
router.patch("/:id/checklist/:taskId", toggleChecklistTask); // PATCH /api/groups/:id/checklist/:taskId
router.delete("/:id/checklist/:taskId", deleteChecklistTask); // DELETE /api/groups/:id/checklist/:taskId

// ── Shared Budget & Expense Tracker ──────────────────────────────────────────
router.post("/:id/expenses", addExpense);               // POST /api/groups/:id/expenses
router.delete("/:id/expenses/:expenseId", deleteExpense); // DELETE /api/groups/:id/expenses/:expenseId

// ── Itinerary Suggestions & Appeals ──────────────────────────────────────────
router.post("/:id/itinerary-suggestions", createItinerarySuggestion); // POST /api/groups/:id/itinerary-suggestions
router.patch("/:id/itinerary-suggestions/:suggestionId", respondToItinerarySuggestion); // PATCH /api/groups/:id/itinerary-suggestions/:suggestionId
router.delete("/:id/itinerary-suggestions/:suggestionId", deleteItinerarySuggestion); // DELETE /api/groups/:id/itinerary-suggestions/:suggestionId

export default router;
