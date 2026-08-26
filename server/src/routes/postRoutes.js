import express from "express";
import {
  getAllPosts,
  getUserPosts,
  getSavedPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  toggleSave,
  sharePost,
  reportPost,
  getReports,
  updatePostVisibility,
  dismissReport
} from "../controllers/postController.js";

const router = express.Router();

// Post Feed & Management Routes
router.get("/posts", getAllPosts);
router.get("/posts/user/:userId", getUserPosts);
router.get("/posts/saved/:userId", getSavedPosts);
router.post("/posts", createPost);
router.put("/posts/:id", updatePost);
router.delete("/posts/:id", deletePost);
router.patch("/posts/:id/visibility", updatePostVisibility);

// Post Interaction Routes
router.post("/posts/:id/like", toggleLike);
router.post("/posts/:id/comment", addComment);
router.post("/posts/:id/save", toggleSave);
router.post("/posts/:id/share", sharePost);
router.post("/posts/:id/report", reportPost);

// Report Moderation Routes
router.get("/reports", getReports);
router.delete("/reports/:id", dismissReport);

export default router;
