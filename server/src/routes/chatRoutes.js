import express from "express";
import {
  getConversations,
  getMessages,
  getOrCreateDM,
  createGroupChat,
  sendMessage,
  searchChatUsers,
  markConversationAsRead,
  deleteMessage,
  editMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// ── Search travelers to start chats with ────────────────────────────────────
router.get("/users", searchChatUsers);

// ── Conversation Management ──────────────────────────────────────────────────
router.get("/", getConversations);                          // GET /api/chats?userId=X
router.post("/direct", getOrCreateDM);                      // POST /api/chats/direct
router.post("/group", createGroupChat);                     // POST /api/chats/group
router.post("/:conversationId/read", markConversationAsRead); // POST /api/chats/:id/read

// ── Message Stream ──────────────────────────────────────────────────────────
router.get("/:conversationId/messages", getMessages);       // GET /api/chats/:id/messages?userId=X
router.post("/:conversationId/messages", sendMessage);      // POST /api/chats/:id/messages
router.patch("/:conversationId/messages/:messageId", editMessage); // PATCH /api/chats/:id/messages/:msgId
router.put("/:conversationId/messages/:messageId", editMessage);   // PUT /api/chats/:id/messages/:msgId
router.delete("/:conversationId/messages/:messageId", deleteMessage); // DELETE /api/chats/:id/messages/:msgId

export default router;
