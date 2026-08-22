import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_CHATS, MOCK_USERS } from "../data/mockData";
import { Send, Search, MessageSquare, ShieldAlert, Phone, Video, Info, User } from "lucide-react";

export default function Messaging() {
  const { currentUser, addPoints } = useAuth();
  
  const [chats, setChats] = useState(MOCK_CHATS);
  const [activeChatId, setActiveChatId] = useState(MOCK_CHATS[0].id);
  const [messageText, setMessageText] = useState("");

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      text: messageText,
      time: "Just now"
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setMessageText("");
    
    // Add point for communication
    addPoints(2);
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl h-[calc(100vh-80px)]">
      <div className="card bg-base-100 border border-base-200 shadow-sm flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Left Panel: Chats List */}
        <div className="w-full md:w-80 border-r border-base-300 flex flex-col h-2/5 md:h-full bg-base-200/20">
          
          {/* Header Search */}
          <div className="p-4 border-b border-base-300">
            <h2 className="text-lg font-black mb-3 m-0 flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-primary" /> Inbox
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search travelers..." 
                className="input input-sm input-bordered w-full pl-9 rounded-lg text-xs" 
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isActive = chat.id === activeChatId;

              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-primary text-white shadow' : 'hover:bg-base-200'}`}
                >
                  <Link 
                    to={`/profile/${chat.user.id || chat.user.username}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="hover:opacity-80 transition-opacity"
                    title={`View @${chat.user.username}'s profile`}
                  >
                    <img src={chat.user.avatar} className="w-10 h-10 rounded-full object-cover border border-base-300" alt="Avatar" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-xs truncate m-0">{chat.user.name}</h4>
                      <span className={`text-[8px] ${isActive ? 'text-white/70' : 'text-base-content/50'}`}>
                        {lastMsg ? lastMsg.time.split(",")[0] : ""}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-base-content/65'}`}>
                      {lastMsg ? lastMsg.text : "No messages"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Panel: Active Chat Stream */}
        <div className="flex-1 flex flex-col h-3/5 md:h-full justify-between bg-base-100">
          
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/10">
            <Link 
              to={`/profile/${activeChat.user.id || activeChat.user.username}`} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              title={`View @${activeChat.user.username}'s profile`}
            >
              <img src={activeChat.user.avatar} className="w-9 h-9 rounded-full object-cover border border-base-300" alt={activeChat.user.name} />
              <div>
                <h3 className="font-black text-xs leading-none m-0 hover:underline">
                  {activeChat.user.name}
                </h3>
                <span className="text-[9px] text-green-500 font-bold block mt-1">● Active now</span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <button className="btn btn-ghost btn-circle btn-sm"><Phone className="w-4 h-4" /></button>
              <button className="btn btn-ghost btn-circle btn-sm"><Video className="w-4 h-4" /></button>
              
            </div>
          </div>

          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/30">
            {activeChat.messages.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              const targetUserId = isMe ? (currentUser.id || currentUser.username) : (activeChat.user.id || activeChat.user.username);
              
              return (
                <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                  <Link to={`/profile/${targetUserId}`} className="chat-image avatar hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full border border-base-300">
                      <img src={isMe ? currentUser.avatar : activeChat.user.avatar} alt="Avatar" />
                    </div>
                  </Link>
                  <div className="chat-bubble text-xs shadow-sm leading-relaxed p-2.5 max-w-sm rounded-xl">
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
              placeholder="Type your message to traveler..." 
              className="input input-sm input-bordered flex-1 rounded-lg text-xs" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-sm btn-primary rounded-lg text-xs gap-1">
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
