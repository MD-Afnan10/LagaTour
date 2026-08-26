import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_CHATS } from "../data/mockData";
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
  Plus
} from "lucide-react";

export default function Messaging() {
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [searchInbox, setSearchInbox] = useState("");

  // Sync state if navigation state changes
  useEffect(() => {
    if (location.state?.activeChatId) {
      setActiveChatId(location.state.activeChatId);
    }
  }, [location.state]);

  // Sync chats to localStorage
  useEffect(() => {
    localStorage.setItem("ts_chats", JSON.stringify(chats));
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name || "You",
      text: messageText.trim(),
      time: "Just now"
    };

    const updatedChats = chats.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    setMessageText("");
    
    // Add points for active communication
    addPoints(2);
  };

  // Filter chats list in sidebar
  const filteredChats = chats.filter(c => {
    const q = searchInbox.toLowerCase().trim();
    if (!q) return true;
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl h-[calc(100vh-80px)]">
      <div className="card bg-base-100 border border-base-200 shadow-sm flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Left Panel: Chats List & Create Group Button */}
        <div className="w-full md:w-80 border-r border-base-300 flex flex-col h-2/5 md:h-full bg-base-200/20">
          
          {/* Header & Dedicated Create Group Button */}
          <div className="p-4 border-b border-base-300 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black m-0 flex items-center gap-1.5 text-base-content">
                <MessageSquare className="w-5 h-5 text-primary" /> Inbox
              </h2>

              {/* Button to navigate to New Group Creation Page */}
              <button 
                onClick={() => navigate("/chats/create-group")}
                className="btn btn-xs btn-primary font-bold text-white rounded-xl gap-1 shadow-sm px-2.5"
                title="Create a new group chat"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create Group</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="input input-sm input-bordered w-full pl-9 rounded-lg text-xs" 
                value={searchInbox}
                onChange={(e) => setSearchInbox(e.target.value)}
              />
            </div>
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-xs text-base-content/50">
                No chats found.
              </div>
            ) : (
              filteredChats.map(chat => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const isActive = chat.id === activeChatId;

                return (
                  <div 
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isActive ? 'bg-primary text-white shadow' : 'hover:bg-base-200'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={chat.user.avatar} 
                        className="w-10 h-10 rounded-full object-cover border border-base-300" 
                        alt={chat.user.name} 
                      />
                      {chat.isGroup && (
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border border-white">
                          <Users className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-1 min-w-0">
                          <h4 className="font-bold text-xs truncate m-0">{chat.user.name}</h4>
                          {chat.isGroup && (
                            <span className={`badge badge-xs text-[8px] font-bold ${isActive ? 'bg-white/20 text-white border-none' : 'badge-warning'}`}>
                              Group
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] shrink-0 ml-1 ${isActive ? 'text-white/70' : 'text-base-content/50'}`}>
                          {lastMsg ? lastMsg.time.split(",")[0] : ""}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-base-content/65'}`}>
                        {lastMsg ? lastMsg.text : "No messages"}
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
          <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/10">
            <div className="flex items-center gap-3">
              <img 
                src={activeChat.user.avatar} 
                className="w-9 h-9 rounded-full object-cover border border-base-300" 
                alt={activeChat.user.name} 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xs leading-none m-0">
                    {activeChat.user.name}
                  </h3>
                  {activeChat.isGroup && (
                    <span className="badge badge-warning badge-xs font-bold text-[9px]">
                      Group ({activeChat.members?.length || activeChat.user.membersCount || 2} members)
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-green-500 font-bold block mt-1">
                  ● {activeChat.isGroup ? "Group Active" : "Active now"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="btn btn-ghost btn-circle btn-sm"><Phone className="w-4 h-4" /></button>
              <button className="btn btn-ghost btn-circle btn-sm"><Video className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/30">
            {activeChat.messages.map(msg => {
              const isMe = msg.senderId === currentUser?.id || msg.senderId === "me";
              const isSystem = msg.senderId === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-3">
                    <span className="bg-base-200 text-base-content/70 border border-base-300 text-[10px] py-1 px-3 rounded-full font-medium inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                  <div className="chat-image avatar">
                    <div className="w-8 h-8 rounded-full border border-base-300">
                      <img src={isMe ? currentUser?.avatar : activeChat.user.avatar} alt="Avatar" />
                    </div>
                  </div>
                  {activeChat.isGroup && !isMe && msg.senderName && (
                    <div className="chat-header text-[9px] text-base-content/60 font-bold mb-0.5">
                      {msg.senderName}
                    </div>
                  )}
                  <div className={`chat-bubble text-xs shadow-sm leading-relaxed p-2.5 max-w-sm rounded-xl ${
                    isMe ? 'bg-primary text-white' : 'bg-base-100 text-base-content border border-base-200'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="chat-footer text-[8px] opacity-50 mt-1">
                    {msg.time}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-base-300 bg-base-100 flex gap-2 items-center">
            <input 
              type="text" 
              placeholder={`Message ${activeChat.user.name}...`} 
              className="input input-sm input-bordered flex-1 rounded-lg text-xs bg-base-100 focus:border-primary" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-sm btn-primary text-white rounded-lg text-xs gap-1">
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
