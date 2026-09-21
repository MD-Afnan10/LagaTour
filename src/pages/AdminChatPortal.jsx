import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import socketService from "../services/socketService";
import { 
  ShieldAlert, 
  Send, 
  Check, 
  Clock, 
  MessageSquare, 
  Users, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Headphones, 
  Shield, 
  Search, 
  X, 
  RefreshCw, 
  ArrowLeft,
  User,
  Activity
} from "lucide-react";

export default function AdminChatPortal() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [supportRequests, setSupportRequests] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const messagesEndRef = useRef(null);

  const currentAdminId = currentUser?.id || currentUser?.user_id || "admin_root";
  const currentAdminName = currentUser?.name || currentUser?.username || "Platform Admin";

  // Check admin authorization
  const isAuthorized = Boolean(
    currentUser?.isAdmin || 
    currentUser?.role === "admin" || 
    currentUser?.role === "superadmin" || 
    currentUser?.user_id === "admin_root" || 
    currentUser?.id === "admin_root" || 
    currentUser?.email?.toLowerCase().startsWith("admin") || 
    currentUser?.username?.toLowerCase().startsWith("admin") || 
    currentUser?.username === "nabil_wanderer" ||
    currentUser?.email === "nutamim2001@gmail.com"
  );

  const loadSupportRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await api.getAdminSupportRequests();
      if (res?.success && Array.isArray(res.requests)) {
        setSupportRequests(res.requests);
        if (!activeRequestId && res.requests.length > 0) {
          setActiveRequestId(res.requests[0].request_id);
        }
      }
    } catch (err) {
      console.warn("Failed to load support requests:", err.message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadSupportRequests();
  }, []);

  const activeRequest = supportRequests.find(r => r.request_id === activeRequestId);
  const activeConversationId = activeRequest?.conversation_id;

  // Load active chat messages
  useEffect(() => {
    if (!activeConversationId) return;

    setIsLoadingMessages(true);
    api.fetchChatMessages(activeConversationId, currentAdminId)
      .then((msgs) => {
        if (Array.isArray(msgs)) {
          setActiveChatMessages(msgs);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch support chat messages:", err.message);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });

    // Join room via socket
    socketService.joinChat(activeConversationId, currentAdminId);
  }, [activeConversationId]);

  // Real-time socket events listener
  useEffect(() => {
    if (!currentUser) return;
    const socket = socketService.connect(currentUser);
    if (!socket) return;

    // Listen for new support requests from any traveler
    const handleNewRequest = (newReq) => {
      loadSupportRequests();
      setActionNotice(`🔔 New support request from ${newReq.userName || "Traveler"}!`);
      setTimeout(() => setActionNotice(""), 4000);
    };

    // Listen for request accepted by any admin
    const handleAccepted = (data) => {
      setSupportRequests(prev => prev.map(r => 
        r.request_id === data.requestId ? { ...r, status: "accepted", accepted_by: data.acceptedBy, accepted_by_name: data.acceptedByName } : r
      ));
    };

    // Listen for request resolved
    const handleResolved = (data) => {
      setSupportRequests(prev => prev.map(r => 
        r.request_id === data.requestId ? { ...r, status: "resolved" } : r
      ));
    };

    // Listen for incoming messages in this support conversation
    const handleIncomingMessage = (msg) => {
      if (msg.conversationId === activeConversationId) {
        setActiveChatMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Update last message in requests list
      setSupportRequests(prev => prev.map(r => {
        if (r.conversation_id === msg.conversationId) {
          return {
            ...r,
            last_message_text: msg.text,
            last_message_time: msg.createdAt || new Date().toISOString()
          };
        }
        return r;
      }));
    };

    socket.on("admin:new_support_request", handleNewRequest);
    socket.on("admin:support_request_accepted", handleAccepted);
    socket.on("admin:support_request_resolved", handleResolved);
    socket.on("receive_message", handleIncomingMessage);

    return () => {
      socket.off("admin:new_support_request", handleNewRequest);
      socket.off("admin:support_request_accepted", handleAccepted);
      socket.off("admin:support_request_resolved", handleResolved);
      socket.off("receive_message", handleIncomingMessage);
    };
  }, [currentUser, activeConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages]);

  // Accept a pending request
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.acceptAdminSupportRequest(requestId, {
        adminId: currentAdminId,
        adminName: currentAdminName
      });
      if (res?.success) {
        setActionNotice(`✅ You accepted this support request.`);
        setTimeout(() => setActionNotice(""), 3000);
        await loadSupportRequests();
      }
    } catch (err) {
      alert("Failed to accept request: " + err.message);
    }
  };

  // Resolve a support chat
  const handleResolveRequest = async (requestId) => {
    try {
      const res = await api.resolveAdminSupportRequest(requestId, {
        adminId: currentAdminId,
        adminName: currentAdminName
      });
      if (res?.success) {
        setActionNotice(`✅ Support ticket resolved.`);
        setTimeout(() => setActionNotice(""), 3000);
        await loadSupportRequests();
      }
    } catch (err) {
      alert("Failed to resolve request: " + err.message);
    }
  };

  // Send admin message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentAdminId,
      senderName: currentAdminName,
      senderRole: "admin",
      senderAvatar: currentUser?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentAdminId}`,
      text: textToSend,
      createdAt: new Date().toISOString(),
      time: "Just now"
    };

    setActiveChatMessages(prev => [...prev, optimisticMsg]);

    try {
      await api.sendChatMessage(activeConversationId, {
        text: textToSend,
        user: {
          id: currentAdminId,
          user_id: currentAdminId,
          name: currentAdminName,
          username: currentUser?.username || currentAdminName,
          role: "admin",
          avatar: currentUser?.avatar
        }
      });
    } catch (err) {
      console.error("Failed to send admin message:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-base-content/90">Administrator Authorization Required</h2>
        <p className="text-xs text-base-content/80 leading-relaxed">
          The Admin Support Portal is reserved for staff and verified platform administrators.
        </p>
        <button onClick={() => navigate("/auth")} className="btn btn-warning btn-sm rounded-xl font-bold text-xs">
          Sign In as Administrator
        </button>
      </div>
    );
  }

  const filteredRequests = supportRequests.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.username?.toLowerCase().includes(q) ||
      r.first_name?.toLowerCase().includes(q) ||
      r.last_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.user_id?.toLowerCase().includes(q)
    );
  });

  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const activeAndResolvedRequests = filteredRequests.filter(r => r.status !== "pending");

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-8 py-4 max-w-7xl h-[calc(100vh-4rem)] flex flex-col space-y-3">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-base-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/admin")} 
            className="btn btn-xs btn-ghost gap-1 font-bold text-slate-300 hover:text-white"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-base-content m-0">
              <Headphones className="w-6 h-6 text-emerald-500" /> Admin Live Support Portal
            </h1>
            <p className="text-[11px] text-base-content/70 m-0">
              Multi-admin traveler support workspace • Real-time notifications and shared conversation threads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actionNotice && (
            <span className="badge badge-success text-white font-bold text-xs px-2.5 py-1 animate-pulse">
              {actionNotice}
            </span>
          )}
          <button 
            onClick={loadSupportRequests}
            disabled={isLoadingRequests}
            className="btn btn-xs btn-ghost bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingRequests ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Right Chat Panel */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 bg-base-100 rounded-3xl border border-base-200 overflow-hidden shadow-xl">
        
        {/* Left Column: Traveler Support Requests Queue (4 cols) */}
        <div className="md:col-span-4 lg:col-span-4 border-r border-base-200 flex flex-col h-full bg-base-200/30">
          
          {/* Search Box */}
          <div className="p-3 border-b border-base-200 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search traveler name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-xs w-full pl-8 pr-7 py-3 rounded-xl text-xs bg-base-100 border-base-300 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-2 text-base-content/40 hover:text-base-content">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Counts Summary Pill */}
            <div className="flex items-center justify-between text-[11px] font-bold text-base-content/70 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                {pendingRequests.length} Pending
              </span>
              <span>
                {activeAndResolvedRequests.length} Active / Resolved
              </span>
            </div>
          </div>

          {/* Requests List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            
            {/* PENDING SECTION */}
            {pendingRequests.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-error px-2">
                  Waiting for Admin ({pendingRequests.length})
                </span>
                {pendingRequests.map((req) => {
                  const isSelected = req.request_id === activeRequestId;
                  const displayName = [req.first_name, req.last_name].filter(Boolean).join(" ") || req.username || "Traveler";
                  const avatarUrl = req.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.username || req.user_id}`;

                  return (
                    <div 
                      key={req.request_id}
                      onClick={() => setActiveRequestId(req.request_id)}
                      className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                        isSelected 
                          ? "bg-error/10 border-error shadow-sm" 
                          : "bg-base-100 border-base-200 hover:border-error/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-base-300 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-base-content truncate m-0">
                              {displayName}
                            </h4>
                            <p className="text-[10px] text-base-content/60 font-mono truncate m-0">
                              @{req.username || "user"}
                            </p>
                          </div>
                        </div>
                        <span className="badge badge-error text-white font-bold text-[9px] px-1.5 py-0.5 shrink-0">
                          Pending
                        </span>
                      </div>

                      <p className="text-[11px] text-base-content/80 line-clamp-1 mt-2 mb-2 italic">
                        "{req.last_message_text || "Traveler requested admin support."}"
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-base-200/80">
                        <span className="text-[9px] text-base-content/50 font-mono">
                          {req.created_at ? new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptRequest(req.request_id);
                          }}
                          className="btn btn-xs btn-error text-white rounded-xl text-[10px] font-bold py-0.5 px-2.5 shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Accept Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ACTIVE & RECENT CONVERSATIONS */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-base-content/50 px-2">
                Active & Ongoing Support ({activeAndResolvedRequests.length})
              </span>

              {activeAndResolvedRequests.length === 0 && pendingRequests.length === 0 ? (
                <div className="text-center py-10 text-base-content/50 text-xs">
                  <Headphones className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  No support conversations yet.
                </div>
              ) : (
                activeAndResolvedRequests.map((req) => {
                  const isSelected = req.request_id === activeRequestId;
                  const displayName = [req.first_name, req.last_name].filter(Boolean).join(" ") || req.username || "Traveler";
                  const avatarUrl = req.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.username || req.user_id}`;
                  const isResolved = req.status === "resolved";

                  return (
                    <div 
                      key={req.request_id}
                      onClick={() => setActiveRequestId(req.request_id)}
                      className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-base-100 border-base-200 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-base-300 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-base-content truncate m-0">
                              {displayName}
                            </h4>
                            <p className="text-[10px] text-base-content/60 font-mono truncate m-0">
                              @{req.username || "user"}
                            </p>
                          </div>
                        </div>
                        <span className={`badge badge-xs font-bold text-[9px] px-1.5 py-0.5 shrink-0 ${
                          isResolved ? "badge-neutral text-base-content/60" : "badge-success text-white"
                        }`}>
                          {isResolved ? "Resolved" : "Accepted"}
                        </span>
                      </div>

                      <p className="text-[11px] text-base-content/75 line-clamp-1 mt-1.5 mb-1">
                        {req.last_message_text || "Support conversation active."}
                      </p>

                      <div className="flex items-center justify-between text-[9px] text-base-content/50 pt-1 border-t border-base-200/80">
                        <span>
                          {req.accepted_by_name ? `Joined by: ${req.accepted_by_name}` : "Support active"}
                        </span>
                        <span className="font-mono">
                          {req.last_message_time ? new Date(req.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Interactive Chat Stream (8 cols) */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-col h-full bg-base-100">
          
          {!activeRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-base-content/50 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-base-200 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-base-content/40" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content">No Active Support Chat Selected</h3>
                <p className="text-xs text-base-content/60 mt-1 max-w-sm">
                  Select a pending support request or ongoing conversation from the left to view messages and interact with the traveler.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Window Header */}
              <div className="p-3.5 border-b border-base-200 flex items-center justify-between bg-base-200/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={activeRequest.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeRequest.username || activeRequest.user_id}`}
                      alt="Traveler" 
                      className="w-10 h-10 rounded-full object-cover border border-base-300"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-base-content m-0">
                        {[activeRequest.first_name, activeRequest.last_name].filter(Boolean).join(" ") || activeRequest.username || "Traveler"}
                      </h3>
                      <span className="badge badge-outline badge-xs text-[9px] font-bold font-mono">
                        @{activeRequest.username || "traveler"}
                      </span>
                      {activeRequest.account_status === "suspended" && (
                        <span className="badge badge-error badge-xs text-white font-bold text-[8px]">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-base-content/60 m-0">
                      User ID: <span className="font-mono">{activeRequest.user_id}</span> • Email: <span className="font-mono">{activeRequest.email || "N/A"}</span>
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {activeRequest.status === "pending" ? (
                    <button 
                      onClick={() => handleAcceptRequest(activeRequest.request_id)}
                      className="btn btn-xs btn-error text-white font-bold rounded-xl gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept & Join
                    </button>
                  ) : activeRequest.status !== "resolved" ? (
                    <button 
                      onClick={() => handleResolveRequest(activeRequest.request_id)}
                      className="btn btn-xs btn-outline btn-success font-bold rounded-xl gap-1"
                      title="Mark support ticket as resolved"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  ) : (
                    <span className="badge badge-success text-white font-bold text-xs px-2.5 py-1">
                      Resolved ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200/10">
                {isLoadingMessages ? (
                  <div className="text-center py-12 text-xs text-base-content/50">
                    <Activity className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-500" />
                    Loading support messages...
                  </div>
                ) : activeChatMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-base-content/50">
                    No messages yet in this support ticket.
                  </div>
                ) : (
                  activeChatMessages.map((msg) => {
                    const isSystem = msg.type === "system" || msg.senderId === "system";
                    const isMe = msg.senderId === currentAdminId;
                    const isAdmin = msg.senderRole === "admin" || msg.senderRole === "superadmin" || msg.senderId?.startsWith("admin");

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="bg-base-200 text-base-content/70 border border-base-300 text-[10px] py-1 px-3.5 rounded-full font-bold inline-block shadow-xs">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
                        <div className="chat-image avatar">
                          <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm">
                            <img 
                              src={msg.senderAvatar || msg.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.senderId}`} 
                              alt={msg.senderName || "Sender"} 
                            />
                          </div>
                        </div>

                        {/* Admin Badge Header - CRUCIAL for Multi-Admin Distinction */}
                        <div className="chat-header text-[10px] font-bold mb-0.5 flex items-center gap-1">
                          {isAdmin ? (
                            <span className="badge badge-xs bg-emerald-600/20 text-emerald-500 border border-emerald-500/40 font-bold gap-1 py-0.5 px-1.5">
                              <Shield className="w-2.5 h-2.5 text-emerald-500" /> [Admin] {msg.senderName || "Administrator"} {isMe ? "(You)" : ""}
                            </span>
                          ) : (
                            <span className="text-base-content/70 font-semibold">
                              {msg.senderName || activeRequest.username || "Traveler"}
                            </span>
                          )}
                        </div>

                        <div className={`chat-bubble text-xs shadow-sm leading-relaxed p-3 rounded-2xl ${
                          isMe 
                            ? "bg-emerald-600 text-white font-medium" 
                            : isAdmin 
                              ? "bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 font-medium"
                              : "bg-base-100 text-base-content border border-base-200 font-medium"
                        }`}>
                          {msg.text}
                        </div>

                        <div className="chat-footer text-[9px] text-base-content/40 mt-0.5">
                          {msg.time || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-base-200 bg-base-100 flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder={`Reply to ${activeRequest.first_name || activeRequest.username || "traveler"} as ${currentAdminName}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="input input-sm flex-1 rounded-xl text-xs bg-base-200/50 border-base-300 focus:border-emerald-500 font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!messageInput.trim() || isSending}
                  className="btn btn-sm btn-success text-white font-bold rounded-xl px-4 shadow-sm gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
