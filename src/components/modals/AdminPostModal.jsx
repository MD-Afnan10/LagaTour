import React, { useState, useEffect } from "react";
import { X, Image, Video, MapPin, Check, Send, Sparkles } from "lucide-react";

export default function AdminPostModal({
  isOpen,
  onClose,
  post,
  onSave
}) {
  const isEditing = Boolean(post && post.id);

  const [authorName, setAuthorName] = useState("LagaTour Official");
  const [authorUsername, setAuthorUsername] = useState("lagatour_admin");
  const [destination, setDestination] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (post) {
      setAuthorName(post.author?.name || "LagaTour Official");
      setAuthorUsername(post.author?.username || "lagatour_admin");
      setDestination(post.destination || "");
      setCaption(post.caption || "");
      setImageUrl(post.image || (post.images && post.images[0]) || "");
      setVideoUrl(post.video || (post.videos && post.videos[0]) || "");
      setIsPublic(post.isPublic !== false && !post.isHidden);
    } else {
      setAuthorName("LagaTour Official");
      setAuthorUsername("lagatour_admin");
      setDestination("Bangladesh Exploration");
      setCaption("");
      setImageUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");
      setVideoUrl("");
      setIsPublic(true);
    }
    setErrorMsg("");
  }, [post, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      setErrorMsg("Please provide post caption / announcement text.");
      return;
    }

    const payload = {
      destination: destination.trim() || "Bangladesh Exploration",
      caption: caption.trim(),
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
      videos: videoUrl.trim() ? [videoUrl.trim()] : [],
      image: imageUrl.trim(),
      video: videoUrl.trim(),
      isPublic,
      author: post?.author || {
        id: "admin_root",
        name: authorName.trim(),
        username: authorUsername.trim(),
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=admin",
        league: "Legend"
      }
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-base-content leading-tight">
                {isEditing ? "Edit Community Post" : "Publish Official Announcement / Featured Post"}
              </h3>
              <p className="text-xs text-base-content/70 mt-0.5">
                {isEditing ? "Modify post content, media, or visibility." : "Post directly to the traveler social feed as platform administrator."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-error/15 border border-error/30 text-error rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Author Name</label>
              <input
                type="text"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Destination / Tag</label>
              <input
                type="text"
                placeholder="e.g. Sajek Valley"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Caption / Content *</label>
            <textarea
              rows={4}
              placeholder="Write post announcement or travel tips..."
              className="textarea textarea-bordered w-full text-xs rounded-2xl"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Video URL (Optional)</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          </div>

          {imageUrl && (
            <div className="p-2 bg-base-200/50 rounded-2xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block mb-1">Image Preview</span>
              <img src={imageUrl} alt="Preview" className="h-32 w-full object-cover rounded-xl" />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-base-200/40 rounded-2xl border border-base-200">
            <div>
              <span className="text-xs font-bold text-base-content block">Feed Visibility</span>
              <span className="text-[11px] text-base-content/60">Publish visibly on community feed or keep hidden.</span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-success"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-secondary btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md gap-1"
            >
              <Check className="w-4 h-4" /> {isEditing ? "Update Post" : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
