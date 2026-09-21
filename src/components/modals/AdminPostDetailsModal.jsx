import React, { useState } from "react";
import { 
  X, 
  Eye, 
  EyeOff, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MapPin, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  Check,
  Video as VideoIcon,
  Image as ImageIcon
} from "lucide-react";

export default function AdminPostDetailsModal({
  isOpen,
  onClose,
  post,
  onToggleVisibility,
  onEdit,
  onDelete
}) {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !post) return null;

  const isPublic = Boolean(post.isPublic) && !post.isHidden;
  const postId = post.id || post.post_id;
  const author = post.author || post.user || {};
  const authorId = author.id || author.user_id || post.user_id;

  const handleCopyPostId = () => {
    if (postId) {
      navigator.clipboard?.writeText(postId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Find images and videos
  const images = post.images || (post.image ? [post.image] : []) || [];
  const videos = post.videos || (post.video ? [post.video] : []) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 text-white relative">
          <div className="flex items-center gap-3">
            <img 
              src={author.avatar || author.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${author.username || "traveler"}`}
              alt={author.name || author.username}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-slate-800 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white truncate">
                  {author.name || author.username || "Community Traveler"}
                </h3>
                <span className="text-xs font-mono text-slate-400">@{author.username || "traveler"}</span>
                <span className={`badge badge-xs font-bold px-2 py-1 ${
                  isPublic ? "badge-success text-white" : "badge-warning text-slate-900"
                }`}>
                  {isPublic ? "Visible / Public" : "Hidden / Unpublished"}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-300">
                <span>Post ID:</span>
                <code className="text-xs font-mono bg-slate-800/90 text-amber-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {postId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPostId}
                  className="btn btn-ghost btn-xs text-slate-300 hover:text-white p-1"
                  title="Copy Post ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {authorId ? (
                  <span className="text-[11px] text-slate-400 font-mono">
                    (Author ID: {authorId})
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Destination Badge */}
          {post.destination ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl w-fit">
              <MapPin className="w-4 h-4" />
              <span>Location / Tag: {post.destination}</span>
            </div>
          ) : null}

          {/* Caption */}
          <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300">
            <span className="text-[10px] uppercase font-bold text-base-content/60 block mb-1">Post Caption</span>
            <p className="text-xs text-base-content/90 whitespace-pre-wrap leading-relaxed">
              {post.caption || "(No caption provided)"}
            </p>
          </div>

          {/* Media Previews */}
          {images.length > 0 || videos.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block">
                Attached Media ({images.length + videos.length})
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-base-300 bg-black aspect-video flex items-center justify-center">
                    <img src={img} alt={`Post media ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 badge badge-neutral badge-xs text-white opacity-80 gap-1">
                      <ImageIcon className="w-3 h-3" /> Photo {i + 1}
                    </span>
                  </div>
                ))}

                {videos.map((vid, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-base-300 bg-black aspect-video flex flex-col items-center justify-center p-3 text-center text-white">
                    <VideoIcon className="w-8 h-8 text-error mb-1" />
                    <span className="text-xs font-bold truncate max-w-full px-2">{vid}</span>
                    <span className="absolute bottom-2 left-2 badge badge-error badge-xs text-white gap-1">
                      <VideoIcon className="w-3 h-3" /> Video
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-base-200/40 rounded-2xl border border-dashed border-base-300 text-xs text-base-content/60">
              Text-only post without image or video attachments
            </div>
          )}

          {/* Engagement Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-base-200/60 p-2.5 rounded-2xl border border-base-200">
              <span className="text-[10px] text-base-content/60 uppercase font-bold block">Likes</span>
              <span className="text-sm font-black text-error flex items-center justify-center gap-1 mt-0.5 font-mono">
                <Heart className="w-3.5 h-3.5 fill-current" /> {post.likes || post.likes_count || 0}
              </span>
            </div>

            <div className="bg-base-200/60 p-2.5 rounded-2xl border border-base-200">
              <span className="text-[10px] text-base-content/60 uppercase font-bold block">Comments</span>
              <span className="text-sm font-black text-primary flex items-center justify-center gap-1 mt-0.5 font-mono">
                <MessageCircle className="w-3.5 h-3.5" /> {post.comments?.length || post.comments_count || 0}
              </span>
            </div>

            <div className="bg-base-200/60 p-2.5 rounded-2xl border border-base-200">
              <span className="text-[10px] text-base-content/60 uppercase font-bold block">Shares</span>
              <span className="text-sm font-black text-secondary flex items-center justify-center gap-1 mt-0.5 font-mono">
                <Share2 className="w-3.5 h-3.5" /> {post.shares || post.shares_count || 0}
              </span>
            </div>

            <div className="bg-base-200/60 p-2.5 rounded-2xl border border-base-200">
              <span className="text-[10px] text-base-content/60 uppercase font-bold block">Saves</span>
              <span className="text-sm font-black text-warning flex items-center justify-center gap-1 mt-0.5 font-mono">
                <Bookmark className="w-3.5 h-3.5" /> {post.saves || post.saves_count || 0}
              </span>
            </div>
          </div>

          {/* Timestamp Info */}
          <div className="text-xs text-base-content/70 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Published: {post.createdAt || post.created_at ? new Date(post.createdAt || post.created_at).toLocaleString() : post.time || "Recently"}</span>
          </div>

          {/* Visibility Control Card */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isPublic ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning"
          }`}>
            <div className="flex items-center gap-2.5">
              {isPublic ? <Eye className="w-5 h-5 shrink-0" /> : <EyeOff className="w-5 h-5 shrink-0" />}
              <div>
                <span className="text-xs font-black block">
                  Status: {isPublic ? "VISIBLE ON COMMUNITY FEED" : "HIDDEN FROM FEED"}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isPublic 
                    ? "All users and visitors can discover and interact with this post." 
                    : "This post is hidden from the public feed due to moderation."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onToggleVisibility(post);
              }}
              className={`btn btn-sm rounded-xl font-bold text-xs gap-1.5 shadow-sm ${
                isPublic ? "btn-warning text-slate-900" : "btn-success text-white"
              }`}
            >
              {isPublic ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide Post
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Make Visible
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 bg-base-200/40 border-t border-base-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(post);
                  onClose();
                }}
                className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl text-xs font-bold gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Post
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(post);
                }}
                className="btn btn-sm btn-secondary rounded-xl text-xs font-bold text-white gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Post
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl text-xs font-bold text-base-content/70"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
