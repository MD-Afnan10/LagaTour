import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_CHATS, MOCK_USERS } from "../data/mockData";
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
  CheckCheck, 
  X,
  Compass
} from "lucide-react";

/**
 * Format timestamp accurately for sidebar conversation list
 */
function formatChatTimestamp(timestamp) {
  if (!timestamp) return "";
  
  // If it's a relative time like "Just now" or "Yesterday", check if it's a real Date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    // If not a parseable date, return clean trimmed string
    return timestamp;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  
  // If today -> show 12-hour time, e.g. "01:52 pm"
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  }

  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  }

  // Within last 7 days -> Day name, e.g. "Sun", "Mon"
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  // Older -> "Aug 26"
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format bubble message timestamp
 */
function formatBubbleTime(timestamp) {
  if (!timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
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

  const currentUserId = currentUser?.id || currentUser?.user_id || "user_1";
  const storageKey = `ts_chats_${currentUserId}`;

  // Chats list state (User-scoped conversation list)
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
    return deduplicateChats(MOCK_CHATS, currentUserId);
  });

  // All Platform Travelers state for universal search
  const [allTravelers, setAllTravelers] = useState(MOCK_USERS);
  const [activeChatId, setActiveChatId] = useState(() => {
    return location.state?.activeChatId || chats[0]?.id || "chat_1";
  });

  const [messageText, setMessageText] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

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
        cleanupTyping();
        cleanupStatus();
      };
    }
  }, [currentUser]);

  // 2. Fetch All Platform Travelers for Universal Search
  useEffect(() => {
    api.searchChatUsers(searchQuery, currentUserId)
      .then((users) => {
        if (Array.isArray(users)) {
          setAllTravelers(users);
        } else if (!searchQuery) {
          setAllPlatformTravelersFallback();
        }
      })
      .catch(() => {
        if (!searchQuery) {
          setAllPlatformTravelersFallback();
        }
      });

    function setAllPlatformTravelersFallback() {
      const fallback = MOCK_USERS.filter(u => (u.id || u.user_id) !== currentUserId);
      setAllTravelers(fallback);
    }
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

  // 5. Join active conversation room on change
  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    socketService.joinChat(activeChatId, currentUserId);

    // Fetch fresh message history from backend
    api.fetchChatMessages(activeChatId, currentUserId)
      .then((msgs) => {
        if (msgs && msgs.length > 0) {
          setChats((prev) =>
            prev.map((c) => (c.id === activeChatId ? { ...c, messages: msgs } : c))
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

    const formattedMsg = {
      id: msgId,
      conversationId: targetConvId,
      senderId: msgSenderId,
      senderName: incomingMsg.sender_name || incomingMsg.senderName || "Traveler",
      senderAvatar: incomingMsg.sender_avatar || incomingMsg.senderAvatar || incomingMsg.avatar,
      text: msgText,
      mediaUrl: msgMedia,
      createdAt: msgCreatedAt,
      time: formatBubbleTime(msgCreatedAt)
    };

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
            (m) => m.senderId === currentUserId && m.text === formattedMsg.text && (m.isPending || m.id.startsWith("temp_"))
          );
          if (optimisticIndex !== -1) {
            updatedMsgs[optimisticIndex] = formattedMsg;
          } else {
            updatedMsgs.push(formattedMsg);
          }
        } else {
          updatedMsgs.push(formattedMsg);
        }

        const updatedChat = {
          ...chat,
          updatedAt: msgCreatedAt,
          lastMessage: formattedMsg,
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
          updatedAt: msgCreatedAt,
          createdAt: msgCreatedAt,
          messages: [formattedMsg]
        };

        return deduplicateChats([newIncomingChat, ...prevChats], currentUserId);
      }
    });
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

  // Send message handler (Single source of truth, Zero Duplication)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !mediaUrlInput.trim()) return;

    const textContent = messageText.trim();
    const mediaContent = mediaUrlInput.trim() || undefined;
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
    setMediaUrlInput("");
    setShowMediaModal(false);

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
        mediaUrl: mediaContent
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
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl h-[calc(100vh-80px)]">
      <div className="card bg-base-100 border border-base-200 shadow-xl flex flex-col md:flex-row h-full overflow-hidden rounded-3xl">
        
        {/* Left Panel: Inbox & Universal Search */}
        <div className="w-full md:w-84 border-r border-base-300 flex flex-col h-2/5 md:h-full bg-base-200/20">
          
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

              {/* Dedicated Create Group Button */}
              <button 
                onClick={() => navigate("/chats/create-group")}
                className="btn btn-xs btn-primary font-bold text-white rounded-xl gap-1 shadow-sm px-2.5"
                title="Create a new group chat"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create Group</span>
              </button>
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
                                <h4 className="font-bold text-xs truncate m-0">{chat.user?.name || "Chat Room"}</h4>
                                {chat.isGroup && (
                                  <span className={`badge badge-xs text-[8px] font-bold ${isActive ? 'bg-white/20 text-white border-none' : 'badge-warning'}`}>
                                    Group
                                  </span>
                                )}
                              </div>
                              <span className={`text-[9px] shrink-0 ml-1 font-medium ${isActive ? 'text-white/80' : 'text-base-content/50'}`}>
                                {timeToDisplay}
                              </span>
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/85' : 'text-base-content/65'}`}>
                              {typingUsers[chat.id] ? (
                                <span className="italic font-bold text-amber-300">Typing...</span>
                              ) : (
                                lastMsg ? (lastMsg.mediaUrl ? "📷 Shared media" : lastMsg.text) : "No messages yet"
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
                              {lastMsg ? lastMsg.text : "Open chat"}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/20">
            {activeChat.messages && activeChat.messages.length > 0 ? (
              activeChat.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId || msg.senderId === "me";
                const isSystem = msg.senderId === "system";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-3">
                      <span className="bg-base-200 text-base-content/70 border border-base-300 text-[10px] py-1 px-3.5 rounded-full font-bold inline-block shadow-sm">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const bubbleTime = formatBubbleTime(msg.createdAt || msg.created_at || msg.time);

                return (
                  <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                    <div className="chat-image avatar">
                      <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm">
                        <img 
                          src={isMe ? (currentUser?.avatar || currentUser?.profilePictureUrl) : (msg.senderAvatar || msg.avatar || activeChat.user?.avatar)} 
                          alt="Avatar" 
                        />
                      </div>
                    </div>

                    {activeChat.isGroup && !isMe && msg.senderName && (
                      <div className="chat-header text-[10px] text-base-content/60 font-bold mb-0.5">
                        {msg.senderName}
                      </div>
                    )}

                    <div className={`chat-bubble text-xs shadow-sm leading-relaxed p-3 max-w-sm sm:max-w-md rounded-2xl ${
                      isMe ? 'bg-primary text-white font-medium' : 'bg-base-100 text-base-content border border-base-200 font-medium'
                    }`}>
                      {msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-h-56">
                          <img src={msg.mediaUrl} alt="Shared attachment" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>{msg.text}</div>
                    </div>

                    <div className="chat-footer text-[9px] opacity-60 mt-1 flex items-center gap-1">
                      <span>{bubbleTime}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-base-content/80">No messages yet</h4>
                <p className="text-[11px] text-base-content/50">Send a greeting to start chatting!</p>
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

          {/* Media Input Drawer / Modal */}
          {showMediaModal && (
            <div className="p-3 bg-base-200/70 border-t border-base-300 flex items-center gap-2">
              <input 
                type="url" 
                placeholder="Paste image / photo URL (e.g. https://...)..."
                className="input input-sm input-bordered flex-1 rounded-xl text-xs bg-base-100"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="btn btn-xs btn-ghost"
              >
                Close
              </button>
            </div>
          )}

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-base-300 bg-base-100 flex gap-2 items-center">
            <button 
              type="button" 
              onClick={() => setShowMediaModal(!showMediaModal)}
              className={`btn btn-sm btn-circle btn-ghost ${showMediaModal ? 'text-primary' : 'text-base-content/60'}`}
              title="Share photo / image link"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input 
              type="text" 
              placeholder={`Message ${activeChat.user?.name || "traveler"}...`} 
              className="input input-sm sm:input-md input-bordered flex-1 rounded-2xl text-xs bg-base-100 focus:border-primary font-medium" 
              value={messageText}
              onChange={handleInputChange}
            />

            <button 
              type="submit" 
              disabled={!messageText.trim() && !mediaUrlInput.trim()}
              className="btn btn-sm sm:btn-md btn-primary text-white rounded-2xl text-xs gap-1.5 px-4 font-bold shadow-md shadow-primary/20"
            >
              <span>Send</span> <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
        )}

      </div>
    </div>
  );
}
