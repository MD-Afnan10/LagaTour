import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { 
  Heart,
  MessageCircle, 
  Bookmark, 
  Share2,
  PlusCircle,
  MapPin, 
  CheckCircle, 
  Send,
  Flag,
  X,
  AlertTriangle,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  Copy,
  Check,
  Globe,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SocialFeed() {
  const { currentUser, addPoints } = useAuth();
  const { 
    posts, 
    isLoading,
    toggleLikePost, 
    toggleSavePost, 
    sharePost, 
    addComment, 
    reportPost 
  } = usePosts();
  const navigate = useNavigate();
  
  // Comment inputs per post ID
  const [commentInputs, setCommentInputs] = useState({});

  // Active indices and tabs for multi-media posts
  const [activePhotoIndices, setActivePhotoIndices] = useState({});
  const [activeVideoIndices, setActiveVideoIndices] = useState({});
  const [activeMediaTabs, setActiveMediaTabs] = useState({});

  // Report Modal state
  const [reportingPost, setReportingPost] = useState(null);
  const [reporterName, setReporterName] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportSuccessMsg, setReportSuccessMsg] = useState("");

  // Share Modal state
  const [sharingPost, setSharingPost] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToastMsg, setShareToastMsg] = useState("");

  const handleLike = (postId) => {
    toggleLikePost(postId, currentUser);
    if (addPoints) addPoints(5);
  };

  const handleSave = (postId) => {
    toggleSavePost(postId, currentUser);
  };

  const handleShareClick = async (post) => {
    setSharingPost(post);
    setCopiedLink(false);
    
    // Increment share counter in MySQL
    await sharePost(post.id);
    if (addPoints) addPoints(10);
  };

  const copyShareLink = (postId) => {
    const shareUrl = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setShareToastMsg("🔗 Link copied to clipboard!");
      setTimeout(() => {
        setCopiedLink(false);
        setShareToastMsg("");
      }, 2500);
    }).catch(() => {
      setShareToastMsg("🔗 Link ready to share!");
    });
  };

  const handleNativeShare = async (post) => {
    const shareUrl = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LagaTour - Post by ${post.author?.name || 'Traveler'}`,
          text: post.caption || "Check out this travel story on LagaTour!",
          url: shareUrl,
        });
        setShareToastMsg("🎉 Shared successfully!");
        setTimeout(() => setShareToastMsg(""), 2000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyShareLink(post.id);
        }
      }
    } else {
      copyShareLink(post.id);
    }
  };

  const handleCommentSubmit = (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || "";
    if (!commentText.trim()) return;

    addComment(postId, currentUser || { username: "traveler", name: "Traveler" }, commentText);
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    
    // Add points for active engagement
    if (addPoints) {
      const result = addPoints(10);
      if (result && result.leveledUp) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const openReportModal = (post) => {
    setReportingPost(post);
    setReporterName(currentUser?.name || currentUser?.username || "");
    setReportReason("");
    setReportSuccessMsg("");
  };

  const submitReport = (e) => {
    e.preventDefault();
    if (!reportingPost) return;

    reportPost(reportingPost.id, currentUser, reporterName, reportReason);
    setReportSuccessMsg("✅ Thank you. Your report has been recorded in database moderation queue.");
    
    setTimeout(() => {
      setReportingPost(null);
      setReportSuccessMsg("");
      setReporterName("");
      setReportReason("");
    }, 1800);
  };

  // Helper for YouTube embed link parsing
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // Filter posts: hide hidden posts unless user is admin
  const visiblePosts = posts.filter(post => !post.isHidden || currentUser?.isAdmin);

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-4xl relative">
      
      {/* Toast Banner */}
      {shareToastMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-white text-xs font-bold shadow-xl rounded-2xl py-2 px-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{shareToastMsg}</span>
          </div>
        </div>
      )}

      {/* Feed Header & Navigation to Dedicated Create Post Page */}
      <div className="flex justify-between items-center mb-8 bg-base-100 border border-base-200 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight mb-1 text-base-content">Traveler Feed</h1>
            <span className="badge badge-sm badge-success font-bold text-[10px] text-white">MySQL Connected</span>
          </div>
          <p className="text-xs sm:text-sm text-base-content/60">Discover shared itineraries, multiple photos, and video experiences from travelers.</p>
        </div>
        
        {/* Redirects to dedicated /create-post page */}
        <button 
          onClick={() => navigate("/create-post")}
          className="btn btn-primary text-white font-bold rounded-2xl shadow-lg border-none capitalize gap-2 px-5 shrink-0"
        >
          <PlusCircle className="w-5 h-5" /> Share Story
        </button>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-6 text-primary gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-bold text-base-content/70">Syncing with Node.js backend...</span>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-6">
        {visiblePosts.length === 0 && !isLoading ? (
          <div className="text-center py-16 bg-base-100 rounded-3xl border border-dashed border-base-300 p-8 space-y-3">
            <MapPin className="w-12 h-12 text-primary mx-auto opacity-50" />
            <h3 className="font-bold text-lg">No travel stories available</h3>
            <p className="text-xs text-base-content/60 max-w-md mx-auto">
              Be the first to publish a travel experience with text, photos, and videos!
            </p>
            <button 
              onClick={() => navigate("/create-post")}
              className="btn btn-primary btn-sm rounded-xl font-bold gap-1 mt-2 text-white"
            >
              <PlusCircle className="w-4 h-4" /> Create New Post
            </button>
          </div>
        ) : (
          visiblePosts.map((post) => {
            // Support multiple images and multiple videos
            const allImages = post.images && post.images.length > 0 
              ? post.images 
              : (post.image ? [post.image] : []);
              
            const allVideos = post.videos && post.videos.length > 0 
              ? post.videos 
              : (post.video ? [post.video] : []);

            const currentTab = activeMediaTabs[post.id] || (allVideos.length > 0 && allImages.length === 0 ? "videos" : "photos");
            const currentImgIdx = activePhotoIndices[post.id] || 0;
            const currentVidIdx = activeVideoIndices[post.id] || 0;

            return (
              <div 
                key={post.id} 
                id={`post-${post.id}`}
                className={`card bg-base-100 border border-base-200 overflow-hidden shadow-sm rounded-3xl transition-all ${post.isHidden ? "opacity-60 border-warning" : ""}`}
              >
                
                {/* Hidden Notice for Admin */}
                {post.isHidden && (
                  <div className="bg-warning/20 border-b border-warning/30 px-4 py-2 flex items-center justify-between text-xs text-warning-content font-bold">
                    <span className="flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-warning" /> Hidden by Admin Moderation
                    </span>
                    <span className="text-[10px] opacity-75">Visible to admins only</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="p-4 flex items-center justify-between border-b border-base-200/50">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${post.author?.id || post.author?.username}`}>
                      <img 
                        src={post.author?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author?.username}`} 
                        alt={post.author?.name} 
                        className="w-10 h-10 rounded-full object-cover border border-base-300 hover:opacity-80 transition-opacity" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author?.username || 'traveler'}`;
                        }}
                      />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${post.author?.id || post.author?.username}`} className="font-bold text-sm hover:underline">
                          {post.author?.name}
                        </Link>
                        <span className="badge badge-sm badge-outline text-[10px] opacity-75">{post.author?.league || "Explorer"}</span>
                      </div>
                      <span className="text-[10px] text-base-content/50">{post.time}</span>
                    </div>
                  </div>
                  
                  {post.destination && (
                    <div className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 py-1.5 px-3 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{post.destination}</span>
                    </div>
                  )}
                </div>

                {/* MULTI-MEDIA CONTAINER (Multiple Photos & Multiple Videos) */}
                {(allImages.length > 0 || allVideos.length > 0) && (
                  <div className="relative bg-black border-b border-base-200 overflow-hidden">
                    
                    {/* Media Type Tab Selector if both Photos & Videos exist */}
                    {allImages.length > 0 && allVideos.length > 0 && (
                      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex gap-2 justify-center z-10 relative">
                        <button 
                          onClick={() => setActiveMediaTabs({ ...activeMediaTabs, [post.id]: "photos" })}
                          className={`btn btn-xs rounded-xl gap-1.5 font-bold ${
                            currentTab === "photos" ? "btn-primary text-white" : "btn-ghost text-slate-300"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Photos ({allImages.length})
                        </button>
                        <button 
                          onClick={() => setActiveMediaTabs({ ...activeMediaTabs, [post.id]: "videos" })}
                          className={`btn btn-xs rounded-xl gap-1.5 font-bold ${
                            currentTab === "videos" ? "btn-error text-white" : "btn-ghost text-slate-300"
                          }`}
                        >
                          <VideoIcon className="w-3.5 h-3.5" /> Videos ({allVideos.length})
                        </button>
                      </div>
                    )}

                    {/* PHOTOS VIEW */}
                    {currentTab === "photos" && allImages.length > 0 && (
                      <figure className="relative max-h-[500px] overflow-hidden bg-black flex flex-col items-center justify-center">
                        <img 
                          src={allImages[currentImgIdx]} 
                          alt={`Travel Post Photo ${currentImgIdx + 1}`} 
                          className="w-full object-cover max-h-[450px]" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                          }}
                        />

                        {/* Top Info Badges */}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white font-bold text-[10px] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-md">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          <span>Photo {currentImgIdx + 1} of {allImages.length}</span>
                        </div>

                        <div className="absolute top-3 right-3 bg-green-600 text-white font-bold text-[10px] py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified Media</span>
                        </div>

                        {/* Previous & Next Carousel Arrows */}
                        {allImages.length > 1 && (
                          <>
                            <button 
                              onClick={() => setActivePhotoIndices({
                                ...activePhotoIndices,
                                [post.id]: (currentImgIdx - 1 + allImages.length) % allImages.length
                              })}
                              className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/60 hover:bg-black text-white border-none shadow-lg"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setActivePhotoIndices({
                                ...activePhotoIndices,
                                [post.id]: (currentImgIdx + 1) % allImages.length
                              })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/60 hover:bg-black text-white border-none shadow-lg"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Thumbnail Selector Strip */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/70 backdrop-blur p-1.5 rounded-full z-10">
                              {allImages.map((img, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setActivePhotoIndices({ ...activePhotoIndices, [post.id]: idx })}
                                  className={`w-3 h-3 rounded-full transition-all ${
                                    idx === currentImgIdx ? "bg-primary scale-125" : "bg-white/50 hover:bg-white"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </figure>
                    )}

                    {/* VIDEOS VIEW */}
                    {(currentTab === "videos" || (allImages.length === 0 && allVideos.length > 0)) && allVideos.length > 0 && (
                      <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px]">
                        
                        {allVideos[currentVidIdx]?.includes("youtube") || allVideos[currentVidIdx]?.includes("youtu.be") ? (
                          <iframe 
                            src={getEmbedUrl(allVideos[currentVidIdx])} 
                            title="Travel Video" 
                            className="w-full h-80 sm:h-96 border-none"
                            allowFullScreen 
                          />
                        ) : (
                          <video 
                            src={allVideos[currentVidIdx]} 
                            controls 
                            className="w-full max-h-[450px] object-cover" 
                          />
                        )}

                        {/* Top Info Badges */}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white font-bold text-[10px] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-md">
                          <VideoIcon className="w-3.5 h-3.5 text-error" />
                          <span>Video Clip {currentVidIdx + 1} of {allVideos.length}</span>
                        </div>

                        {/* Multiple Videos Switcher */}
                        {allVideos.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/80 backdrop-blur p-1.5 rounded-2xl z-10 border border-slate-700">
                            {allVideos.map((_, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setActiveVideoIndices({ ...activeVideoIndices, [post.id]: idx })}
                                className={`btn btn-xs rounded-xl font-bold ${
                                  idx === currentVidIdx ? "btn-error text-white" : "btn-ghost text-slate-300"
                                }`}
                              >
                                Clip #{idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Post Content & Engagement Actions */}
                <div className="p-5 space-y-4">
                  
                  {/* Engagement Bar: Like (Heart), Comment, Share, Save, Report */}
                  <div className="flex justify-between items-center border-b border-base-200 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      
                      {/* LIKE BUTTON */}
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          post.hasLiked 
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/30 scale-105" 
                            : "bg-base-200/70 hover:bg-base-300 text-base-content/80 border-base-300"
                        }`}
                        title="Like Post"
                      >
                        <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-600 text-rose-600" : ""}`} />
                        <span>{post.likes || 0}</span>
                      </button>

                      {/* COMMENT COUNTER */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-base-content/80 bg-base-200/70 border border-base-300 rounded-full px-3 py-1.5">
                        <MessageCircle className="w-4 h-4 text-base-content/70" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </div>

                      {/* SHARE BUTTON */}
                      <button 
                        onClick={() => handleShareClick(post)}
                        className="flex items-center gap-1.5 text-xs font-bold text-base-content/80 bg-base-200/70 hover:bg-primary/10 hover:text-primary border border-base-300 rounded-full px-3 py-1.5 transition-all"
                        title="Share Post"
                      >
                        <Share2 className="w-4 h-4 text-primary" />
                        <span>{post.shares || 0} Shares</span>
                      </button>

                    </div>

                    <div className="flex items-center gap-2">
                      {/* BOOKMARK BUTTON */}
                      <button 
                        onClick={() => handleSave(post.id)} 
                        className={`btn btn-ghost btn-xs btn-circle transition-all ${post.hasSaved ? "text-primary bg-primary/10" : "hover:text-primary"}`}
                        title={post.hasSaved ? "Saved" : "Save/Bookmark Post"}
                      >
                        <Bookmark className={`w-4.5 h-4.5 ${post.hasSaved ? "fill-primary text-primary" : "text-base-content/60"}`} />
                      </button>

                      {/* REPORT BUTTON */}
                      <button 
                        onClick={() => openReportModal(post)} 
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error hover:bg-error/10"
                        title="Report Post to Admin"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Caption / Description */}
                  <div>
                    <p className="text-sm leading-relaxed">
                      <span className="font-bold mr-2 text-base-content">@{post.author?.username || "traveler"}</span>
                      {post.caption}
                    </p>
                  </div>

                  {/* Inline Comments List */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="bg-base-200/50 rounded-2xl p-3.5 space-y-2 border border-base-200 max-h-48 overflow-y-auto">
                      {post.comments.map((comment, i) => (
                        <div key={comment.id || i} className="text-xs leading-snug flex items-start justify-between">
                          <div>
                            <span className="font-bold text-primary mr-1.5">@{comment.user}</span>
                            <span className="text-base-content/85">{comment.text}</span>
                          </div>
                          {comment.time && <span className="text-[9px] text-base-content/40 ml-2 shrink-0">{comment.time}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2 items-center pt-2 border-t border-base-200">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      className="input input-sm input-bordered flex-1 rounded-xl text-xs bg-base-100 focus:border-primary"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    />
                    <button type="submit" className="btn btn-sm btn-primary text-white rounded-xl font-bold text-xs px-3">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* SHARE MODAL */}
      {sharingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setSharingPost(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/50 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-base-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-base-content">Share Travel Post</h3>
                <p className="text-[11px] text-base-content/60">Share this post by @{sharingPost.author?.username || "traveler"} with your friends.</p>
              </div>
            </div>

            {/* Post Summary Preview */}
            <div className="bg-base-200/60 p-3.5 rounded-2xl border border-base-300 flex items-center gap-3">
              {sharingPost.image ? (
                <img src={sharingPost.image} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                  LT
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs truncate">@{sharingPost.author?.username || "traveler"}</h4>
                <p className="text-[11px] text-base-content/70 line-clamp-1">{sharingPost.caption || "Travel Story"}</p>
                <span className="text-[10px] text-primary font-semibold">{sharingPost.shares || 0} total shares</span>
              </div>
            </div>

            {/* Share Link Copy Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-base-content/80">Direct Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/#post-${sharingPost.id}`} 
                  className="input input-sm input-bordered flex-1 text-xs rounded-xl font-mono bg-base-200/50"
                />
                <button 
                  onClick={() => copyShareLink(sharingPost.id)} 
                  className={`btn btn-sm rounded-xl gap-1 text-xs font-bold ${copiedLink ? "btn-success text-white" : "btn-primary text-white"}`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleNativeShare(sharingPost)} 
                className="btn btn-sm btn-outline flex-1 rounded-xl text-xs font-bold gap-1.5"
              >
                <Globe className="w-4 h-4" /> Share via Apps
              </button>
              <button 
                onClick={() => {
                  copyShareLink(sharingPost.id);
                  setSharingPost(null);
                }} 
                className="btn btn-sm btn-primary flex-1 rounded-xl text-xs font-bold text-white gap-1.5"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REPORT POST MODAL */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setReportingPost(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/50 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-base-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-base-content">Report Post to Admin</h3>
                <p className="text-[11px] text-base-content/60">Flag content for community guidelines or safety review.</p>
              </div>
            </div>

            {reportSuccessMsg ? (
              <div className="alert alert-success bg-success/10 border-success/20 text-success text-xs font-semibold p-4 rounded-2xl text-center">
                {reportSuccessMsg}
              </div>
            ) : (
              <form onSubmit={submitReport} className="space-y-4">
                
                {/* Optional Reporter Name / Handle Input */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Your Name / Handle (Optional)</span>
                    <span className="label-text-alt text-[10px] text-base-content/50">Optional</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your name or handle (e.g. Aria Jahan)" 
                    className="input input-sm input-bordered w-full text-xs rounded-xl"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>

                {/* Reason Input */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Reason for Reporting</span>
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="Describe why this post is inappropriate, misleading, spam, or unsafe..." 
                    className="textarea textarea-bordered w-full text-xs rounded-xl"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  />
                </div>

                <div className="p-3 bg-base-200/50 rounded-xl text-[10px] text-base-content/60 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span>Submitted reports are saved in the MySQL database and reviewed directly by the platform administration team.</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setReportingPost(null)} 
                    className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md shadow-error/20"
                  >
                    Submit Report
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
