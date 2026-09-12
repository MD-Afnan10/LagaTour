import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getLeagueBadgeClass } from "../../utils/leagueHelper";
import { 
  X, 
  Search, 
  Users, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Loader2, 
  Sparkles
} from "lucide-react";

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  userName = "Traveler",
  initialTab = "followers",
  onFollowChange = null
}) {
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab || "followers");
  const [searchQuery, setSearchQuery] = useState("");
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const currentUserId = currentUser?.id || currentUser?.user_id;

  useEffect(() => {
    setActiveTab(initialTab || "followers");
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getFollowers(userId, currentUserId).catch(() => ({ followers: [] })),
      api.getFollowing(userId, currentUserId).catch(() => ({ following: [] }))
    ]).then(([followersRes, followingRes]) => {
      if (isMounted) {
        setFollowersList(followersRes?.followers || []);
        setFollowingList(followingRes?.following || []);
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, currentUserId]);

  if (!isOpen) return null;

  const currentList = activeTab === "followers" ? followersList : followingList;

  const filteredList = currentList.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      user.name?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      user.city?.toLowerCase().includes(q) ||
      user.bio?.toLowerCase().includes(q)
    );
  });

  const handleToggleFollowUser = async (targetUser) => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    const targetId = targetUser.id || targetUser.user_id;
    const prevFollowing = targetUser.isFollowing;
    const nextFollowing = !prevFollowing;

    const updateListItem = (u) => {
      if (u.id === targetId || u.user_id === targetId) {
        return {
          ...u,
          isFollowing: nextFollowing,
          followersCount: nextFollowing ? (u.followersCount || 0) + 1 : Math.max(0, (u.followersCount || 1) - 1)
        };
      }
      return u;
    };

    setFollowersList(prev => prev.map(updateListItem));
    setFollowingList(prev => prev.map(updateListItem));

    if (nextFollowing && addPoints) {
      addPoints(15);
    }

    setActionFeedback(nextFollowing ? "Following @" + targetUser.username : "Unfollowed @" + targetUser.username);
    setTimeout(() => setActionFeedback(""), 2000);

    try {
      const res = await api.toggleFollowUser(targetId, currentUserId);
      if (onFollowChange) onFollowChange(res);
    } catch (err) {
      console.warn("Follow toggle cached:", err.message);
    }
  };

  const handleOpenDirectChat = (targetUser) => {
    onClose();
    navigate("/chats", { state: { targetUser } });
  };

  const handleNavigateProfile = (username) => {
    onClose();
    navigate("/profile/" + username);
  };

  return (
    <div className="modal modal-open z-[999]">
      <div className="modal-box max-w-lg rounded-3xl p-6 border border-base-300 bg-base-100 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-base-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black m-0 text-base-content leading-tight">
                {userName}&apos;s Connections
              </h3>
              <span className="text-[11px] text-base-content/60">
                Live traveler network on LagaTour
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-base-200 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab("followers")}
            className={"flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (activeTab === "followers" ? "bg-base-100 text-primary shadow-sm font-black" : "text-base-content/70 hover:text-base-content")}
          >
            <span>Followers</span>
            <span className="badge badge-sm badge-ghost text-[10px] font-bold">
              {followersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("following")}
            className={"flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (activeTab === "following" ? "bg-base-100 text-secondary shadow-sm font-black" : "text-base-content/70 hover:text-base-content")}
          >
            <span>Following</span>
            <span className="badge badge-sm badge-ghost text-[10px] font-bold">
              {followingList.length}
            </span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={"Search " + activeTab + "... (e.g. name or @username)"}
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="btn btn-xs btn-ghost btn-circle absolute right-2 top-1.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="alert alert-success py-1.5 px-3 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* User List Container */}
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-primary gap-2">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-bold text-base-content/60">Loading connection network...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-10 bg-base-200/40 rounded-2xl border border-dashed border-base-300 p-6 space-y-2">
              <Users className="w-9 h-9 text-base-content/30 mx-auto" />
              <h4 className="text-xs font-bold text-base-content/80 m-0">
                {searchQuery ? `No ${activeTab} match "${searchQuery}"` : `No ${activeTab} yet`}
              </h4>
              <p className="text-[11px] text-base-content/50 max-w-xs mx-auto m-0">
                {activeTab === "followers"
                  ? "When other travelers follow this profile, they will appear here."
                  : "Discover and follow creators, backpackers, and friends across Bangladesh!"}
              </p>
            </div>
          ) : (
            filteredList.map((traveler, idx) => {
              const travelerId = traveler.id || traveler.user_id;
              const isCurrentUser = currentUserId && (travelerId === currentUserId);

              return (
                <div
                  key={travelerId || idx}
                  className="p-3 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-200 flex items-center justify-between gap-3 transition-colors"
                >
                  {/* Avatar & User Info */}
                  <div
                    onClick={() => handleNavigateProfile(traveler.username)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <img
                      src={traveler.avatar || ("https://api.dicebear.com/7.x/adventurer/svg?seed=" + traveler.username)}
                      alt={traveler.name}
                      className="w-10 h-10 rounded-full object-cover border border-base-300 shrink-0 bg-base-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=" + (traveler.username || "traveler");
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-base-content hover:underline truncate">
                          {traveler.name}
                        </span>
                        <span className={"badge badge-xs text-[9px] " + getLeagueBadgeClass(traveler.league)}>
                          {traveler.league || "Explorer"}
                        </span>
                      </div>
                      <span className="text-[11px] text-base-content/50 block truncate">
                        @{traveler.username} {traveler.city ? "• " + traveler.city : ""}
                      </span>
                      {traveler.bio && (
                        <p className="text-[10px] text-base-content/70 truncate m-0 mt-0.5">
                          {traveler.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCurrentUser && (
                      <>
                        <button
                          onClick={() => handleToggleFollowUser(traveler)}
                          className={"btn btn-xs rounded-xl font-bold gap-1 transition-all " + (traveler.isFollowing ? "btn-neutral border border-base-300 text-xs" : "btn-primary text-slate-900 shadow-sm text-xs")}
                        >
                          {traveler.isFollowing ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-success" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenDirectChat(traveler)}
                          className="btn btn-xs btn-circle btn-ghost border border-base-300 hover:border-primary/50 text-base-content/70 hover:text-primary"
                          title="Direct Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isCurrentUser && (
                      <span className="badge badge-ghost badge-sm text-[10px] font-bold text-base-content/50">
                        You
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="modal-action border-t border-base-200 pt-3 m-0 flex justify-between items-center text-[11px] text-base-content/50">
          <span>✨ Earn +15 League Points when travelers follow you</span>
          <button onClick={onClose} className="btn btn-sm btn-ghost rounded-xl text-xs font-bold">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
