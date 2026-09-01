import { Server } from "socket.io";

let io = null;

/**
 * Initializes the Socket.io WebSocket server
 * @param {import('http').Server} httpServer - Node.js HTTP Server instance
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // allow frontend Vite dev server & production client
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const queryUserId = socket.handshake.query?.userId;
    if (queryUserId) {
      socket.join(`user_${queryUserId}`);
      console.log(`🔌 [Socket.io] Client connected: ${socket.id} (user_${queryUserId})`);
    } else {
      console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);
    }

    // Register user private socket room
    socket.on("register_user", ({ userId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 Socket ${socket.id} registered to user room: user_${userId}`);
      }
    });

    // Join a specific conversation room
    socket.on("join_chat", ({ conversationId, userId, username }) => {
      if (!conversationId) return;
      socket.join(conversationId);
      if (userId) socket.join(`user_${userId}`);
      console.log(`👤 User ${username || userId || socket.id} joined room: ${conversationId}`);

      // Notify other members in the room that user is online in this chat
      socket.to(conversationId).emit("user_joined_chat", {
        conversationId,
        userId,
        username
      });
    });

    // Leave a specific conversation room
    socket.on("leave_chat", ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.leave(conversationId);
      console.log(`🚪 User ${userId || socket.id} left room: ${conversationId}`);

      socket.to(conversationId).emit("user_left_chat", {
        conversationId,
        userId
      });
    });

    // Typing indicators
    socket.on("typing", ({ conversationId, userId, username }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("user_typing", {
        conversationId,
        userId,
        username
      });
    });

    socket.on("stop_typing", ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("user_stop_typing", {
        conversationId,
        userId
      });
    });

    // Direct WebSocket message broadcast (if client sends via socket)
    socket.on("send_message", (messageData) => {
      const { conversationId } = messageData || {};
      if (!conversationId) return;

      // Broadcast to everyone in the room (including sender or excluding based on UI handling)
      io.to(conversationId).emit("receive_message", messageData);
    });

    socket.on("disconnect", () => {
      console.log(`❌ [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Returns the active Socket.io instance
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
}

/**
 * Helper to broadcast an event to all participants in a conversation room
 */
export function emitToConversation(conversationId, event, data) {
  if (io && conversationId) {
    io.to(conversationId).emit(event, data);
  }
}

export default {
  initSocket,
  getIO,
  emitToConversation
};
