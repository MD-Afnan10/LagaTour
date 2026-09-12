import express from "express";
import {
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getConnectedTravelers
} from "../controllers/userController.js";

const router = express.Router();

// Follow / Unfollow Toggle
router.post("/:targetId/follow", toggleFollow);

// Follow status check
router.get("/:targetId/follow-status", getFollowStatus);

// Followers & Following Lists
router.get("/:targetId/followers", getFollowers);
router.get("/:targetId/following", getFollowing);

// Connected Travelers (for companions and discovery)
router.get("/:userId/connected-travelers", getConnectedTravelers);

export default router;
