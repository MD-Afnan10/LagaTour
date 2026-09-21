import express from "express";
import {
  getAdminOverview,
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  deleteUser,
  warnUser,
  getAdminPosts,
  createAdminPost,
  updateAdminPost,
  togglePostVisibility,
  updateMediaVerification,
  deletePostByAdmin,
  getAdminTourPlans,
  deleteTourPlanByAdmin,
  getAdminPlaces,
  createAdminPlace,
  updateAdminPlace,
  deleteAdminPlace,
  createReport,
  getAdminReports,
  dismissAdminReport,
  resolveAdminReport,
  requestAdminSupport,
  getAdminSupportRequests,
  acceptAdminSupportRequest,
  resolveAdminSupportRequest,
  createAnnouncement,
  getActiveAnnouncements
} from "../controllers/adminController.js";

const router = express.Router();

// 1. System Overview Metrics
router.get("/overview", getAdminOverview);

// 2. User Management
router.get("/users", getAllUsers);
router.post("/users", createAdminUser);
router.put("/users/:id", updateAdminUser);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/warn", warnUser);

// 3. Post & Media Moderation
router.get("/posts", getAdminPosts);
router.post("/posts", createAdminPost);
router.put("/posts/:id", updateAdminPost);
router.patch("/posts/:id/visibility", togglePostVisibility);
router.patch("/posts/:postId/media/:mediaId/verify", updateMediaVerification);
router.delete("/posts/:id", deletePostByAdmin);

// 4. Tour Plans Auditing
router.get("/tour-plans", getAdminTourPlans);
router.delete("/tour-plans/:id", deleteTourPlanByAdmin);

// 5. Places Management
router.get("/places", getAdminPlaces);
router.post("/places", createAdminPlace);
router.put("/places/:id", updateAdminPlace);
router.delete("/places/:id", deleteAdminPlace);

// 6. Reports Moderation
router.get("/reports", getAdminReports);
router.post("/reports", createReport);
router.delete("/reports/:id", dismissAdminReport);
router.put("/reports/:id/dismiss", dismissAdminReport);
router.post("/reports/:id/resolve", resolveAdminReport);
router.put("/reports/:id/resolve", resolveAdminReport);

// 7. System Broadcasts
router.get("/announcements", getActiveAnnouncements);
router.post("/announcements", createAnnouncement);

// 8. Admin Support Chat Portal
router.get("/support/requests", getAdminSupportRequests);
router.post("/support/request", requestAdminSupport);
router.post("/support/:requestId/accept", acceptAdminSupportRequest);
router.post("/support/:requestId/resolve", resolveAdminSupportRequest);

export default router;

