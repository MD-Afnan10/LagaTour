import { io } from "socket.io-client";

// Connect to backend server (matches VITE_SOCKET_URL or fallback to http://localhost:5000)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") : "http://localhost:5000");

let socket = null;

export const socketService = {
  /**
   * Initializes and connects the WebSocket connection
   */
  connect(user) {
    if (socket && socket.connected) return socket;

    try {
      socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"],
        query: {
          userId: user?.id || user?.user_id || "",
          username: user?.username || user?.name || ""
        }
      });

      socket.on("connect", () => {
        console.log("🟢 Connected to LagaTour Realtime Chat Socket:", socket.id);
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

  /**
   * Get raw socket instance
   */
  getSocket() {
    return socket;
  },

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Join a specific conversation room
   */
  joinChat(conversationId, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("join_chat", { conversationId, userId });
  },

  /**
   * Leave a specific conversation room
   */
  leaveChat(conversationId, userId) {
    if (!socket || !socket.connected) return;
    socket.emit("leave_chat", { conversationId, userId });
  },

  /**
   * Broadcast message via Socket.io
   */
  sendMessage(messagePayload) {
    if (!socket || !socket.connected) return false;
    socket.emit("send_message", messagePayload);
    return true;
  },

  /**
   * Send typing status indicator
   */
  sendTyping(conversationId, user, isTyping) {
    if (!socket || !socket.connected) return;
    socket.emit("typing", {
      conversationId,
      userId: user?.id || user?.user_id,
      username: user?.name || user?.username || "Traveler",
      isTyping
    });
  },

  /**
   * Listen for incoming real-time messages
   */
  onReceiveMessage(callback) {
    if (!socket) return () => {};
    const handler = (msg) => callback(msg);
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  },

  /**
   * Listen for live typing indicators
   */
  onTyping(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("typing", handler);
    return () => socket.off("typing", handler);
  },

  /**
   * Listen for user online / offline status updates
   */
  onUserStatus(callback) {
    if (!socket) return () => {};
    const handler = (data) => callback(data);
    socket.on("user_status", handler);
    return () => socket.off("user_status", handler);
  }
};

export default socketService;
