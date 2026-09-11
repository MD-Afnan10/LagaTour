import { io } from "socket.io-client";

// Connect to backend server (matches VITE_SOCKET_URL or fallback to http://localhost:5000)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000");

let socket = null;

export const socketService = {
  // Initializes and connects the WebSocket connection
  connect(user) {
    const uId = user?.id || user?.user_id;
    if (socket && socket.connected) {
      if (uId) socket.emit("register_user", { userId: uId });
      return socket;
    }

    try {
      socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"],
        query: {
          userId: uId || "",
          username: user?.username || user?.name || ""
        }
      });

      socket.on("connect", () => {
        console.log("🟢 Connected to LagaTour Realtime Chat Socket:", socket.id);
        if (uId) socket.emit("register_user", { userId: uId });
      });

      socket.on("disconnect", (reason) => {
        console.log("🔴 Disconnected from Chat Socket:", reason);
      });

      socket.on("connect_error", (err) => {
        console.warn("⚠️ Chat Socket connection warning (Backend might still be starting):", err.message);
      });

      return socket;
    } catch (err) {
      console.warn("Socket initialization skipped:", err.message);
      return null;
    }
  },

  // Get raw socket instance

  getSocket() {
    return socket;
  },

  // Disconnect socket cleanly

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Join a specific conversation room
   
  joinChat(conversationId, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("join_chat", { conversationId, userId });
  },

  // Leave a specific conversation room
   
  leaveChat(conversationId, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("leave_chat", { conversationId, userId });
  },

  // Broadcast message via Socket.io
   
  sendMessage(messagePayload) {
    if (!socket || !socket.connected) return false;
    socket.emit("send_message", messagePayload);
    return true;
  },

  //  Send typing status indicator
   
  sendTyping(conversationId, user, isTyping) {
    if (!socket || !socket.connected) return;
    socket.emit("typing", {
      conversationId,
      userId: user?.id || user?.user_id,
      username: user?.name || user?.username || "Traveler",
      isTyping
    });
  },

  // Send mark as read event via Socket.io
  markAsRead(conversationId, user) {
    if (!socket || !socket.connected) return;
    socket.emit("mark_read", {
      conversationId,
      userId: user?.id || user?.user_id,
      readerName: user?.name || user?.username || "Traveler",
      readerAvatar: user?.avatar || user?.profilePictureUrl
    });
  },

  // Edit message event via Socket.io
  editMessage(conversationId, messageId, text, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("edit_message", {
      conversationId,
      messageId,
      text,
      userId
    });
  },

  // Delete message event via Socket.io
  deleteMessage(conversationId, messageId, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("delete_message", {
      conversationId,
      messageId,
      userId
    });
  },

  // Listen for incoming real-time messages
  onReceiveMessage(callback) {
    if (!socket) return () => {};
    const handler = (msg) => callback(msg);
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  },

  // Listen for real-time message edited events
  onMessageEdited(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("message_edited", handler);
    return () => socket.off("message_edited", handler);
  },

  // Listen for real-time messages read receipts
  onMessagesRead(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("messages_read", handler);
    return () => socket.off("messages_read", handler);
  },

  // Listen for real-time message deleted events
  onMessageDeleted(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("message_deleted", handler);
    return () => socket.off("message_deleted", handler);
  },

  // Listen for live typing indicators
  onTyping(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("typing", handler);
    return () => socket.off("typing", handler);
  },

  // Listen for user online / offline status updates
  onUserStatus(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("user_status", handler);
    return () => socket.off("user_status", handler);
  }
};

export default socketService;
