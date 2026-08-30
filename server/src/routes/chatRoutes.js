import express from "express";
import {
  getConversations,
  getMessages,
  getOrCreateDM,
  createGroupChat,
  sendMessage,
  searchChatUsers,
} from "../controllers/chatController.js";

const router = express.Router();

// ── Search travelers to start chats with ────────────────────────────────────
router.get("/users", searchChatUsers);

// ── Conversation Management ──────────────────────────────────────────────────
router.get("/", getConversations);            // GET /api/chats?userId=X
router.post("/direct", getOrCreateDM);        // POST /api/chats/direct
router.post("/group", createGroupChat);       // POST /api/chats/group

// ── Message Stream ──────────────────────────────────────────────────────────
router.get("/:conversationId/messages", getMessages);     // GET /api/chats/:id/messages?userId=X
router.post("/:conversationId/messages", sendMessage);    // POST /api/chats/:id/messages

export default router;
