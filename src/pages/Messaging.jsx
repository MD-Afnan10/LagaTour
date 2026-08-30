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
  Smile,
  CheckCheck,
  Circle
} from "lucide-react";

export default function Messaging() {
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Chats list state
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("ts_chats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved chats", err);
      }
    }
    return MOCK_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    return location.state?.activeChatId || chats[0]?.id || "chat_1";
  });

  const [messageText, setMessageText] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [searchInbox, setSearchInbox] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // { [convId]: "Username" }
  const [onlineUsers, setOnlineUsers] = useState({}); // { [userId]: boolean }
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
        if (userId === currentUser.id || userId === currentUser.user_id) return;
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

  // 2. Handle targetUser navigation from UserProfile or other pages
  useEffect(() => {
    if (location.state?.targetUser) {
      const target = location.state.targetUser;
      const targetId = target.id || target.user_id;

      // Check if conversation already exists
      const existing = chats.find(c => 
        !c.isGroup && (c.user?.id === targetId || c.user?.user_id === targetId || c.user?.username === target.username)
      );

      if (existing) {
        setActiveChatId(existing.id);
      } else {
        // Create new direct conversation locally & via API
        const newDirectChat = {
          id: `chat_direct_${targetId}_${Date.now()}`,
          isGroup: false,
          user: {
            id: targetId,
            user_id: targetId,
            name: target.name || target.username,
            username: target.username || target.name?.toLowerCase().replace(/\s+/g, "_"),
            avatar: target.avatar || target.profilePictureUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${target.username || "traveler"}`
          },
          messages: [
            {
              id: "msg_init_" + Date.now(),
              senderId: "system",
              text: `👋 You started a conversation with ${target.name || target.username}`,
              time: "Just now"
            }
          ]
        };

        setChats(prev => [newDirectChat, ...prev]);
        setActiveChatId(newDirectChat.id);

        // Try syncing to backend
        if (currentUser?.id && targetId) {
          api.getOrCreateDirectChat(currentUser.id, targetId).catch(() => {});
        }
      }
    } else if (location.state?.activeChatId) {
      setActiveChatId(location.state.activeChatId);
    }
  }, [location.state]);

  // 3. Try fetching live chats from backend with fallback
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.user_id;

    api.fetchUserConversations(uid)
      .then((serverChats) => {
        if (serverChats && serverChats.length > 0) {
          setChats(serverChats);
        }
      })
      .catch((err) => {
        // Silently use localStorage / mock fallback
        console.log("Using cached/local chats (Backend offline or not synced yet)");
      });
  }, [currentUser]);

  // 4. Join active conversation room on change
  useEffect(() => {
    if (!activeChatId || !currentUser) return;
    const uid = currentUser.id || currentUser.user_id;

    socketService.joinChat(activeChatId, uid);

    // Try fetching fresh message history from backend
    api.fetchChatMessages(activeChatId)
      .then((msgs) => {
        if (msgs && msgs.length > 0) {
          setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: msgs } : c));
        }
      })
      .catch(() => {});

    return () => {
      socketService.leaveChat(activeChatId, uid);
    };
  }, [activeChatId, currentUser]);

  // 5. Sync chats state to localStorage
  useEffect(() => {
    if (chats && chats.length > 0) {
      localStorage.setItem("ts_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // 6. Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  // Incoming socket message handler
  const handleIncomingMessage = (incomingMsg) => {
    const targetConvId = incomingMsg.conversation_id || incomingMsg.conversationId || incomingMsg.chatId;

    const formattedMsg = {
      id: incomingMsg.message_id || incomingMsg.id || "msg_" + Date.now(),
      senderId: incomingMsg.sender_id || incomingMsg.senderId,
      senderName: incomingMsg.sender_name || incomingMsg.senderName || "Traveler",
      senderAvatar: incomingMsg.sender_avatar || incomingMsg.senderAvatar,
      text: incomingMsg.message_text || incomingMsg.text || "",
      mediaUrl: incomingMsg.media_url || incomingMsg.mediaUrl,
      time: incomingMsg.created_at ? new Date(incomingMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
    };

    setChats((prevChats) => {
      let found = false;
      const updated = prevChats.map((chat) => {
        if (chat.id === targetConvId) {
          found = true;
          // Avoid duplicate messages if already appended optimistically
          const exists = chat.messages.some(m => m.id === formattedMsg.id);
          if (exists) return chat;
          return {
            ...chat,
            messages: [...chat.messages, formattedMsg]
          };
        }
        return chat;
      });

      return updated;
    });
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || {
    id: "chat_default",
    user: { name: "Traveler", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=default" },
    messages: []
  };

  // Handle typing indicator trigger
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

  // Send message handler
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !mediaUrlInput.trim()) return;

    const currentUserId = currentUser?.id || currentUser?.user_id || "user_me";
    const textContent = messageText.trim();
    const mediaContent = mediaUrlInput.trim() || undefined;

    const newMsg = {
      id: "msg_" + Date.now(),
      conversationId: activeChatId,
      senderId: currentUserId,
      senderName: currentUser?.name || currentUser?.username || "You",
      senderAvatar: currentUser?.avatar || currentUser?.profilePictureUrl,
      text: textContent,
      mediaUrl: mediaContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Optimistic local update
    const updatedChats = chats.map((c) => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: [...(c.messages || []), newMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    setMessageText("");
    setMediaUrlInput("");
    setShowMediaModal(false);

    // 2. Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.sendTyping(activeChatId, currentUser, false);

    // 3. Broadcast via Socket.io
    socketService.sendMessage({
      conversationId: activeChatId,
      senderId: currentUserId,
      senderName: currentUser?.name || "You",
      senderAvatar: currentUser?.avatar,
      text: textContent,
      mediaUrl: mediaContent
    });

    // 4. Persist via REST API
    api.sendChatMessage(activeChatId, {
      senderId: currentUserId,
      text: textContent,
      mediaUrl: mediaContent
    }).catch(() => {
      // Background REST sync error ignored; socket or local state handles display
    });

    // 5. Award gamification points for active communication
    if (addPoints) addPoints(2);
  };

  // Filter conversations in sidebar
  const filteredChats = chats.filter((c) => {
    const q = searchInbox.toLowerCase().trim();
    if (!q) return true;
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.username?.toLowerCase().includes(q)
    );
  });

  const isCurrentChatTyping = typingUsers[activeChatId];

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl h-[calc(100vh-80px)]">
      <div className="card bg-base-100 border border-base-200 shadow-xl flex flex-col md:flex-row h-full overflow-hidden rounded-3xl">
        
        {/* Left Panel: Conversations List */}
        <div className="w-full md:w-84 border-r border-base-300 flex flex-col h-2/5 md:h-full bg-base-200/20">
          
          {/* Header & Create Group Button */}
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

            {/* Search conversations */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs bg-base-100 focus:border-primary" 
                value={searchInbox}
                onChange={(e) => setSearchInbox(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-xs text-base-content/50">
                No conversations found.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const lastMsg = chat.messages && chat.messages.length > 0 
                  ? chat.messages[chat.messages.length - 1] 
                  : null;
                const isActive = chat.id === activeChatId;
                const chatUserId = chat.user?.id || chat.user?.user_id;
                const isOnline = onlineUsers[chatUserId] ?? true;

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
                          {lastMsg ? (typeof lastMsg.time === 'string' ? lastMsg.time.split(",")[0] : "Recent") : ""}
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
              })
            )}
          </div>

        </div>

        {/* Right Panel: Active Chat Stream */}
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
                const myId = currentUser?.id || currentUser?.user_id;
                const isMe = msg.senderId === myId || msg.senderId === "me";
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

                return (
                  <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                    <div className="chat-image avatar">
                      <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm">
                        <img 
                          src={isMe ? (currentUser?.avatar || currentUser?.profilePictureUrl) : (msg.senderAvatar || activeChat.user?.avatar)} 
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
                      <span>{msg.time}</span>
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
              className="input input-sm sm:input-md input-bordered flex-1 rounded-2xl text-xs bg-base-100 focus:border-primary" 
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

      </div>
    </div>
  );
}
