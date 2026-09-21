import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminPostModal from "../components/modals/AdminPostModal";
import AdminPostDetailsModal from "../components/modals/AdminPostDetailsModal";
import { 
  FileText, 
  Search, 
  PlusCircle, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  RefreshCw,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShieldAlert,
  AlertCircle,
  Copy,
  Check,
  Video as VideoIcon,
  Image as ImageIcon
} from "lucide-react";

export default function AdminPosts() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  // Notifications
  const [toastMsg, setToastMsg] = useState("");
  const [toastErr, setToastErr] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setToastErr("");
    try {
      const res = await api.getAdminPosts({
        search: searchTerm,
        visibility: visibilityFilter
      });
      if (res.success && Array.isArray(res.posts)) {
        setPosts(res.posts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      setToastErr(err.message || "Failed to fetch posts from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, visibilityFilter]);

  const handleCopyId = (postId) => {
    if (postId) {
      navigator.clipboard?.writeText(postId);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (post) => {
    const isCurrentlyPublic = Boolean(post.isPublic) && !post.isHidden;
    const newIsPublic = !isCurrentlyPublic;
    const postId = post.id || post.post_id;

    try {
      await api.togglePostVisibility(postId, newIsPublic);
      setToastMsg(
        newIsPublic 
          ? `👁️ Post ${postId} is now visible on the community social feed.` 
          : `🙈 Post ${postId} has been hidden from public community feed.`
      );

      // Update state locally
      setPosts(prev => prev.map(p => (p.id === postId || p.post_id === postId ? { ...p, isPublic: newIsPublic, isHidden: !newIsPublic } : p)));
      if (selectedPostDetails && (selectedPostDetails.id === postId || selectedPostDetails.post_id === postId)) {
        setSelectedPostDetails(prev => ({ ...prev, isPublic: newIsPublic, isHidden: !newIsPublic }));
      }
    } catch (err) {
      console.error("Toggle visibility error:", err);
      setToastErr(err.message || "Failed to update post visibility.");
    }
  };

  // Save Post (Create or Edit)
  const handleSavePost = async (postData) => {
    try {
      if (editingPost) {
        const id = editingPost.id || editingPost.post_id;
        await api.updateAdminPost(id, postData);
        setToastMsg(`✅ Updated post ${id} successfully.`);
      } else {
        await api.createAdminPost(postData);
        setToastMsg(`✅ Published new official post to traveler community feed!`);
      }
      setIsCreateModalOpen(false);
      setEditingPost(null);
      await fetchPosts();
    } catch (err) {
      console.error("Save post error:", err);
      setToastErr(err.message || "Failed to save post.");
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    const postId = postToDelete.id || postToDelete.post_id;

    try {
      await api.deletePostByAdmin(postId);
      setToastMsg(`🗑️ Post ${postId} deleted permanently from database.`);
      setPostToDelete(null);
      setPosts(prev => prev.filter(p => p.id !== postId && p.post_id !== postId));
      if (selectedPostDetails && (selectedPostDetails.id === postId || selectedPostDetails.post_id === postId)) {
        setSelectedPostDetails(null);
      }
    } catch (err) {
      console.error("Delete post error:", err);
      setToastErr(err.message || "Failed to delete post.");
    }
  };

  // Statistics
  const postStats = useMemo(() => {
    const total = posts.length;
    const pub = posts.filter(p => Boolean(p.isPublic) && !p.isHidden).length;
    const hidden = posts.filter(p => !Boolean(p.isPublic) || p.isHidden).length;
    const mediaCount = posts.reduce((acc, p) => acc + (p.media?.length || (p.image ? 1 : 0)), 0);
    return { total, pub, hidden, mediaCount };
  }, [posts]);

  // Auth Protection Check
  const isUserAdmin = Boolean(
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

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Admin Authorization Required</h2>
        <p className="text-xs text-base-content/80">Only authorized platform administrators can manage community posts.</p>
        <button onClick={() => navigate("/admin")} className="btn btn-warning btn-sm rounded-xl font-bold text-xs">
          Return to Admin Portal
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-xs text-secondary font-bold hover:underline">
              ← Admin Portal
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2 text-base-content/95">
            <FileText className="w-7 h-7 text-secondary" /> Community Posts & Feed Moderation
          </h1>
          <p className="text-xs text-base-content/75 mt-0.5">
            Search with Post ID, User ID, Username, or Caption. Inspect full post details, toggle visibility (hide/unhide), or publish official announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            disabled={isLoading}
            className="btn btn-sm btn-ghost bg-base-200 text-base-content/80 hover:text-base-content rounded-xl text-xs font-bold gap-1.5"
            title="Reload from MySQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-secondary" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setEditingPost(null);
              setIsCreateModalOpen(true);
            }}
            className="btn btn-sm btn-secondary rounded-xl text-xs font-bold gap-1.5 text-white shadow-md"
          >
            <PlusCircle className="w-4 h-4" /> Publish Announcement
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMsg && (
        <div className="alert alert-success bg-success/15 border border-success/30 text-success text-xs py-2.5 px-4 rounded-2xl flex justify-between items-center animate-in fade-in">
          <span className="font-bold">{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="btn btn-ghost btn-xs text-success p-0">✕</button>
        </div>
      )}
      {toastErr && (
        <div className="alert alert-error bg-error/15 border border-error/30 text-error text-xs py-2.5 px-4 rounded-2xl flex justify-between items-center animate-in fade-in">
          <span className="font-bold">{toastErr}</span>
          <button onClick={() => setToastErr("")} className="btn btn-ghost btn-xs text-error p-0">✕</button>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Total Feed Posts</span>
          <span className="text-2xl font-black text-secondary mt-1 block font-mono">{postStats.total}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Public / Visible</span>
          <span className="text-2xl font-black text-success mt-1 block font-mono">{postStats.pub}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Hidden / Moderated</span>
          <span className="text-2xl font-black text-warning mt-1 block font-mono">{postStats.hidden}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Media Files Linked</span>
          <span className="text-2xl font-black text-primary mt-1 block font-mono">{postStats.mediaCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card bg-base-100 border border-base-200 p-4 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Search Box: Post ID, User ID, Username, Caption */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search with Post ID, User ID, @username, or Caption keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm h-10 w-full pl-10 pr-4 bg-base-200/60 border-base-300 rounded-xl text-xs font-mono focus:border-secondary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>

          {/* Visibility Filter */}
          <div className="sm:col-span-4">
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="select select-sm h-10 w-full bg-base-200/60 border-base-300 rounded-xl text-xs"
            >
              <option value="All">All Visibility Statuses</option>
              <option value="Public">Public Only</option>
              <option value="Hidden">Hidden Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Posts Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <span className="loading loading-spinner loading-md text-secondary"></span>
            <p className="text-xs text-base-content/70">Fetching community posts from database...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-base-content/30 mx-auto" />
            <p className="font-bold text-sm text-base-content/90">No posts found</p>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto">
              No feed posts matched your search "{searchTerm}". Try another post ID, user ID, or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setVisibilityFilter("All");
              }}
              className="btn btn-xs btn-outline rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/60 text-base-content/75 text-[11px] uppercase border-b border-base-200">
                <tr>
                  <th className="py-3 px-4">Media</th>
                  <th className="py-3 px-4">Post ID</th>
                  <th className="py-3 px-4">Author & User ID</th>
                  <th className="py-3 px-4">Caption & Tag</th>
                  <th className="py-3 px-4 text-center">Engagement</th>
                  <th className="py-3 px-4 text-center">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {posts.map((p) => {
                  const postId = p.id || p.post_id;
                  const author = p.author || p.user || {};
                  const authorId = author.id || author.user_id || p.user_id;
                  const isPublic = Boolean(p.isPublic) && !p.isHidden;

                  // Find media thumbnail
                  const firstMedia = p.media && p.media[0];
                  const thumbnail = firstMedia?.url || p.image || (p.images && p.images[0]);
                  const isVideo = firstMedia?.type === "video" || p.video;

                  return (
                    <tr key={postId} className="hover:bg-base-200/40 transition-colors">
                      
                      {/* Media Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black border border-base-300 flex items-center justify-center shrink-0">
                          {isVideo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-1">
                              <VideoIcon className="w-5 h-5 text-error" />
                              <span className="text-[8px] font-bold">Video</span>
                            </div>
                          ) : thumbnail ? (
                            <img src={thumbnail} alt="Post thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[9px] font-bold text-base-content/50 text-center p-1">
                              Text
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Post ID with Copy */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-base-200 text-base-content/85 px-2 py-0.5 rounded text-[11px] border border-base-300">
                            {postId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(postId)}
                            className="btn btn-ghost btn-xs p-1 text-base-content/50 hover:text-base-content"
                            title="Copy Post ID"
                          >
                            {copiedId === postId ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Author & User ID */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-base-content/95 block truncate max-w-[130px]">
                            {author.name || author.username || "Traveler"}
                          </span>
                          <span className="text-[11px] font-mono text-base-content/60 block">
                            @{author.username || "traveler"}
                          </span>
                          {authorId ? (
                            <span className="text-[10px] font-mono text-amber-500/90 block">
                              UID: {authorId}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Caption & Destination */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-base-content/85 line-clamp-2 leading-relaxed">
                          {p.caption || "(No caption)"}
                        </p>
                        {p.destination ? (
                          <span className="text-[10px] text-secondary font-bold flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {p.destination}
                          </span>
                        ) : null}
                      </td>

                      {/* Engagement Counters */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-base-content/70">
                          <span className="flex items-center gap-0.5" title="Likes">
                            <Heart className="w-3 h-3 text-error fill-current" /> {p.likes || p.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-0.5" title="Comments">
                            <MessageCircle className="w-3 h-3 text-primary" /> {p.comments?.length || p.comments_count || 0}
                          </span>
                        </div>
                      </td>

                      {/* Visibility Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`badge badge-xs font-bold py-2 px-2.5 ${
                          isPublic ? "badge-success text-white" : "badge-warning text-slate-900"
                        }`}>
                          {isPublic ? "Public" : "Hidden"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. View Detailed Data Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedPostDetails(p)}
                            className="btn btn-xs btn-ghost bg-base-200 hover:bg-base-300 text-base-content/85 rounded-lg gap-1 font-bold"
                            title="View Detailed Post Data"
                          >
                            <Eye className="w-3.5 h-3.5 text-info" />
                            <span className="hidden md:inline">Details</span>
                          </button>

                          {/* 2. Hide / Make Visible Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(p)}
                            className={`btn btn-xs rounded-lg gap-1 font-bold ${
                              isPublic 
                                ? "btn-warning text-slate-900" 
                                : "btn-success text-white"
                            }`}
                            title={isPublic ? "Hide Post from Feed" : "Make Post Visible"}
                          >
                            {isPublic ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Unhide</span>
                              </>
                            )}
                          </button>

                          {/* 3. Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPost(p);
                              setIsCreateModalOpen(true);
                            }}
                            className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content p-1"
                            title="Edit Post"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Button */}
                          <button
                            type="button"
                            onClick={() => setPostToDelete(p)}
                            className="btn btn-xs btn-ghost text-error hover:bg-error/10 p-1"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: View Detailed Post Data */}
      <AdminPostDetailsModal
        isOpen={Boolean(selectedPostDetails)}
        onClose={() => setSelectedPostDetails(null)}
        post={selectedPostDetails}
        onToggleVisibility={(p) => handleToggleVisibility(p)}
        onEdit={(p) => {
          setSelectedPostDetails(null);
          setEditingPost(p);
          setIsCreateModalOpen(true);
        }}
        onDelete={(p) => {
          setSelectedPostDetails(null);
          setPostToDelete(p);
        }}
      />

      {/* MODAL 2: Create / Edit Post Form Modal */}
      <AdminPostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onSave={handleSavePost}
      />

      {/* MODAL 3: Confirm Delete Post Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-base-content/95">
                Permanently Delete Post?
              </h3>
              <p className="text-xs text-base-content/80 leading-relaxed">
                Are you sure you want to delete post <code className="font-mono text-error font-bold">{postToDelete.id || postToDelete.post_id}</code>? This will permanently remove the post and all its media records from MySQL.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
