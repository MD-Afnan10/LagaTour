import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS, MOCK_CHATS } from "../data/mockData";
import api from "../services/api";
import { 
  Users, 
  Search, 
  UserPlus, 
  Check, 
  X, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";

export default function CreateGroupChat() {
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState("");
  const [allPlatformUsers, setAllPlatformUsers] = useState(MOCK_USERS);

  const currentUserId = currentUser?.id || currentUser?.user_id || "user_1";

  // Fetch real platform users from backend
  useEffect(() => {
    api.searchChatUsers(searchQuery, currentUserId)
      .then((users) => {
        if (users && users.length > 0) {
          setAllPlatformUsers(users);
        } else if (!searchQuery) {
          setAllPlatformUsers(MOCK_USERS.filter(u => u.id !== currentUserId));
        }
      })
      .catch(() => {
        setAllPlatformUsers(MOCK_USERS.filter(u => u.id !== currentUserId));
      });
  }, [searchQuery, currentUserId]);

  // Available users to add (filtering out current logged in user)
  const availableUsers = allPlatformUsers.filter(u => {
    const uId = u.id || u.user_id;
    const uName = u.username?.toLowerCase();
    return uId !== currentUserId && uName !== currentUser?.username?.toLowerCase();
  });

  // Real-time filtered users as user types in the search field
  const filteredUsers = availableUsers.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = user.name || [user.first_name, user.last_name].filter(Boolean).join(" ");
    return (
      name?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      (user.bio && user.bio.toLowerCase().includes(q))
    );
  });

  const toggleMember = (user) => {
    setError("");
    const userId = user.id || user.user_id;
    const exists = selectedMembers.some(m => (m.id || m.user_id) === userId || m.username === user.username);
    if (exists) {
      setSelectedMembers(prev => prev.filter(m => (m.id || m.user_id) !== userId && m.username !== user.username));
    } else {
      setSelectedMembers(prev => [...prev, user]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Please enter a group name.");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Please add at least one member to the group chat.");
      return;
    }

    // Retrieve existing chats from localStorage or fallback to MOCK_CHATS
    const savedChats = localStorage.getItem("ts_chats");
    let chatsList = MOCK_CHATS;
    if (savedChats) {
      try {
        chatsList = JSON.parse(savedChats);
      } catch (err) {
        console.error("Failed to parse saved chats", err);
      }
    }

    const newGroupId = "group_chat_" + Date.now();
    const cleanGroupName = groupName.trim();
    const groupAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanGroupName)}`;

    const newGroupChat = {
      id: newGroupId,
      isGroup: true,
      user: {
        id: "g_" + Date.now(),
        name: cleanGroupName,
        username: cleanGroupName.toLowerCase().replace(/\s+/g, "_"),
        avatar: groupAvatar,
        isGroup: true,
        membersCount: selectedMembers.length + 1
      },
      members: [currentUser || { name: "You", username: "you" }, ...selectedMembers],
      messages: [
        {
          id: "msg_init_" + Date.now(),
          senderId: "system",
          text: `🎉 Group chat "${cleanGroupName}" created with ${selectedMembers.length + 1} members!`,
          time: "Just now"
        }
      ]
    };

    const updatedChats = [newGroupChat, ...chatsList];
    localStorage.setItem("ts_chats", JSON.stringify(updatedChats));

    const memberIds = [
      currentUserId,
      ...selectedMembers.map(m => m.id || m.user_id)
    ].filter(Boolean);

    // Try creating on backend API
    try {
      const serverRes = await api.createGroupChat({
        groupName: cleanGroupName,
        name: cleanGroupName,
        memberIds,
        creator: currentUserId,
        createdBy: currentUserId,
        avatarUrl: groupAvatar
      });

      if (serverRes && (serverRes.id || serverRes.conversationId)) {
        const finalId = serverRes.id || serverRes.conversationId;
        if (addPoints) addPoints(25);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        navigate("/chats", { state: { activeChatId: finalId } });
        return;
      }
    } catch {
      // Fallback handled smoothly
    }

    if (addPoints) addPoints(25);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Redirect to Messaging page with new active chat
    navigate("/chats", { state: { activeChatId: newGroupId } });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
      
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6 border-b border-base-200 pb-4">
        <Link to="/chats" className="btn btn-ghost btn-sm rounded-xl gap-2 font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Chats
        </Link>
        <span className="badge badge-primary font-bold text-xs px-3 py-1">New Group Page</span>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Create Group Chat
          </h1>
          <p className="text-xs text-base-content/70 leading-relaxed">
            Name your group chat and search travelers as you type to add as many members as you want (No member limits).
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-xs rounded-2xl p-3 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="space-y-6">
          
          {/* 1. Group Name Input */}
          <div className="form-control space-y-1.5">
            <label className="label py-0">
              <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                <Sparkles className="w-4 h-4 text-amber-400" /> Group Chat Name
              </span>
            </label>
            <input 
              type="text" 
              placeholder="E.g. St. Martin's Expedition Crew 🌊" 
              className="input input-bordered w-full text-xs rounded-xl h-11 bg-base-100 focus:border-primary font-medium"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* 2. Selected Members List (No Member Limit) */}
          <div className="form-control space-y-2">
            <div className="flex justify-between items-center">
              <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                <Users className="w-4 h-4 text-success" /> Selected Members ({selectedMembers.length + 1} Total)
              </span>
              <span className="text-[10px] text-success font-bold bg-success/10 px-2.5 py-1 rounded-full">
                Unlimited Members Allowed
              </span>
            </div>

            <div className="p-3 bg-base-200/50 border border-base-200 rounded-2xl min-h-[56px] flex flex-wrap gap-2 items-center">
              {/* Current User Pill */}
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary py-1 px-3 rounded-full text-xs font-bold">
                <img src={currentUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} className="w-4 h-4 rounded-full" alt="You" />
                <span>{currentUser?.name || "You"} (Admin)</span>
              </div>

              {/* Selected Members Pills */}
              {selectedMembers.map(member => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-1.5 bg-base-100 border border-base-300 py-1 pl-2.5 pr-1.5 rounded-full text-xs font-bold text-base-content/90 shadow-sm"
                >
                  <img src={member.avatar} className="w-4 h-4 rounded-full object-cover" alt={member.name} />
                  <span>{member.name}</span>
                  <button 
                    type="button" 
                    onClick={() => toggleMember(member)}
                    className="btn btn-circle btn-xs btn-ghost text-base-content/50 hover:text-error p-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {selectedMembers.length === 0 && (
                <span className="text-xs text-base-content/50 italic py-1">Search and select travelers below to add them to the group...</span>
              )}
            </div>
          </div>

          {/* 3. Search & Add People as User Types (No Member Limit) */}
          <div className="form-control space-y-3">
            <label className="label py-0 justify-between">
              <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                <UserPlus className="w-4 h-4 text-info" /> Add People (Search as you type)
              </span>
              <span className="text-[10px] text-base-content/50">{filteredUsers.length} travelers found</span>
            </label>

            {/* Real-time search field */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Type traveler name or handle (e.g. Sadia, Nabil, Aria)..." 
                className="input input-bordered w-full pl-10 text-xs rounded-xl h-11 bg-base-100 focus:border-info"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-base-content/40 hover:text-base-content text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtered Users List */}
            <div className="max-h-72 overflow-y-auto space-y-2 border border-base-200 p-2 rounded-2xl bg-base-200/20">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-base-content/50">
                  No travelers found matching "{searchQuery}".
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedMembers.some(m => m.id === user.id || m.username === user.username);

                  return (
                    <div 
                      key={user.id}
                      onClick={() => toggleMember(user)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-base-100 border-base-200 hover:border-base-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-base-300" alt={user.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-base-content truncate">{user.name}</span>
                            <span className="badge badge-xs badge-outline text-[9px] opacity-75">{user.league || "Explorer"}</span>
                          </div>
                          <span className="text-[10px] text-base-content/50 block truncate">@{user.username}</span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMember(user);
                        }}
                        className={`btn btn-xs rounded-lg font-bold gap-1 ${
                          isSelected ? "btn-success text-white" : "btn-outline btn-primary"
                        }`}
                      >
                        {isSelected ? <><Check className="w-3.5 h-3.5" /> Added</> : <><UserPlus className="w-3.5 h-3.5" /> Add</>}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-base-200">
            <Link to="/chats" className="btn btn-ghost btn-md rounded-2xl flex-1 text-xs font-bold">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary btn-md rounded-2xl flex-[2] text-xs font-bold gap-2 text-white shadow-lg shadow-primary/20"
            >
              <CheckCircle className="w-4 h-4" /> Create Group Chat
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
