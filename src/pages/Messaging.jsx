import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socketService from "../services/socketService";
import api from "../services/api";
import { 
  Send, 
  Search, 
  MessageSquare, 
  Users, 
  UserPlus, 
  Phone, 
  Video, 
  Info, 
  User, 
  Plus, 
  Image as ImageIcon, 
  Check,
  CheckCheck, 
  Clock, 
  Trash2, 
  AlertCircle, 
  X, 
  Compass, 
  MoreVertical, 
  Pencil, 
  Copy,
  Download,
  Loader2,
  Shield,
  Headphones
} from "lucide-react";

/**
 * Smart Client-Side Image Compression to Base64 (Data URL)
 * Automatically resizes & compresses heavy 5-10MB mobile/camera photos into light ~60-120KB Base64 strings.
 */
function compressImageToBase64(file, maxWidth = 1000, maxHeight = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image."));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const base64Data = canvas.toDataURL(mimeType, quality);
        resolve(base64Data);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format timestamp accurately for sidebar conversation list
 * - Today: "05:05 pm"
 * - Yesterday: "Yesterday"
 * - Older in current year: "Sep 10"
 * - Older in previous year: "Sep 10, 2025"
 */
function formatChatTimestamp(timestamp) {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return timestamp;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  
  // Today -> 12-hour time, e.g. "01:52 pm"
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  }

  // Older in current year -> "Sep 10"
  const isThisYear = now.getFullYear() === date.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Older year -> "Sep 10, 2025"
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format bubble message timestamp
 * - Today: "05:05 pm"
 * - Yesterday: "Yesterday, 05:05 pm"
 * - Older in current year: "Sep 10, 05:05 pm"
 * - Older in previous year: "Sep 10, 2025, 05:05 pm"
 */
function formatBubbleTime(timestamp) {
  if (!timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return timeStr;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }

  const isThisYear = now.getFullYear() === date.getFullYear();
  if (isThisYear) {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  }

  const fullDateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fullDateStr}, ${timeStr}`;
}

/**
 * Helper to get date header separator for messages list
 */
function getDateDividerLabel(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  if (now.toDateString() === date.toDateString()) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  }

  const isThisYear = now.getFullYear() === date.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Helper to deduplicate conversations list
 */
function deduplicateChats(chatList, currentUserId) {
  if (!Array.isArray(chatList)) return [];

  const seenIds = new Set();
  const seenDirectUsers = new Set();
  const result = [];

  for (const chat of chatList) {
    if (!chat || !chat.id) continue;
    
    // Normalize ID
    const chatId = chat.id || chat.conversationId || chat.conversation_id;
    if (seenIds.has(chatId)) continue;

    // For 1-on-1 direct chats, prevent multiple conversations with the exact same other person
    if (!chat.isGroup) {
      const otherUserId = chat.user?.id || chat.user?.user_id || chat.user?.username;
      if (otherUserId && otherUserId !== currentUserId) {
        if (seenDirectUsers.has(otherUserId)) continue;
        seenDirectUsers.add(otherUserId);
      }
    }

    seenIds.add(chatId);
    result.push(chat);
  }

  return result;
}

export default function Messaging() {
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?.user_id || "user_1";
  const storageKey = `ts_chats_${currentUserId}`;

  // Chats list state (User-scoped conversation list from DB/cache)
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem(`ts_chats_${currentUserId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return deduplicateChats(parsed, currentUserId);
      } catch (err) {
        console.error("Failed to parse saved chats", err);
      }
    }
    return [];
  });

  // All Platform Travelers state from MySQL database
  const [allTravelers, setAllTravelers] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => {
    return location.state?.activeChatId || chats[0]?.id || "";
  });

  const [messageText, setMessageText] = useState("");
  const [selectedImageBase64, setSelectedImageBase64] = useState(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [isRequestingAdmin, setIsRequestingAdmin] = useState(false);

  const handleChatWithAdmin = async () => {
    if (!currentUser) return;
    setIsRequestingAdmin(true);
    try {
      const res = await api.requestAdminSupport({
        userId: currentUserId,
        name: currentUser.name || currentUser.username,
        username: currentUser.username,
        avatar: currentUser.avatar,
        email: currentUser.email
      });

      if (res?.success && res.conversationId) {
        const targetConvId = res.conversationId;
        try {
          const freshChats = await api.fetchUserConversations(currentUserId);
          if (freshChats && freshChats.length > 0) {
            setChats(deduplicateChats(freshChats, currentUserId));
          }
        } catch (e) {}

        setActiveChatId(targetConvId);
      }
    } catch (err) {
      alert("Could not start admin support session: " + err.message);
    } finally {
      setIsRequestingAdmin(false);
    }
  };

  // 1. Initialize Socket.io connection on mount
  useEffect(() => {
    if (!currentUser) return;

    const socket = socketService.connect(currentUser);

    if (socket) {
      setIsConnected(socket.connected);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      // Listen for real-time messages
      const cleanupMsg = socketService.onReceiveMessage((incomingMsg) => {
        handleIncomingMessage(incomingMsg);
      });

      // Listen for message edit
      const cleanupEdit = socketService.onMessageEdited((editData) => {
        if (!editData?.conversationId || !editData?.messageId) return;
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === editData.conversationId) {
              const updatedMsgs = (c.messages || []).map((m) =>
                m.id === editData.messageId ? { ...m, text: editData.text, isEdited: true, updatedAt: editData.updatedAt } : m
              );
              const updatedLastMsg = c.lastMessage && c.lastMessage.id === editData.messageId
                ? { ...c.lastMessage, text: editData.text, isEdited: true }
                : c.lastMessage;
              return {
                ...c,
                messages: updatedMsgs,
                lastMessage: updatedLastMsg
              };
            }
            return c;
          })
        );
      });

      // Listen for read receipts (Seen by recipient)
      const cleanupRead = socketService.onMessagesRead((readData) => {
        if (!readData?.conversationId) return;
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === readData.conversationId) {
              const updatedMsgs = (c.messages || []).map((m) =>
                m.senderId === currentUserId ? { ...m, isRead: true } : m
              );
              return {
                ...c,
                messages: updatedMsgs,
                lastMessage: c.lastMessage && c.lastMessage.senderId === currentUserId ? { ...c.lastMessage, isRead: true } : c.lastMessage,
                lastReadBy: {
                  userId: readData.userId,
                  readerName: readData.readerName,
                  readerAvatar: readData.readerAvatar,
                  readAt: readData.readAt
                }
              };
            }
            return c;
          })
        );
      });

      // Listen for message deletion
      const cleanupDelete = socketService.onMessageDeleted((delData) => {
        if (!delData?.conversationId || !delData?.messageId) return;
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === delData.conversationId) {
              const updatedMsgs = (c.messages || []).map((m) =>
                m.id === delData.messageId ? { ...m, isDeleted: true, text: "This message was deleted", mediaUrl: null } : m
              );
              const updatedLastMsg = c.lastMessage && c.lastMessage.id === delData.messageId
                ? { ...c.lastMessage, isDeleted: true, text: "This message was deleted", mediaUrl: null }
                : c.lastMessage;
              return {
                ...c,
                messages: updatedMsgs,
                lastMessage: updatedLastMsg
              };
            }
            return c;
          })
        );
      });

      // Listen for typing events
      const cleanupTyping = socketService.onTyping(({ conversationId, username, userId, isTyping }) => {
        if (userId === currentUserId) return;
        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [conversationId]: username || "Someone" };
          } else {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          }
        });
      });

      // Listen for online status updates
      const cleanupStatus = socketService.onUserStatus(({ userId, status }) => {
        setOnlineUsers((prev) => ({ ...prev, [userId]: status === "online" }));
      });

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        cleanupMsg();
        cleanupEdit();
        cleanupRead();
        cleanupDelete();
        cleanupTyping();
        cleanupStatus();
      };
    }
  }, [currentUser, currentUserId]);

  // 2. Fetch All Registered Platform Travelers for Search and Discovery
  useEffect(() => {
    api.searchChatUsers(searchQuery, currentUserId)
      .then((users) => {
        if (Array.isArray(users)) {
          setAllTravelers(users);
        }
      })
      .catch((err) => {
        console.warn("searchChatUsers note:", err.message);
      });
  }, [searchQuery, currentUserId]);

  // 3. Handle targetUser navigation from UserProfile or external links
  useEffect(() => {
    if (location.state?.targetUser) {
      const target = location.state.targetUser;
      startOrOpenDirectChat(target);
    } else if (location.state?.activeChatId) {
      setActiveChatId(location.state.activeChatId);
    }
  }, [location.state]);

  // 4. Try fetching live chats from backend with fallback
  useEffect(() => {
    if (!currentUser) return;

    // Load cached conversations for this specific user
    const saved = localStorage.getItem(`ts_chats_${currentUserId}`);
    if (saved) {
      try {
        setChats(deduplicateChats(JSON.parse(saved), currentUserId));
      } catch (e) {
        console.error("Local chats parse error:", e);
      }
    }

    api.fetchUserConversations(currentUserId)
      .then((serverChats) => {
        if (serverChats && serverChats.length > 0) {
          setChats(deduplicateChats(serverChats, currentUserId));
          if (!activeChatId || activeChatId === "chat_default") {
            setActiveChatId(serverChats[0].id);
          }
        }
      })
      .catch(() => {
        console.log("Using cached/local chats (Backend offline or syncing)");
      });
  }, [currentUserId]);

  // 5. Join active conversation room on change and mark as read
  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    socketService.joinChat(activeChatId, currentUserId);

    // Mark as read in backend and broadcast to sender
    api.markConversationAsRead(activeChatId, currentUserId);
    socketService.markAsRead(activeChatId, currentUser);

    // Clear local unread count for this conversation
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c))
    );

    // Fetch fresh message history from backend
    api.fetchChatMessages(activeChatId, currentUserId)
      .then((msgs) => {
        if (msgs && msgs.length > 0) {
          setChats((prev) =>
            prev.map((c) => (c.id === activeChatId ? { ...c, messages: msgs, unreadCount: 0 } : c))
          );
        }
      })
      .catch(() => {});

    return () => {
      socketService.leaveChat(activeChatId, currentUserId);
    };
  }, [activeChatId, currentUser, currentUserId]);

  // 6. Sync chats state to user-scoped localStorage
  useEffect(() => {
    if (chats && chats.length > 0 && currentUserId) {
      localStorage.setItem(`ts_chats_${currentUserId}`, JSON.stringify(chats));
    }
  }, [chats, currentUserId]);

  // 7. Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  // Start or open direct chat with any platform traveler (Guaranteed No Duplicates)
  const startOrOpenDirectChat = async (targetUser) => {
    if (!targetUser) return;
    const targetId = targetUser.id || targetUser.user_id;
    const targetName = targetUser.name || [targetUser.first_name, targetUser.last_name].filter(Boolean).join(" ") || targetUser.username || "Traveler";
    const targetUsername = targetUser.username || (targetName || "traveler").toLowerCase().replace(/\s+/g, "_");
    const targetAvatar = targetUser.avatar || targetUser.profile_picture_url || targetUser.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(targetUsername || targetId)}`;

    // Check if conversation already exists in our list
    const existing = chats.find((c) => {
      if (c.isGroup) return false;
      const cUserId = c.user?.id || c.user?.user_id;
      const cUsername = c.user?.username?.toLowerCase();
      return (targetId && cUserId === targetId) || (cUsername && targetUsername && cUsername === targetUsername.toLowerCase());
    });

    if (existing) {
      setActiveChatId(existing.id);
      setSearchQuery("");
      return;
    }

    // Try starting conversation via Backend API first
    try {
      const serverConv = await api.getOrCreateDirectChat(currentUserId, targetId);
      if (serverConv && (serverConv.id || serverConv.conversationId)) {
        const finalId = serverConv.id || serverConv.conversationId;
        setChats((prev) => deduplicateChats([serverConv, ...prev], currentUserId));
        setActiveChatId(finalId);
        setSearchQuery("");
        return;
      }
    } catch (err) {
      console.warn("Backend chat create fallback:", err.message);
    }

    // Fallback: Create clean local direct chat
    const newChatId = `chat_direct_${targetId}`;
    const newDirectChat = {
      id: newChatId,
      conversationId: newChatId,
      isGroup: false,
      user: {
        id: targetId,
        user_id: targetId,
        name: targetName,
        username: targetUsername,
        avatar: targetAvatar
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    setChats((prev) => deduplicateChats([newDirectChat, ...prev], currentUserId));
    setActiveChatId(newChatId);
    setSearchQuery("");
  };

  // Incoming socket / REST message handler with strict deduplication
  const handleIncomingMessage = (incomingMsg) => {
    const targetConvId = incomingMsg.conversation_id || incomingMsg.conversationId || incomingMsg.chatId;
    if (!targetConvId) return;

    const msgId = incomingMsg.message_id || incomingMsg.id || `msg_${Date.now()}`;
    const msgSenderId = incomingMsg.sender_id || incomingMsg.senderId;
    const msgText = incomingMsg.message_text || incomingMsg.text || "";
    const msgMedia = incomingMsg.media_url || incomingMsg.mediaUrl;
    const msgCreatedAt = incomingMsg.created_at || incomingMsg.createdAt || new Date().toISOString();
    const isMsgDeleted = Boolean(incomingMsg.is_deleted || incomingMsg.isDeleted);
    const isMsgRead = Boolean(incomingMsg.is_read || incomingMsg.isRead || (targetConvId === activeChatId && msgSenderId !== currentUserId));

    const formattedMsg = {
      id: msgId,
      conversationId: targetConvId,
      senderId: msgSenderId,
      senderName: incomingMsg.sender_name || incomingMsg.senderName || "Traveler",
      senderAvatar: incomingMsg.sender_avatar || incomingMsg.senderAvatar || incomingMsg.avatar,
      text: isMsgDeleted ? "This message was deleted" : msgText,
      mediaUrl: isMsgDeleted ? null : msgMedia,
      isDeleted: isMsgDeleted,
      isRead: isMsgRead,
      createdAt: msgCreatedAt,
      time: formatBubbleTime(msgCreatedAt)
    };

    // If incoming message is for the currently open conversation, mark as read immediately
    if (targetConvId === activeChatId && msgSenderId !== currentUserId) {
      api.markConversationAsRead(targetConvId, currentUserId);
      socketService.markAsRead(targetConvId, currentUser);
    }

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.id === targetConvId);

      if (chatIndex !== -1) {
        const chat = prevChats[chatIndex];
        const currentMsgs = chat.messages || [];

        // 1. Check if this exact message ID is already in the chat
        const existingById = currentMsgs.some((m) => m.id === formattedMsg.id);
        if (existingById) return prevChats;

        let updatedMsgs = [...currentMsgs];
        // 2. If message is from ME, match and replace the temporary optimistic message
        if (msgSenderId === currentUserId) {
          const optimisticIndex = currentMsgs.findIndex(
            (m) => m.senderId === currentUserId && (m.isPending || m.id.startsWith("temp_")) && (m.text === formattedMsg.text || (!m.text && !formattedMsg.text) || (m.mediaUrl && formattedMsg.mediaUrl))
          );
          if (optimisticIndex !== -1) {
            updatedMsgs[optimisticIndex] = formattedMsg;
          } else {
            updatedMsgs.push(formattedMsg);
          }
        } else {
          updatedMsgs.push(formattedMsg);
        }

        const shouldIncrementUnread = targetConvId !== activeChatId && msgSenderId !== currentUserId;

        const updatedChat = {
          ...chat,
          updatedAt: msgCreatedAt,
          lastMessage: formattedMsg,
          unreadCount: shouldIncrementUnread ? (chat.unreadCount || 0) + 1 : 0,
          messages: updatedMsgs
        };

        // Move active conversation to top of list
        const remaining = prevChats.filter((_, idx) => idx !== chatIndex);
        return [updatedChat, ...remaining];
      } else {
        // 3. New conversation that is not yet in the active chats list
        api.fetchUserConversations(currentUserId)
          .then((serverChats) => {
            if (serverChats && serverChats.length > 0) {
              setChats(deduplicateChats(serverChats, currentUserId));
            }
          })
          .catch(() => {});

        const newIncomingChat = {
          id: targetConvId,
          conversationId: targetConvId,
          isGroup: false,
          user: {
            id: msgSenderId,
            user_id: msgSenderId,
            name: incomingMsg.sender_name || incomingMsg.senderName || "Traveler",
            username: (incomingMsg.sender_username || incomingMsg.senderName || "traveler").toLowerCase().replace(/\s+/g, "_"),
            avatar: incomingMsg.sender_avatar || incomingMsg.senderAvatar || incomingMsg.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msgSenderId}`
          },
          lastMessage: formattedMsg,
          unreadCount: targetConvId !== activeChatId ? 1 : 0,
          updatedAt: msgCreatedAt,
          createdAt: msgCreatedAt,
          messages: [formattedMsg]
        };

        return deduplicateChats([newIncomingChat, ...prevChats], currentUserId);
      }
    });
  };

  // Delete message handler (Real-time & DB)
  const handleDeleteMessage = async (messageId) => {
    if (!activeChatId || !messageId) return;

    // 1. Optimistic update in UI
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const updatedMsgs = (c.messages || []).map((m) =>
            m.id === messageId ? { ...m, isDeleted: true, text: "This message was deleted", mediaUrl: null } : m
          );
          const updatedLast = c.lastMessage && c.lastMessage.id === messageId
            ? { ...c.lastMessage, isDeleted: true, text: "This message was deleted", mediaUrl: null }
            : c.lastMessage;
          return { ...c, messages: updatedMsgs, lastMessage: updatedLast };
        }
        return c;
      })
    );

    setDeleteConfirmMsgId(null);

    // 2. Real-time Socket.io broadcast
    socketService.deleteMessage(activeChatId, messageId, currentUserId);

    // 3. MySQL Database Delete
    try {
      await api.deleteChatMessage(activeChatId, messageId, currentUserId);
    } catch (err) {
      console.warn("Delete message failed on backend:", err.message);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || (chats.length > 0 ? chats[0] : null);

  // Typing indicator trigger
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (activeChatId && currentUser) {
      socketService.sendTyping(activeChatId, currentUser, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(activeChatId, currentUser, false);
      }, 1500);
    }
  };

  // Edit message start & cancel handlers
  // Edit message start & cancel handlers
  const handleStartEdit = (msg) => {
    if (!msg || msg.isDeleted) return;
    setEditingMessage({ id: msg.id, text: msg.text });
    setMessageText(msg.text);
    setActiveMenuMsgId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  // Copy message text to clipboard
  const handleCopyMessageText = (msg) => {
    if (msg?.text && navigator.clipboard) {
      navigator.clipboard.writeText(msg.text);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
    setActiveMenuMsgId(null);
  };

  // Image file select handler (Device gallery / file manager -> Compressed Base64)
  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const compressedBase64 = await compressImageToBase64(file);
      setSelectedImageBase64(compressedBase64);
    } catch (err) {
      console.error("Image compression error:", err);
      alert("Failed to process image: " + err.message);
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Paste image handler (Ctrl + V)
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsCompressingImage(true);
          try {
            const compressedBase64 = await compressImageToBase64(file);
            setSelectedImageBase64(compressedBase64);
          } catch (err) {
            console.error("Pasted image compression error:", err);
          } finally {
            setIsCompressingImage(false);
          }
          break;
        }
      }
    }
  };

  // Save edited message handler (Real-time & DB)
  const handleSaveEdit = async (messageId, newText) => {
    if (!activeChatId || !messageId || !newText.trim()) return;
    const cleanText = newText.trim();
    const nowIso = new Date().toISOString();

    // 1. Optimistic update in UI
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const updatedMsgs = (c.messages || []).map((m) =>
            m.id === messageId ? { ...m, text: cleanText, isEdited: true, updatedAt: nowIso } : m
          );
          const updatedLast = c.lastMessage && c.lastMessage.id === messageId
            ? { ...c.lastMessage, text: cleanText, isEdited: true }
            : c.lastMessage;
          return { ...c, messages: updatedMsgs, lastMessage: updatedLast };
        }
        return c;
      })
    );

    setEditingMessage(null);
    setMessageText("");

    // 2. Real-time Socket.io broadcast
    socketService.editMessage(activeChatId, messageId, cleanText, currentUserId);

    // 3. MySQL Database Update
    try {
      await api.editChatMessage(activeChatId, messageId, cleanText, currentUserId);
    } catch (err) {
      console.warn("Edit message failed on backend:", err.message);
    }
  };

  // Send message handler (Single source of truth, Zero Duplication, Base64 Image Support)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (editingMessage) {
      if (!messageText.trim()) return;
      return handleSaveEdit(editingMessage.id, messageText);
    }

    if (!messageText.trim() && !selectedImageBase64) return;

    const textContent = messageText.trim();
    const mediaContent = selectedImageBase64 || undefined;
    const msgType = mediaContent ? "image" : "text";
    const nowIso = new Date().toISOString();
    const tempId = `temp_msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const optimisticMsg = {
      id: tempId,
      conversationId: activeChatId,
      senderId: currentUserId,
      senderName: currentUser?.name || currentUser?.username || "You",
      senderAvatar: currentUser?.avatar || currentUser?.profilePictureUrl,
      text: textContent,
      mediaUrl: mediaContent,
      type: msgType,
      createdAt: nowIso,
      time: formatBubbleTime(nowIso),
      isPending: true
    };

    // 1. Optimistically append message to local state
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            updatedAt: nowIso,
            lastMessage: optimisticMsg,
            messages: [...(c.messages || []), optimisticMsg]
          };
        }
        return c;
      })
    );

    setMessageText("");
    setSelectedImageBase64(null);

    // 2. Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.sendTyping(activeChatId, currentUser, false);

    // 3. Send message through backend API
    try {
      const savedMsg = await api.sendChatMessage(activeChatId, {
        senderId: currentUserId,
        senderName: currentUser?.name || currentUser?.username || "You",
        senderAvatar: currentUser?.avatar || currentUser?.profilePictureUrl,
        username: currentUser?.username,
        text: textContent,
        mediaUrl: mediaContent,
        messageType: msgType
      });

      if (savedMsg && savedMsg.id) {
        // Update temp message with confirmed server message ID & time
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChatId) {
              const updatedMsgs = (c.messages || []).map((m) =>
                m.id === tempId ? { ...savedMsg, time: formatBubbleTime(savedMsg.createdAt || savedMsg.time) } : m
              );
              return { ...c, messages: updatedMsgs };
            }
            return c;
          })
        );
      }
    } catch (err) {
      // If REST fails, broadcast via socket directly
      socketService.sendMessage({
        conversationId: activeChatId,
        senderId: currentUserId,
        senderName: currentUser?.name || "You",
        senderAvatar: currentUser?.avatar,
        text: textContent,
        mediaUrl: mediaContent,
        messageType: msgType,
        created_at: nowIso
      });
    }

    if (addPoints) addPoints(2);
  };

  // Search filtering
  const rawQ = searchQuery.trim();
  const isSearching = Boolean(rawQ);
  const cleanQ = rawQ.replace(/^@/, "").toLowerCase();

  // 1. Matching existing active chats
  const filteredChats = chats.filter((c) => {
    if (!cleanQ) return true;
    const name = (c.user?.name || "").toLowerCase();
    const username = (c.user?.username || "").toLowerCase();
    return name.includes(cleanQ) || username.includes(cleanQ);
  });

  // 2. Matching new platform travelers (excluding myself and people already in current chats list)
  const existingChatUserIds = new Set(
    chats.map((c) => (c.user?.id || c.user?.user_id || "").toString().toLowerCase())
  );
  const existingChatUsernames = new Set(
    chats.map((c) => (c.user?.username || "").toString().toLowerCase())
  );

  const filteredNewTravelers = allTravelers.filter((u) => {
    const uId = (u.id || u.user_id || "").toString().toLowerCase();
    const uName = (u.username || "").toString().toLowerCase();
    const myId = (currentUserId || "").toString().toLowerCase();
    const myUsername = (currentUser?.username || "").toString().toLowerCase();

    // Exclude myself
    if (uId === myId || (uName && myUsername && uName === myUsername)) return false;

    // Exclude people already in existing chats
    if (existingChatUserIds.has(uId) || (uName && existingChatUsernames.has(uName))) return false;

    if (!cleanQ) return true;
    const fullName = (u.name || [u.first_name, u.last_name].filter(Boolean).join(" ")).toLowerCase();
    return (
      fullName.includes(cleanQ) ||
      uName.includes(cleanQ) ||
      (u.bio && u.bio.toLowerCase().includes(cleanQ))
    );
  });

  const isCurrentChatTyping = typingUsers[activeChatId];

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-6xl h-[calc(100vh-80px)]">
      <div className="card bg-base-100 border border-base-200 shadow-xl flex flex-col md:flex-row h-full overflow-hidden rounded-3xl">
        
        {/* Left Panel: Inbox & Universal Search (Spacious List) */}
        <div className="w-full md:w-88 lg:w-96 shrink-0 border-r border-base-300 flex flex-col h-2/5 md:h-full bg-base-200/20">
          
          {/* Header & Dedicated Create Group Button */}
          <div className="p-4 border-b border-base-300 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black m-0 flex items-center gap-1.5 text-base-content">
                  <MessageSquare className="w-5 h-5 text-primary" /> Inbox
                </h2>
                {isConnected && (
                  <span className="badge badge-success badge-xs gap-1 font-bold text-[9px] text-white">
                    Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Dedicated Chat with an Admin Button */}
                <button 
                  onClick={handleChatWithAdmin}
                  disabled={isRequestingAdmin}
                  className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1 shadow-sm px-2 border-none"
                  title="Connect with an administrator for live support"
                >
                  {isRequestingAdmin ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Shield className="w-3 h-3 text-emerald-200" />
                  )}
                  <span className="hidden sm:inline">Admin Support</span>
                  <span className="sm:hidden">Admin</span>
                </button>

                {/* Dedicated Create Group Button */}
                <button 
                  onClick={() => navigate("/chats/create-group")}
                  className="btn btn-xs btn-primary font-bold text-white rounded-xl gap-1 shadow-sm px-2"
                  title="Create a new group chat"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Group</span>
                </button>
              </div>
            </div>

            {/* Universal Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search name or @username..." 
                className="input input-sm input-bordered w-full pl-9 pr-8 rounded-xl text-xs bg-base-100 focus:border-primary font-medium" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-base-content/40 hover:text-base-content"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations & Travelers List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            
            {/* Mode A: Default View (Recent Chats + Suggested Travelers) when not searching */}
            {!isSearching && (
              <div className="space-y-4">
                
                {/* 1. Recent Active Conversations (if any) */}
                {chats.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] text-base-content/60 font-bold">
                      <span>Recent Conversations</span>
                      <span className="badge badge-xs badge-neutral text-[9px]">{chats.length}</span>
                    </div>

                    {chats.map((chat) => {
                      const lastMsg = (chat.messages && chat.messages.length > 0)
                        ? chat.messages[chat.messages.length - 1] 
                        : (chat.lastMessage || null);
                      const isActive = chat.id === activeChatId;
                      const chatUserId = chat.user?.id || chat.user?.user_id;
                      const isOnline = onlineUsers[chatUserId] ?? true;

                      // Compute accurate time display
                      const timeToDisplay = formatChatTimestamp(
                        lastMsg?.createdAt || lastMsg?.created_at || chat.updatedAt || chat.created_at || lastMsg?.time
                      );

                      return (
                        <div 
                          key={chat.id}
                          onClick={() => setActiveChatId(chat.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                            isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-base-200/80 bg-base-100/50'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img 
                              src={chat.user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${chat.id}`} 
                              className="w-11 h-11 rounded-full object-cover border-2 border-base-100 shadow-sm" 
                              alt={chat.user?.name || "User"} 
                            />
                            {chat.isGroup ? (
                              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-base-100">
                                <Users className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-base-100 ${
                                isOnline ? 'bg-green-500' : 'bg-base-300'
                              }`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className={`text-xs truncate m-0 ${chat.unreadCount > 0 && !isActive ? 'font-black text-base-content' : 'font-bold'}`}>
                                  {chat.user?.name || "Chat Room"}
                                </h4>
                                {chat.isGroup && (
                                  <span className={`badge badge-xs text-[8px] font-bold ${isActive ? 'bg-white/20 text-white border-none' : 'badge-warning'}`}>
                                    Group
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className={`text-[9px] font-medium ${isActive ? 'text-white/80' : 'text-base-content/50'}`}>
                                  {timeToDisplay}
                                </span>
                                {chat.unreadCount > 0 && !isActive && (
                                  <span className="badge badge-primary badge-xs text-[9px] font-black h-4 px-1.5 shadow-sm text-white animate-pulse">
                                    {chat.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${
                              isActive ? 'text-white/85' : (chat.unreadCount > 0 ? 'font-bold text-base-content' : 'text-base-content/65')
                            }`}>
                              {typingUsers[chat.id] ? (
                                <span className="italic font-bold text-amber-300">Typing...</span>
                              ) : (
                                lastMsg ? (lastMsg.isDeleted ? "🚫 This message was deleted" : (lastMsg.mediaUrl ? "📷 Shared media" : lastMsg.text)) : "No messages yet"
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Platform Travelers List (Always discoverable to start chatting like Messenger) */}
                {filteredNewTravelers.length > 0 && (
                  <div className={`space-y-2 ${chats.length > 0 ? 'pt-3 border-t border-base-300/40' : ''}`}>
                    <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-base-content/50 font-black flex items-center justify-between">
                      <span>{chats.length === 0 ? "Start Chatting (All Travelers)" : "Suggested Travelers"} ({filteredNewTravelers.length})</span>
                      <span className="text-[9px] text-primary lowercase font-bold">click to chat</span>
                    </div>

                    <div className="space-y-1.5">
                      {filteredNewTravelers.map((traveler) => {
                        const targetId = traveler.id || traveler.user_id;
                        const tName = traveler.name || [traveler.first_name, traveler.last_name].filter(Boolean).join(" ") || traveler.username || "Traveler";
                        const tUsername = traveler.username || (tName || "traveler").toLowerCase().replace(/\s+/g, "_");
                        const tAvatar = traveler.avatar || traveler.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(tUsername)}`;

                        return (
                          <div 
                            key={targetId}
                            onClick={() => startOrOpenDirectChat(traveler)}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-primary/10 bg-base-100 border border-base-200/80 cursor-pointer transition-all duration-150 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <img 
                                  src={tAvatar} 
                                  className="w-10 h-10 rounded-full object-cover border border-base-300" 
                                  alt={tName} 
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-xs truncate text-base-content group-hover:text-primary transition-colors">
                                    {tName}
                                  </h4>
                                  {traveler.league && (
                                    <span className="badge badge-xs badge-outline text-[8px] opacity-75">
                                      {traveler.league}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-base-content/50 block truncate">
                                  @{tUsername}
                                </span>
                              </div>
                            </div>

                            <button 
                              type="button"
                              className="btn btn-xs btn-primary text-white rounded-xl font-bold gap-1 shrink-0"
                            >
                              Chat
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If both are empty */}
                {chats.length === 0 && filteredNewTravelers.length === 0 && (
                  <div className="text-center py-10 px-4 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-base-content/70 font-semibold">No chats yet</p>
                    <p className="text-[11px] text-base-content/50">Search any traveler above to start chatting!</p>
                  </div>
                )}

              </div>
            )}

            {/* Mode B: Active Search View (Matching Conversations + Matching Platform Travelers) */}
            {isSearching && (
              <div className="space-y-4">
                
                {/* 1. Matching Existing Chats */}
                {filteredChats.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-base-content/50 font-black">
                      Existing Chats ({filteredChats.length})
                    </div>
                    {filteredChats.map((chat) => {
                      const lastMsg = (chat.messages && chat.messages.length > 0)
                        ? chat.messages[chat.messages.length - 1] 
                        : (chat.lastMessage || null);
                      const isActive = chat.id === activeChatId;
                      const timeToDisplay = formatChatTimestamp(
                        lastMsg?.createdAt || lastMsg?.created_at || chat.updatedAt || chat.created_at || lastMsg?.time
                      );

                      return (
                        <div 
                          key={chat.id}
                          onClick={() => {
                            setActiveChatId(chat.id);
                            setSearchQuery("");
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                            isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-base-200/80 bg-base-100'
                          }`}
                        >
                          <img 
                            src={chat.user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${chat.id}`} 
                            className="w-10 h-10 rounded-full object-cover border border-base-300 shrink-0" 
                            alt="Avatar" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-bold text-xs truncate m-0">{chat.user?.name}</h4>
                              <span className="text-[9px] opacity-60">{timeToDisplay}</span>
                            </div>
                            <p className="text-[10px] opacity-70 truncate mt-0.5">
                              {lastMsg ? (lastMsg.isDeleted ? "🚫 This message was deleted" : lastMsg.text) : "Open chat"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Matching All Platform Travelers */}
                {filteredNewTravelers.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-base-content/50 font-black flex items-center justify-between">
                      <span>Travelers Found ({filteredNewTravelers.length})</span>
                      <span className="text-[9px] text-primary lowercase font-bold">click to chat</span>
                    </div>

                    {filteredNewTravelers.map((traveler) => {
                      const targetId = traveler.id || traveler.user_id;
                      const tName = traveler.name || [traveler.first_name, traveler.last_name].filter(Boolean).join(" ") || traveler.username || "Traveler";
                      const tUsername = traveler.username || (tName || "traveler").toLowerCase().replace(/\s+/g, "_");
                      const tAvatar = traveler.avatar || traveler.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(tUsername)}`;

                      return (
                        <div 
                          key={targetId}
                          onClick={() => startOrOpenDirectChat(traveler)}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-primary/10 bg-base-100 border border-base-200/80 cursor-pointer transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img 
                                src={tAvatar} 
                                className="w-10 h-10 rounded-full object-cover border border-base-300" 
                                alt={tName} 
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs truncate text-base-content group-hover:text-primary transition-colors">
                                  {tName}
                                </h4>
                                {traveler.league && (
                                  <span className="badge badge-xs badge-outline text-[8px] opacity-75">
                                    {traveler.league}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-base-content/50 block truncate">
                                @{tUsername}
                              </span>
                            </div>
                          </div>

                          <button 
                            type="button"
                            className="btn btn-xs btn-primary text-white rounded-xl font-bold gap-1 shrink-0"
                          >
                            Chat
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No Results in both */}
                {filteredChats.length === 0 && filteredNewTravelers.length === 0 && (
                  <div className="text-center py-10 px-4 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-base-300/40 text-base-content/40 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-base-content/70 font-semibold">
                      No travelers found for "{searchQuery}"
                    </p>
                    <p className="text-[10px] text-base-content/50">
                      Try searching with full name or @username.
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* Right Panel: Active Chat Stream or Welcome State */}
        {(!activeChat || activeChat.id === "chat_default" || !activeChat.user?.id) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-100/60 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="max-w-sm space-y-2">
              <h3 className="text-xl font-black text-base-content">LagaTour Messenger</h3>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Select any traveler from the left or search by <strong>Name</strong> or <strong>@username</strong> above to start messaging!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-3/5 md:h-full justify-between bg-base-100">
            
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/20">
              <div className="flex items-center gap-3">
                <Link to={activeChat.isGroup ? "#" : `/profile/${activeChat.user?.id || activeChat.user?.user_id || "user_1"}`} className="relative hover:opacity-90">
                  <img 
                    src={activeChat.user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChat.id}`} 
                    className="w-10 h-10 rounded-full object-cover border border-base-300 shadow-sm" 
                    alt={activeChat.user?.name} 
                  />
                  {!activeChat.isGroup && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
                  )}
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={activeChat.isGroup ? "#" : `/profile/${activeChat.user?.id || activeChat.user?.user_id || "user_1"}`}
                      className="font-black text-sm leading-none m-0 hover:text-primary transition-colors text-base-content"
                    >
                      {activeChat.user?.name || "Chat Room"}
                    </Link>
                    {activeChat.isGroup && (
                      <span className="badge badge-warning badge-xs font-bold text-[9px] gap-1">
                        <Users className="w-2.5 h-2.5" /> Group ({activeChat.members?.length || activeChat.user?.membersCount || 3} members)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-green-500 font-bold block mt-1">
                    ● {activeChat.isGroup ? "Group Active" : "Online now"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="btn btn-ghost btn-circle btn-sm text-base-content/70" title="Audio Call"><Phone className="w-4 h-4" /></button>
                <button className="btn btn-ghost btn-circle btn-sm text-base-content/70" title="Video Call"><Video className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Messages Stream */}
            <div 
              onClick={() => {
                if (activeMenuMsgId) setActiveMenuMsgId(null);
              }}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-base-200/20"
            >
            {activeChat.messages && activeChat.messages.length > 0 ? (
              (() => {
                // Find index of the last read message sent by me (to show recipient's mini avatar like Messenger)
                const lastReadMsgIndex = activeChat.messages.reduce((lastIdx, m, idx) => {
                  if (m.senderId === currentUserId && m.isRead && !m.isDeleted) return idx;
                  return lastIdx;
                }, -1);

                return activeChat.messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId || msg.senderId === "me";
                  const isSystem = msg.senderId === "system";

                  // Date divider calculation
                  const currentDateDivider = getDateDividerLabel(msg.createdAt || msg.created_at || msg.time);
                  const prevMsg = idx > 0 ? activeChat.messages[idx - 1] : null;
                  const prevDateDivider = prevMsg ? getDateDividerLabel(prevMsg.createdAt || prevMsg.created_at || prevMsg.time) : null;
                  const showDateDivider = currentDateDivider && currentDateDivider !== prevDateDivider;

                  if (isSystem) {
                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div className="flex justify-center my-3">
                            <span className="bg-base-200/90 text-base-content/60 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs border border-base-300/70">
                              {currentDateDivider}
                            </span>
                          </div>
                        )}
                        <div className="text-center my-3">
                          <span className="bg-base-200 text-base-content/70 border border-base-300 text-[10px] py-1 px-3.5 rounded-full font-bold inline-block shadow-sm">
                            {msg.text}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  }

                  const bubbleTime = formatBubbleTime(msg.createdAt || msg.created_at || msg.time);
                  const isLastRead = idx === lastReadMsgIndex;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="flex justify-center my-3">
                          <span className="bg-base-200/90 text-base-content/60 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs border border-base-300/70">
                            {currentDateDivider}
                          </span>
                        </div>
                      )}

                      <div className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                        <div className="chat-image avatar">
                          <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm">
                            <img 
                              src={isMe ? (currentUser?.avatar || currentUser?.profilePictureUrl) : (msg.senderAvatar || msg.avatar || activeChat.user?.avatar)} 
                              alt="Avatar" 
                            />
                          </div>
                        </div>

                        {!isMe && (msg.senderRole === "admin" || msg.senderRole === "superadmin" || msg.senderId?.startsWith("admin")) ? (
                          <div className="chat-header text-[10px] font-bold mb-0.5 flex items-center gap-1">
                            <span className="badge badge-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 font-bold gap-1 py-0.5 px-1.5 shadow-xs">
                              <Shield className="w-2.5 h-2.5 text-emerald-400" /> [Admin] {msg.senderName || "Administrator"}
                            </span>
                          </div>
                        ) : activeChat.isGroup && !isMe && msg.senderName ? (
                          <div className="chat-header text-[10px] text-base-content/60 font-bold mb-0.5">
                            {msg.senderName}
                          </div>
                        ) : null}

                        <div className={`chat-bubble text-xs shadow-sm leading-relaxed ${
                          msg.mediaUrl && !msg.text ? 'p-1.5' : 'p-3'
                        } max-w-sm sm:max-w-md md:max-w-lg rounded-2xl relative group ${
                          isMe 
                            ? (msg.isDeleted ? 'bg-base-200 text-base-content/60 border border-base-300 italic' : 'bg-primary text-white font-medium') 
                            : (msg.isDeleted ? 'bg-base-200/60 text-base-content/50 border border-base-300 italic' : 'bg-base-100 text-base-content border border-base-200 font-medium')
                        }`}>
                          {/* 3-Dot Options Button on Hover / Tap */}
                          {!msg.isDeleted && !msg.isPending && (
                            <div className={`absolute top-1.5 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-30`}>
                              <div className="relative">
                                <button 
                                  type="button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                                  }}
                                  className="btn btn-circle btn-xs bg-base-100/90 backdrop-blur-xs hover:bg-base-200 text-base-content shadow-md border border-base-300"
                                  title="Message options"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* 3-Dot Dropdown Menu Popup */}
                                {activeMenuMsgId === msg.id && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute ${isMe ? 'right-0' : 'left-0'} top-7 z-40 w-36 bg-base-100 rounded-2xl shadow-xl border border-base-200 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-base-content`}
                                  >
                                    {isMe && msg.text && !msg.isDeleted && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(msg)}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-base-content hover:bg-primary/10 hover:text-primary rounded-xl font-bold transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-primary" />
                                        <span>Edit text</span>
                                      </button>
                                    )}

                                    {msg.text && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyMessageText(msg)}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-base-content hover:bg-base-200 rounded-xl font-bold transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5 opacity-70" />
                                        <span>{copiedMsgId === msg.id ? "Copied! ✓" : "Copy text"}</span>
                                      </button>
                                    )}

                                    {isMe && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuMsgId(null);
                                          setDeleteConfirmMsgId(msg.id);
                                        }}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-error hover:bg-error/10 rounded-xl font-bold transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete for all</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Delete Confirmation Popover */}
                          {deleteConfirmMsgId === msg.id && (
                            <div className="p-2.5 bg-base-100 text-base-content rounded-xl border border-error/30 shadow-lg space-y-2 mb-2">
                              <div className="flex items-center gap-1.5 text-error font-bold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Delete this message for everyone?</span>
                              </div>
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => setDeleteConfirmMsgId(null)}
                                  className="btn btn-xs btn-ghost text-[10px]"
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="btn btn-xs btn-error text-white font-bold text-[10px]"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}

                          {msg.mediaUrl && !msg.isDeleted && (
                            <div 
                              onClick={() => setLightboxImageUrl(msg.mediaUrl)}
                              className={`rounded-xl overflow-hidden border border-black/10 cursor-pointer group/img relative shadow-sm max-w-full inline-block ${
                                msg.text ? 'mb-2' : ''
                              }`}
                              title="Click to view full image"
                            >
                              <img 
                                src={msg.mediaUrl} 
                                alt="Shared attachment" 
                                className="max-h-64 sm:max-h-72 max-w-full w-auto object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-[1.01]" 
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100 rounded-xl">
                                <span className="bg-black/75 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                                  <Search className="w-3.5 h-3.5" /> View full image
                                </span>
                              </div>
                            </div>
                          )}

                          {msg.isDeleted ? (
                            <div className="flex items-center gap-1.5 italic opacity-75">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>This message was deleted</span>
                            </div>
                          ) : (
                            msg.text ? <div className="break-words">{msg.text}</div> : null
                          )}
                        </div>

                        {/* Footer: Time + Edited badge + Seen / Sent / Pending Status */}
                        <div className="chat-footer text-[9px] opacity-70 mt-1 flex items-center justify-end gap-1.5">
                          <span>{bubbleTime}</span>

                          {msg.isEdited && !msg.isDeleted && (
                            <span className="text-[8px] font-semibold italic opacity-85" title="Edited message">
                              • Edited
                            </span>
                          )}

                          {isMe && (
                            <div className="flex items-center gap-1">
                              {msg.isPending ? (
                                <Clock className="w-3 h-3 text-base-content/40" title="Sending..." />
                              ) : msg.isDeleted ? (
                                <span className="italic text-[8px] opacity-60">Deleted</span>
                              ) : msg.isRead ? (
                                <div className="flex items-center gap-1 text-primary font-bold">
                                  <CheckCheck className="w-3.5 h-3.5 text-primary" title="Seen" />
                                  <span className="text-[8px]">Seen</span>

                                  {/* Mini avatar of recipient on the last read message (Messenger style) */}
                                  {isLastRead && !activeChat.isGroup && activeChat.user?.avatar && (
                                    <img 
                                      src={activeChat.user.avatar} 
                                      alt="Seen" 
                                      className="w-3.5 h-3.5 rounded-full object-cover border border-base-100 shadow-sm ml-0.5" 
                                      title={`Seen by ${activeChat.user.name || "Recipient"}`}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-0.5 text-base-content/50">
                                  <Check className="w-3 h-3" title="Sent" />
                                  <span className="text-[8px]">Sent</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            ) : (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-base-content/80">No messages yet</h4>
                <p className="text-[11px] text-base-content/50">Send a greeting or share a photo to start chatting!</p>
              </div>
            )}

            {/* Live Typing Indicator */}
            {isCurrentChatTyping && (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-7 h-7 rounded-full border border-base-300">
                    <img src={activeChat.user?.avatar} alt="Avatar" />
                  </div>
                </div>
                <div className="chat-bubble bg-base-100 text-base-content border border-base-200 text-xs py-2 px-3 rounded-2xl flex items-center gap-1.5">
                  <span className="font-bold text-[10px] text-primary">{isCurrentChatTyping} is typing</span>
                  <span className="loading loading-dots loading-xs text-primary"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Hidden File Input for Device Photo / Gallery Selection */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={handleImageFileSelect}
          />

          {/* Selected Image Preview Bar Before Sending */}
          {selectedImageBase64 && !editingMessage && (
            <div className="p-3 bg-base-200/90 border-t border-base-300 flex items-center justify-between animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setLightboxImageUrl(selectedImageBase64)}
                  className="relative group/thumb w-12 h-12 rounded-xl overflow-hidden border-2 border-primary shadow-md shrink-0 cursor-pointer"
                  title="Click to preview"
                >
                  <img src={selectedImageBase64} alt="Attached preview" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-base-content flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Photo attached</span>
                  </p>
                  <p className="text-[10px] text-base-content/60 truncate">
                    Ready to send • Add message/caption below
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedImageBase64(null)}
                className="btn btn-circle btn-xs btn-ghost text-base-content/70 hover:bg-base-300"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Editing Mode Banner */}
          {editingMessage && (
            <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="min-w-0 flex items-center gap-1.5">
                  <span className="font-bold text-primary">Editing message:</span>
                  <span className="text-base-content/70 italic truncate inline-block max-w-[180px] sm:max-w-xs align-bottom">
                    "{editingMessage.text}"
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                title="Cancel editing (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Input Form */}
          <form 
            onSubmit={handleSendMessage} 
            onPaste={handlePaste}
            className="p-3 sm:p-4 border-t border-base-300 bg-base-100 flex gap-2 items-center"
          >
            {!editingMessage && (
              <div className="flex items-center">
                {/* Upload Photo Button (Device Gallery / Files / Screen Paste) */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingImage}
                  className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:text-primary"
                  title="Send photo from device (or paste with Ctrl+V)"
                >
                  {isCompressingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            <input 
              type="text" 
              placeholder={
                editingMessage 
                  ? "Edit message (Press Enter to save, Esc to cancel)..." 
                  : (selectedImageBase64 ? "Add a caption/message (optional)..." : `Message ${activeChat.user?.name || "traveler"}...`)
              } 
              className={`input input-sm sm:input-md input-bordered flex-1 rounded-2xl text-xs bg-base-100 font-medium ${
                editingMessage ? 'border-primary ring-1 ring-primary/30' : 'focus:border-primary'
              }`} 
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Escape" && editingMessage) {
                  handleCancelEdit();
                }
              }}
              autoFocus={Boolean(editingMessage)}
            />

            {editingMessage && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-sm sm:btn-md btn-ghost rounded-2xl text-xs font-bold text-base-content/70"
              >
                Cancel
              </button>
            )}

            <button 
              type="submit" 
              disabled={!messageText.trim() && !selectedImageBase64}
              className="btn btn-sm sm:btn-md btn-primary text-white rounded-2xl text-xs gap-1.5 px-4 font-bold shadow-md shadow-primary/20"
            >
              {editingMessage ? (
                <>
                  <span>Save</span> <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Send</span> <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>
        )}

        {/* Fullscreen Lightbox Modal for Viewing Images */}
        {lightboxImageUrl && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setLightboxImageUrl(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                onClick={() => setLightboxImageUrl(null)}
                className="absolute -top-11 right-0 btn btn-circle btn-sm bg-white/20 text-white hover:bg-white/40 border-none shadow-lg"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
              <img 
                src={lightboxImageUrl} 
                alt="Fullscreen view" 
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="mt-3 flex gap-2">
                <a 
                  href={lightboxImageUrl} 
                  download={`lagatour_image_${Date.now()}.jpg`}
                  className="btn btn-xs btn-primary text-white rounded-xl font-bold gap-1.5 px-3.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <button 
                  type="button"
                  onClick={() => setLightboxImageUrl(null)}
                  className="btn btn-xs btn-ghost text-white/80 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
