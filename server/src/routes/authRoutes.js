import express from "express";
import {
  sendVerificationCode,
  verifyCode,
  signup,
  login,
  forgotPassword,
  updateProfile,
  getUserProfile
} from "../controllers/authController.js";

const router = express.Router();

// Email OTP Verification
router.post("/send-code", sendVerificationCode);
router.post("/verify-code", verifyCode);

// Authentication
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// Profile
router.put("/profile", updateProfile);
router.get("/profile/:userId", getUserProfile);

export default router;
