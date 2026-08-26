import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { MOCK_TOUR_PLANS } from "../data/mockData";
import { getLeagueProgress } from "../utils/leagueHelper";
import EditProfileModal from "../components/modals/EditProfileModal";
import EditPostModal from "../components/modals/EditPostModal";
import DeletePostModal from "../components/modals/DeletePostModal";
import { 
  Trophy, 
  MapPin, 
  BookOpen, 
  Star, 
  Award, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  Compass, 
  Mail, 
  Phone, 
  Globe, 
  Tag, 
  CheckCircle2, 
  Edit3,
  Camera,
  Heart,
  MessageCircle,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  Bookmark,
  BookmarkX,
  ArrowRight
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, updateUserProfile, addPoints } = useAuth();
  const { 
    posts, 
    updatePost, 
    deletePost, 
    togglePostVisibility, 
    toggleSavePost 
  } = usePosts();
  const navigate = useNavigate();

  // Active section tab: 'my_posts' | 'saved_posts' | 'plans'
  const [activeTab, setActiveTab] = useState("my_posts");
  
  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postActionMsg, setPostActionMsg] = useState("");

  if (!currentUser) return null;

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

  // Toggle Single Post Visibility
  const handleToggleVisibility = async (post) => {
    const nextPublic = post.isPublic === false || post.isHidden ? true : false;
    await togglePostVisibility(post.id, nextPublic);
    setPostActionMsg(nextPublic ? "🌐 Post is now Public on Social Feed!" : "🔒 Post is now Private (Hidden from Feed).");
    setTimeout(() => setPostActionMsg(""), 2500);
  };

  // Toggle Save on Post
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

  const { percent, remaining, next } = getLeagueProgress(currentUser.points || 0);

  // User posts authored by currentUser
  const myPosts = (posts || []).filter(
    p => p.author?.id === currentUser.id || 
         p.author?.user_id === currentUser.id || 
         p.author?.username?.toLowerCase() === currentUser.username?.toLowerCase()
  );

  // User's Saved / Bookmarked Posts
  const savedPosts = (posts || []).filter(p => p.hasSaved);

  // Dynamic Activity Monthly Data
  const currentMonthIdx = new Date().getMonth();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const monthlyActivity = Array.from({ length: 6 }).map((_, i) => {
    const mIdx = (currentMonthIdx - 5 + i + 12) % 12;
    const baseCount = (i === 5) 
      ? Math.max(1, (currentUser.stats?.trips || 0) + myPosts.length) 
      : Math.floor((i + 1) * 1.5);
    return {
      month: monthNames[mIdx],
      count: baseCount,
      isCurrent: i === 5
    };
  });

  const maxActivityCount = Math.max(...monthlyActivity.map(m => m.count), 6);
  const savedPlans = MOCK_TOUR_PLANS.filter(p => p.likes > 50);

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

      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-2 card bg-base-100 border border-base-200 p-6 shadow-sm flex flex-col justify-between rounded-3xl">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            <div className="relative group">
              <img 
                src={currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`} 
                alt={currentUser.name} 
                className="w-24 h-24 rounded-2xl border-4 border-amber-400/40 object-cover shadow-xl bg-base-200" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`;
                }}
              />
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-bold"
              >
                <Camera className="w-5 h-5 text-amber-400" />
                <span>Change</span>
              </button>
              <span className="badge badge-xs badge-success absolute -bottom-1 -right-1 p-1 border-2 border-base-100" title="Active"></span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl font-black m-0 leading-none">{currentUser.name}</h2>
                    {currentUser.isAdmin && (
                      <span className="badge badge-sm badge-warning font-black text-slate-900">Admin</span>
                    )}
                  </div>
                  <span className="text-xs text-base-content/60 block mt-1 font-semibold">@{currentUser.username}</span>
                </div>

                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-1.5 shadow-md hover:scale-105 transition-transform"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              </div>

              {/* Extended User Table Attributes */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-base-content/80">
                <span className="flex items-center gap-1 bg-base-200 py-1 px-2.5 rounded-lg font-medium">
                  <Mail className="w-3.5 h-3.5 text-primary" /> {currentUser.email}
                </span>

                {(currentUser.city || currentUser.country) && (
                  <span className="flex items-center gap-1 bg-base-200 py-1 px-2.5 rounded-lg font-medium">
                    <MapPin className="w-3.5 h-3.5 text-secondary" /> 
                    {[currentUser.city, currentUser.country].filter(Boolean).join(", ")}
                  </span>
                )}

                {currentUser.phone && (
                  <span className="flex items-center gap-1 bg-base-200 py-1 px-2.5 rounded-lg font-mono">
                    <Phone className="w-3.5 h-3.5 text-info" /> {currentUser.phone}
                  </span>
                )}

                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 py-1 px-2.5 rounded-lg font-bold">
                  <Tag className="w-3.5 h-3.5" /> {currentUser.preferredTravelType || "Solo"} Traveler
                </span>
              </div>

              <p className="text-xs text-base-content/75 leading-relaxed pt-1">
                {currentUser.bio || "Passionate backpacker & traveler exploring top destinations with Laga Tour."}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 border-t border-base-200 pt-4 mt-6 text-center">
            <div className="leading-tight">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Trips Shared</span>
              <span className="text-xl font-black text-primary">{myPosts.length}</span>
            </div>
            <div className="leading-tight border-l border-base-200">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Saved Posts</span>
              <span className="text-xl font-black text-amber-500">{savedPosts.length}</span>
            </div>
            <div className="leading-tight border-l border-base-200">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Followers</span>
              <span className="text-xl font-black text-secondary">{currentUser.followers || 0}</span>
            </div>
            <div className="leading-tight border-l border-base-200">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Following</span>
              <span className="text-xl font-black text-accent">{currentUser.following || 0}</span>
            </div>
          </div>
        </div>

        {/* Score & League Progress */}
        <div className="card bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-base-200 p-6 shadow-sm flex flex-col justify-between rounded-3xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-base-content/60">My Rank</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2.5 rounded-2xl border border-amber-500/30">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <div className="leading-none text-left">
                <span className="text-xs font-bold text-base-content/50">Traveler League</span>
                <span className="text-2xl font-black block mt-1.5">{currentUser.league || "Explorer"}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{currentUser.points || 0} pts</span>
                <span className="text-base-content/50">{next}</span>
              </div>
              <progress className="progress progress-primary w-full h-2.5" value={percent} max="100"></progress>
              <span className="text-[10px] text-base-content/50 block mt-1">
                {remaining > 0 ? `${remaining} pts needed for next league` : "Max Rank reached!"}
              </span>
            </div>
          </div>

          <div className="bg-base-200/50 p-3 rounded-2xl border border-base-200 flex items-center justify-between text-xs mt-4">
            <span className="flex items-center gap-1.5 font-bold"><Sparkles className="w-4 h-4 text-amber-400" /> Account Status</span>
            <span className="badge badge-sm badge-success font-bold capitalize">{currentUser.account_status || "Active"}</span>
          </div>
        </div>

      </div>

      {/* Analytics & Saved Itineraries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Activity Summary Component */}
        <div className="card bg-base-100 border border-base-200 p-6 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Activity Summary
            </h3>
            <span className="badge badge-xs badge-neutral text-[9px] py-1 px-2">Last 6 Months</span>
          </div>
          
          <div className="h-44 flex items-end justify-between gap-2.5 pt-6 pb-2 px-1 border-b border-base-200">
            {monthlyActivity.map((item, idx) => {
              const heightPercent = Math.max(15, Math.round((item.count / maxActivityCount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <span className="text-[9px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                    {item.count} acts
                  </span>
                  
                  <div className="w-full bg-base-200 rounded-t-xl h-28 flex items-end overflow-hidden p-0.5">
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 shadow-sm ${
                        item.isCurrent 
                          ? "bg-gradient-to-t from-amber-500 to-orange-400 shadow-amber-500/20" 
                          : "bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-amber-600 group-hover:to-amber-400"
                      }`}
                    />
                  </div>

                  <span className={`text-[10px] font-bold ${item.isCurrent ? "text-amber-400 font-black" : "text-base-content/60"}`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-base-200/50 p-2.5 rounded-xl border border-base-200 text-left leading-tight">
              <span className="text-[10px] text-base-content/50 block font-semibold">Travel Stories</span>
              <span className="text-sm font-black text-amber-400 flex items-center gap-1 mt-0.5">
                <Compass className="w-3.5 h-3.5" /> {myPosts.length} Posts
              </span>
            </div>

            <div className="bg-base-200/50 p-2.5 rounded-xl border border-base-200 text-left leading-tight">
              <span className="text-[10px] text-base-content/50 block font-semibold">Saved Posts</span>
              <span className="text-sm font-black text-amber-500 flex items-center gap-1 mt-0.5">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500" /> {savedPosts.length} Saved
              </span>
            </div>
          </div>
        </div>

        {/* Saved Tour Plans List */}
        <div className="md:col-span-2 card bg-base-100 border border-base-200 p-6 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary" /> Bookmarked Tour Plans
            </h3>
            <Link to="/plans" className="text-xs text-primary font-bold hover:underline flex items-center">
              Explore all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {savedPlans.map(plan => (
              <div key={plan.id} className="p-3 bg-base-200/60 rounded-2xl flex items-center justify-between border border-base-200 hover:border-base-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center font-bold text-amber-500">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-none m-0">{plan.title}</h4>
                    <span className="text-[10px] text-base-content/50 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-primary" /> {plan.destinationName} • {plan.duration} Days
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-xs font-black text-primary block">{Number(plan.totalBudget).toLocaleString()} BDT</span>
                  <span className="text-[10px] text-yellow-500 flex items-center justify-end gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {plan.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* TABBED INTERFACE: MY POSTS & SAVED POSTS & TOUR PLANS */}
      {/* ======================================================== */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="tabs tabs-boxed rounded-none bg-base-200 border-b border-base-300 p-1 flex justify-between items-center">
          <div className="flex gap-1 overflow-x-auto">
            <button 
              onClick={() => setActiveTab("my_posts")}
              className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "my_posts" ? "tab-active bg-primary text-slate-900 font-black rounded-xl shadow-sm" : ""}`}
            >
              <Compass className="w-3.5 h-3.5" /> My Stories ({myPosts.length})
            </button>
            <button 
              onClick={() => setActiveTab("saved_posts")}
              className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "saved_posts" ? "tab-active bg-primary text-slate-900 font-black rounded-xl shadow-sm" : ""}`}
            >
              <Bookmark className="w-3.5 h-3.5" /> Saved Posts ({savedPosts.length})
            </button>
            <button 
              onClick={() => setActiveTab("plans")}
              className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "plans" ? "tab-active bg-primary text-slate-900 font-black rounded-xl shadow-sm" : ""}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Saved Tour Plans ({savedPlans.length})
            </button>
          </div>

          <button 
            onClick={() => navigate("/create-post")}
            className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl gap-1 mr-2 shrink-0 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Share Story
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6">
          
          {/* TAB 1: MY POSTS */}
          {activeTab === "my_posts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Manage your published travel stories and visibility in MySQL.</span>
              </div>

              {myPosts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl p-6 space-y-3">
                  <Compass className="w-10 h-10 text-primary mx-auto opacity-50" />
                  <h4 className="font-bold text-sm">No Travel Posts Yet</h4>
                  <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                    You haven't posted any travel stories. Share your adventures with photos and videos!
                  </p>
                  <button 
                    onClick={() => navigate("/create-post")}
                    className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-1 mt-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Create First Post
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPosts.map((post) => {
                    const isPrivate = post.isPublic === false || post.isHidden === true;
                    const postThumb = post.image || (post.images && post.images[0]) || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";

                    return (
                      <div 
                        key={post.id} 
                        className={`card bg-base-200/60 border rounded-2xl p-4 space-y-3 transition-all ${
                          isPrivate ? "border-amber-500/40 bg-amber-500/5" : "border-base-200 hover:border-base-300"
                        }`}
                      >
                        <div className="flex gap-3">
                          <img 
                            src={postThumb} 
                            alt="Post Thumbnail" 
                            className="w-20 h-20 rounded-xl object-cover bg-black/20 shrink-0 border border-base-300" 
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

                            <p className="text-xs text-base-content/90 font-medium line-clamp-2 leading-relaxed">
                              {post.caption || "No caption provided."}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-base-content/60 pt-0.5">
                              <span className="flex items-center gap-1 font-semibold">
                                <Heart className="w-3 h-3 text-rose-400" /> {post.likes || 0}
                              </span>
                              <span className="flex items-center gap-1 font-semibold">
                                <MessageCircle className="w-3 h-3 text-primary" /> {post.comments?.length || 0}
                              </span>
                              {post.destination && (
                                <span className="flex items-center gap-0.5 text-base-content/50 truncate max-w-[100px]">
                                  <MapPin className="w-3 h-3" /> {post.destination}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-base-300/80 gap-2">
                          <button 
                            onClick={() => handleToggleVisibility(post)}
                            className={`btn btn-xs rounded-xl font-bold gap-1 ${
                              isPrivate ? "btn-outline btn-success" : "btn-outline btn-warning"
                            }`}
                            title={isPrivate ? "Make Public (Visible on Feed)" : "Make Private (Hide from Feed)"}
                          >
                            {isPrivate ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {isPrivate ? "Make Public" : "Make Private"}
                          </button>

                          <div className="flex items-center gap-1.5">
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED POSTS */}
          {activeTab === "saved_posts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Travel posts bookmarked by you for future travel inspiration.</span>
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
                                <MessageCircle className="w-3 h-3 text-primary" /> {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Unsave & View Post Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-base-300/80">
                          <button 
                            onClick={() => handleToggleSave(post)}
                            className="btn btn-xs btn-error btn-outline rounded-xl font-bold gap-1 text-xs"
                            title="Remove from saved bookmarks"
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

          {/* TAB 3: SAVED PLANS */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Curated tour itineraries and travel packages you have bookmarked.</span>
                <Link to="/plans" className="text-xs text-primary font-bold hover:underline flex items-center">
                  Explore all plans <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPlans.map(plan => (
                  <div key={plan.id} className="p-4 bg-base-200/60 rounded-2xl flex items-center justify-between border border-base-200 hover:border-base-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 shrink-0">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs leading-tight m-0">{plan.title}</h4>
                        <span className="text-[10px] text-base-content/50 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-primary" /> {plan.destinationName} • {plan.duration} Days
                        </span>
                        <span className="text-[10px] text-yellow-500 flex items-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {plan.rating}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs font-black text-primary block">{Number(plan.totalBudget).toLocaleString()} BDT</span>
                      <Link to="/plans" className="btn btn-xs btn-primary text-slate-900 font-bold rounded-lg mt-1.5">
                        View Plan
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
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
