import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { MOCK_USERS, MOCK_TOUR_PLANS } from "../data/mockData";
import { getLeagueBadgeClass } from "../utils/leagueHelper";
import EditProfileModal from "../components/modals/EditProfileModal";
import EditPostModal from "../components/modals/EditPostModal";
import DeletePostModal from "../components/modals/DeletePostModal";
import { 
  User, 
  MapPin, 
  Trophy, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Compass, 
  Map, 
  Heart, 
  Calendar, 
  Star,
  ArrowRight,
  Phone,
  Tag,
  CheckCircle2, 
  Camera, 
  Mail, 
  Edit3, 
  Trash2, 
  Lock, 
  Unlock, 
  Globe, 
  PlusCircle, 
  Bookmark, 
  BookmarkX 
} from "lucide-react";

export default function UserProfile() {
  const { userId } = useParams();
  const { currentUser, updateUserProfile, addPoints } = useAuth();
  const { 
    posts, 
    updatePost, 
    deletePost, 
    togglePostVisibility, 
    toggleSavePost 
  } = usePosts();
  const navigate = useNavigate();

  // Match target user by username or id
  const isSelf = currentUser && (
    !userId || 
    currentUser.id === userId || 
    currentUser.user_id === userId || 
    currentUser.username?.toLowerCase() === userId?.toLowerCase()
  );

  const matchedUser = isSelf ? currentUser : (
    MOCK_USERS.find(u => u.id === userId || u.username.toLowerCase() === userId?.toLowerCase()) || 
    (currentUser || MOCK_USERS[0])
  );

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(matchedUser.followers || 0);

  // Active Tab: 'stories' | 'saved' | 'plans'
  const [activeTab, setActiveTab] = useState("stories");

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postActionMsg, setPostActionMsg] = useState("");

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      if (addPoints) addPoints(15);
    }
  };

  const handleSendMessage = () => {
    navigate("/chats");
  };

  // Handle Save Profile
  const handleSaveProfile = async (updatedData) => {
    await updateUserProfile(updatedData);
    if (addPoints) addPoints(20);
    setPostActionMsg("✅ Profile updated successfully!");
    setTimeout(() => setPostActionMsg(""), 2500);
  };

  // Handle Save Post
  const handleSavePost = async (postId, updatedData) => {
    await updatePost(postId, updatedData);
    setPostActionMsg("✅ Post updated successfully in MySQL database!");
    setTimeout(() => setPostActionMsg(""), 2500);
  };

  // Toggle Visibility
  const handleToggleVisibility = async (post) => {
    const nextPublic = post.isPublic === false || post.isHidden ? true : false;
    await togglePostVisibility(post.id, nextPublic);
    setPostActionMsg(nextPublic ? "🌐 Post is now Public on Social Feed!" : "🔒 Post is now Private (Hidden from Feed).");
    setTimeout(() => setPostActionMsg(""), 2500);
  };

  // Toggle Save Post
  const handleToggleSave = async (post) => {
    await toggleSavePost(post.id, currentUser);
    const willBeSaved = !post.hasSaved;
    setPostActionMsg(willBeSaved ? "🔖 Post saved to your bookmarks in MySQL!" : "🗑️ Post removed from your saved list.");
    setTimeout(() => setPostActionMsg(""), 2500);
  };

  // Confirm and Execute Delete Post
  const handleConfirmDelete = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    try {
      await deletePost(deletingPostId);
      setPostActionMsg("🗑️ Post permanently deleted from MySQL database.");
      setTimeout(() => setPostActionMsg(""), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeletingPostId(null);
    }
  };

  // User's authored tour plans & posts
  const userPlans = MOCK_TOUR_PLANS.filter(
    p => p.author?.id === matchedUser.id || 
         p.author?.user_id === matchedUser.id ||
         p.author?.username?.toLowerCase() === matchedUser.username?.toLowerCase()
  );

  // User's posts: if looking at own profile, include private ones; if viewing another user, only show public
  const userPosts = (posts || []).filter(p => {
    const isAuthor = p.author?.id === matchedUser.id || 
                     p.author?.user_id === matchedUser.id ||
                     p.author?.username?.toLowerCase() === matchedUser.username?.toLowerCase();
    if (!isAuthor) return false;
    if (isSelf) return true;
    return p.isPublic !== false && !p.isHidden;
  });

  // User's saved posts
  const savedPosts = (posts || []).filter(p => p.hasSaved);

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      {/* Toast Notification */}
      {postActionMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-info text-white text-xs font-bold shadow-xl rounded-2xl py-2 px-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{postActionMsg}</span>
          </div>
        </div>
      )}

      {/* Profile Header Banner Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden rounded-3xl">
        <div className="h-44 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-14">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative group">
              <img 
                src={matchedUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${matchedUser.username}`} 
                alt={matchedUser.name} 
                className="w-28 h-28 rounded-full border-4 border-base-100 object-cover shadow-xl bg-base-200" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${matchedUser.username || 'traveler'}`;
                }}
              />
              {isSelf && (
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
                >
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="mb-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-black m-0 leading-none">{matchedUser.name}</h1>
                <span className={`badge badge-sm ${getLeagueBadgeClass(matchedUser.league)}`}>
                  {matchedUser.league || "Explorer"}
                </span>
                {matchedUser.isAdmin && (
                  <span className="badge badge-sm badge-warning text-slate-950 font-black">Admin</span>
                )}
              </div>
              <p className="text-xs text-base-content/60 font-semibold">@{matchedUser.username}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-base-content/75">
                <span className="flex items-center gap-1 bg-base-200/60 py-0.5 px-2.5 rounded-lg font-medium">
                  <Mail className="w-3 h-3 text-primary" />
                  {matchedUser.email}
                </span>

                {(matchedUser.city || matchedUser.country) && (
                  <span className="flex items-center gap-1 bg-base-200/60 py-0.5 px-2.5 rounded-lg font-medium">
                    <MapPin className="w-3 h-3 text-secondary" />
                    {[matchedUser.city, matchedUser.country].filter(Boolean).join(", ")}
                  </span>
                )}

                {matchedUser.phone && (
                  <span className="flex items-center gap-1 bg-base-200/60 py-0.5 px-2.5 rounded-lg font-mono">
                    <Phone className="w-3 h-3 text-info" />
                    {matchedUser.phone}
                  </span>
                )}

                {matchedUser.preferredTravelType && (
                  <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 py-0.5 px-2.5 rounded-lg font-bold">
                    <Tag className="w-3 h-3" />
                    {matchedUser.preferredTravelType} Traveler
                  </span>
                )}
              </div>

              <p className="text-xs text-base-content/85 max-w-lg leading-relaxed mt-2">
                {matchedUser.bio || "Passionate backpacker & traveler exploring top destinations with Laga Tour."}
              </p>
            </div>
          </div>

          {!isSelf ? (
            <div className="flex gap-2 self-center sm:self-end">
              <button 
                onClick={handleToggleFollow}
                className={`btn btn-sm capitalize rounded-xl gap-1.5 font-bold shadow-sm ${
                  isFollowing ? "btn-neutral" : "btn-primary text-slate-900"
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4 text-success" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "Following" : "Follow User"}
              </button>
              <button 
                onClick={handleSendMessage}
                className="btn btn-sm btn-outline rounded-xl gap-1.5 font-bold"
              >
                <MessageSquare className="w-4 h-4 text-primary" /> Message
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditProfileOpen(true)} 
              className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-1.5 shadow-md self-center sm:self-end hover:scale-105 transition-transform"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}

        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-base-200 p-4 text-center bg-base-200/30 gap-2">
          <div className="leading-tight">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">League Points</span>
            <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" /> {matchedUser.points || 350}
            </span>
          </div>
          <div className="leading-tight border-l sm:border-x border-base-200">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Followers</span>
            <span className="text-lg font-black text-primary">{followerCount}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 sm:border-r border-base-200 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Following</span>
            <span className="text-lg font-black text-secondary">{matchedUser.following || 0}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 sm:border-r border-base-200 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Trips Shared</span>
            <span className="text-lg font-black text-accent">{userPosts.length}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 col-span-2 sm:col-span-1 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Account Status</span>
            <span className="text-sm font-bold text-success capitalize">{matchedUser.account_status || "Active"}</span>
          </div>
        </div>

      </div>

      {/* Authored Content Tabs & Feed */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm rounded-3xl">
        
        {/* Navigation Tabs */}
        <div className="tabs tabs-boxed rounded-none bg-base-200 border-b border-base-300 p-1 flex justify-between items-center">
          <div className="flex gap-1 overflow-x-auto">
            <button 
              onClick={() => setActiveTab("stories")}
              className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "stories" ? "tab-active bg-primary text-slate-900 font-black rounded-xl" : ""}`}
            >
              <Compass className="w-3.5 h-3.5" /> Travel Stories & Posts ({userPosts.length})
            </button>
            {isSelf && (
              <button 
                onClick={() => setActiveTab("saved")}
                className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "saved" ? "tab-active bg-primary text-slate-900 font-black rounded-xl" : ""}`}
              >
                <Bookmark className="w-3.5 h-3.5" /> Saved Posts ({savedPosts.length})
              </button>
            )}
            <button 
              onClick={() => setActiveTab("plans")}
              className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "plans" ? "tab-active bg-primary text-slate-900 font-black rounded-xl" : ""}`}
            >
              <Map className="w-3.5 h-3.5" /> Shared Tour Plans ({userPlans.length})
            </button>
          </div>

          {isSelf && (
            <button 
              onClick={() => navigate("/create-post")}
              className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl gap-1 mr-2 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Share Story
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="p-6">
          
          {/* Tab 1: Travel Stories */}
          {activeTab === "stories" && (
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="text-center py-12 text-xs text-base-content/50 border border-dashed border-base-300 rounded-2xl p-6 space-y-2">
                  <Compass className="w-10 h-10 mx-auto text-base-content/30" />
                  <p className="font-semibold text-sm">No travel stories available yet.</p>
                  {isSelf && (
                    <button 
                      onClick={() => navigate("/create-post")}
                      className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl gap-1 mt-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Post Your First Story
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPosts.map(post => {
                    const isPrivate = post.isPublic === false || post.isHidden === true;
                    const postThumb = post.image || (post.images && post.images[0]) || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";

                    return (
                      <div 
                        key={post.id} 
                        className={`card bg-base-200/60 border rounded-2xl p-4 space-y-3 transition-all ${
                          isPrivate ? "border-amber-500/40 bg-amber-500/5" : "border-base-300"
                        }`}
                      >
                        <div className="flex gap-3">
                          <img 
                            src={postThumb} 
                            alt="Post Media" 
                            className="w-24 h-24 rounded-xl object-cover bg-black/20 shrink-0 border border-base-300" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`badge badge-xs font-bold py-1 px-2 gap-1 ${
                                isPrivate ? "badge-warning text-slate-900" : "badge-success text-white"
                              }`}>
                                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                {isPrivate ? "Private (Hidden)" : "Public (Live)"}
                              </span>

                              <span className="text-[10px] text-base-content/50">{post.time || "Recent"}</span>
                            </div>

                            <p className="text-xs text-base-content/90 font-medium line-clamp-3 leading-relaxed">
                              {post.caption || "No caption provided."}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-base-content/60 pt-1">
                              <span className="flex items-center gap-1 font-semibold">
                                <Heart className="w-3 h-3 text-rose-400" /> {post.likes || 0}
                              </span>
                              <span className="flex items-center gap-1 font-semibold">
                                <MessageSquare className="w-3 h-3 text-primary" /> {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Owner Actions */}
                        {isSelf && (
                          <div className="flex items-center justify-between pt-2 border-t border-base-300/80 gap-2">
                            <button 
                              onClick={() => handleToggleVisibility(post)}
                              className={`btn btn-xs rounded-xl font-bold gap-1 ${
                                isPrivate ? "btn-outline btn-success" : "btn-outline btn-warning"
                              }`}
                            >
                              {isPrivate ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {isPrivate ? "Make Public" : "Make Private"}
                            </button>

                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingPost(post)}
                                className="btn btn-xs btn-ghost hover:bg-primary/20 text-primary font-bold rounded-xl gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>

                              <button 
                                onClick={() => setDeletingPostId(post.id)}
                                className="btn btn-xs btn-ghost hover:bg-error/20 text-error font-bold rounded-xl gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Saved Posts (For Self) */}
          {activeTab === "saved" && isSelf && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Stories bookmarked by you from other travelers.</span>
                <Link to="/" className="text-xs text-primary font-bold hover:underline flex items-center">
                  Discover more stories <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {savedPosts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl p-6 space-y-3">
                  <Bookmark className="w-10 h-10 text-amber-500 mx-auto opacity-50" />
                  <h4 className="font-bold text-sm">No Saved Posts Yet</h4>
                  <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                    You haven't saved any travel stories yet. Click the bookmark icon on any post in the Social Feed to save it here!
                  </p>
                  <Link 
                    to="/"
                    className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-1 mt-1 inline-flex"
                  >
                    <Compass className="w-4 h-4" /> Browse Social Feed
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPosts.map((post) => {
                    const postThumb = post.image || (post.images && post.images[0]) || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";

                    return (
                      <div 
                        key={post.id} 
                        className="card bg-base-200/60 border border-base-200 rounded-2xl p-4 space-y-3 hover:border-base-300 transition-colors"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={postThumb} 
                            alt="Saved Post Preview" 
                            className="w-24 h-24 rounded-xl object-cover bg-black/20 shrink-0 border border-base-300" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <img 
                                src={post.author?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author?.username || 'traveler'}`} 
                                alt={post.author?.name} 
                                className="w-5 h-5 rounded-full object-cover border border-base-300"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author?.username || 'traveler'}`;
                                }}
                              />
                              <span className="text-xs font-bold truncate">{post.author?.name || "Traveler"}</span>
                              <span className="text-[10px] text-base-content/50">@{post.author?.username || "traveler"}</span>
                            </div>

                            <p className="text-xs text-base-content/90 font-medium line-clamp-2 leading-relaxed pt-0.5">
                              {post.caption || "No caption provided."}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-base-content/60 pt-0.5">
                              <span className="flex items-center gap-1 font-semibold text-rose-500">
                                <Heart className="w-3 h-3 fill-rose-500" /> {post.likes || 0}
                              </span>
                              <span className="flex items-center gap-1 font-semibold">
                                <MessageSquare className="w-3 h-3 text-primary" /> {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-base-300/80">
                          <button 
                            onClick={() => handleToggleSave(post)}
                            className="btn btn-xs btn-error btn-outline rounded-xl font-bold gap-1 text-xs"
                          >
                            <BookmarkX className="w-3.5 h-3.5" /> Remove from Saved
                          </button>

                          <Link 
                            to="/"
                            className="btn btn-xs btn-ghost text-primary font-bold gap-1 rounded-xl"
                          >
                            View in Feed <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Tour Plans */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              {userPlans.length === 0 ? (
                <div className="text-center py-10 text-xs text-base-content/50 border border-dashed border-base-300 rounded-2xl">
                  This traveler has not shared any public tour plans yet.
                </div>
              ) : (
                userPlans.map(plan => (
                  <div key={plan.id} className="card bg-base-200 border border-base-300 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-md m-0">{plan.title}</h3>
                        <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {plan.destinationName} &nbsp;•&nbsp; 
                          <Calendar className="w-3.5 h-3.5" /> {plan.duration} Days
                        </p>
                      </div>
                      <span className="badge badge-primary py-2 px-3 font-black text-xs whitespace-nowrap shrink-0">{Number(plan.totalBudget).toLocaleString()} BDT</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {plan.placesVisited?.map((place, idx) => (
                        <span key={idx} className="badge badge-sm badge-outline text-[10px]">{place}</span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-base-300 text-xs">
                      <div className="flex items-center gap-1 text-yellow-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {plan.rating} ({plan.ratingsCount} reviews)
                      </div>
                      <Link to="/plans" className="btn btn-xs btn-ghost text-primary font-bold gap-1">
                        View Plan <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

      {/* Reusable Modals */}
      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
      />

      <EditPostModal 
        isOpen={Boolean(editingPost)}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSavePost}
      />

      <DeletePostModal 
        isOpen={Boolean(deletingPostId)}
        onClose={() => setDeletingPostId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

    </div>
  );
}
