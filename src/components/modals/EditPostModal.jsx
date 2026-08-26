import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Edit3, 
  Upload, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Video 
} from "lucide-react";
import { compressImageFile } from "../../utils/imageCompressor";

export default function EditPostModal({ 
  post, 
  isOpen, 
  onClose, 
  onSave 
}) {
  if (!isOpen || !post) return null;

  const [caption, setCaption] = useState(post.caption || "");
  const [image, setImage] = useState(post.image || (post.images && post.images[0]) || "");
  const [video, setVideo] = useState(post.video || (post.videos && post.videos[0]) || "");
  const [isPublic, setIsPublic] = useState(post.isPublic !== false && !post.isHidden);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || "");
      setImage(post.image || (post.images && post.images[0]) || "");
      setVideo(post.video || (post.videos && post.videos[0]) || "");
      setIsPublic(post.isPublic !== false && !post.isHidden);
    }
  }, [post]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      setImage(compressed);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to process image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      await onSave(post.id, {
        caption,
        images: image ? [image] : [],
        videos: video ? [video] : [],
        isPublic
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update post.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 border border-base-300 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/50 hover:bg-base-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-base-200 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-base-content">Edit Travel Post</h3>
            <p className="text-[11px] text-base-content/60">Update caption, photo, video, or toggle visibility.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs p-3 rounded-2xl">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-bold">Caption & Story</span></label>
            <textarea 
              rows="3" 
              placeholder="What's your travel experience..." 
              className="textarea textarea-bordered w-full rounded-xl text-xs" 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-base-200/50 rounded-2xl border border-base-200 space-y-2">
            <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary" /> Post Image
            </label>

            {image && (
              <div className="relative rounded-xl overflow-hidden h-36 bg-black">
                <img 
                  src={image} 
                  alt="Post Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setImage("")} 
                  className="btn btn-xs btn-circle btn-error absolute top-2 right-2 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="btn btn-xs btn-outline rounded-xl gap-1 text-xs font-bold"
              >
                <Upload className="w-3.5 h-3.5" /> Choose New Photo
              </button>

              <span className="text-[10px] text-base-content/50">or paste URL below</span>
            </div>

            <input 
              type="text" 
              placeholder="https://images.unsplash.com/..." 
              className="input input-xs input-bordered w-full rounded-lg font-mono text-[11px]" 
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-bold flex items-center gap-1"><Video className="w-3.5 h-3.5 text-secondary" /> Video Link (Optional)</span></label>
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=..." 
              className="input input-sm input-bordered w-full rounded-xl text-xs font-mono" 
              value={video}
              onChange={(e) => setVideo(e.target.value)}
            />
          </div>

          <div className="p-3 bg-base-200/50 rounded-2xl border border-base-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-base-content block">Public on Social Feed</span>
              <span className="text-[10px] text-base-content/60">If unchecked, this post becomes private and hidden from the public feed.</span>
            </div>
            <input 
              type="checkbox" 
              className="toggle toggle-primary toggle-sm" 
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 btn-sm flex-1 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
