import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { MOCK_DESTINATIONS } from "../data/mockData";
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  MapPin, 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  Info,
  AlertCircle,
  Upload,
  X,
  FileCheck,
  Plus
} from "lucide-react";
import confetti from "canvas-confetti";

export default function CreatePost() {
  const { currentUser, addPoints } = useAuth();
  const { createPost } = usePosts();
  const navigate = useNavigate();

  const [caption, setCaption] = useState("");
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0]?.name || "Cox's Bazar Beach");
  const [customDestination, setCustomDestination] = useState("");

  // Multiple Photos & Videos State
  const [photoItems, setPhotoItems] = useState([]);
  const [videoItems, setVideoItems] = useState([]);

  // AI Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyError, setVerifyError] = useState("");

  // Sample media presets
  const samplePhotos = [
    { name: "Cox's Bazar Beach", url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800", dest: "Cox's Bazar Beach" },
    { name: "Sajek Cloud Valley", url: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800", dest: "Sajek Valley" },
    { name: "Sreemangal Tea Estates", url: "https://images.unsplash.com/photo-1597843798940-02c349a5b3a4?w=800", dest: "Sreemangal Tea Gardens" },
    { name: "St. Martin Island", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", dest: "Saint Martin's Island" }
  ];

  const sampleVideos = [
    { name: "Cloud Wave Reel (MP4)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { name: "Ocean Escapes Reel (MP4)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" }
  ];

  // Handle Uploading Multiple Image Files
  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const invalid = files.find(f => !f.type.startsWith("image/"));
      if (invalid) {
        setVerifyError("Some selected files are not valid image formats.");
        return;
      }
      setVerifyError("");

      const newPhotos = files.map((file, idx) => ({
        id: "img_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substr(2, 4),
        name: file.name,
        url: URL.createObjectURL(file)
      }));

      setPhotoItems(prev => [...prev, ...newPhotos]);
    }
  };

  // Handle Uploading Multiple Video Files
  const handleMultipleVideos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const invalid = files.find(f => !f.type.startsWith("video/"));
      if (invalid) {
        setVerifyError("Some selected files are not valid video formats.");
        return;
      }
      setVerifyError("");

      const newVideos = files.map((file, idx) => ({
        id: "vid_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substr(2, 4),
        name: file.name,
        url: URL.createObjectURL(file)
      }));

      setVideoItems(prev => [...prev, ...newVideos]);
    }
  };

  // Remove Photo Item
  const removePhoto = (id) => {
    setPhotoItems(prev => prev.filter(p => p.id !== id));
  };

  // Remove Video Item
  const removeVideo = (id) => {
    setVideoItems(prev => prev.filter(v => v.id !== id));
  };

  // Add Preset Sample Photo
  const addPresetPhoto = (sample) => {
    const newPhoto = {
      id: "img_sample_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: sample.name,
      url: sample.url
    };
    setPhotoItems(prev => [...prev, newPhoto]);
    setDestination(sample.dest);
  };

  // Add Preset Sample Video
  const addPresetVideo = (sample) => {
    const newVideo = {
      id: "vid_sample_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: sample.name,
      url: sample.url
    };
    setVideoItems(prev => [...prev, newVideo]);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setVerifyError("");

    const finalDestination = destination === "custom" ? (customDestination.trim() || "Custom Destination") : destination;
    
    if (!caption.trim()) {
      setVerifyError("Please enter post text for your travel story.");
      return;
    }
    if (photoItems.length === 0 && videoItems.length === 0) {
      setVerifyError("Please upload at least one photo or video file for your post.");
      return;
    }

    // Start AI Verification Simulation
    setIsVerifying(true);
    setVerifyStep(1);

    await new Promise(res => setTimeout(res, 1000));
    setVerifyStep(2);

    await new Promise(res => setTimeout(res, 1000));
    setVerifyStep(3);

    await new Promise(res => setTimeout(res, 800));

    // Create post in PostContext with multiple images and videos
    const authorUser = currentUser || {
      name: "Travel Explorer",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler",
      league: "Explorer"
    };

    await createPost({
      author: authorUser,
      caption: caption.trim(),
      images: photoItems.map(p => p.url),
      videos: videoItems.map(v => v.url),
      destination: finalDestination
    });

    // Award points and show celebration
    const result = addPoints(50);
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (result?.leveledUp) {
      alert(`🎉 LEAGUE UPGRADED! You are now a ${result.league}!`);
    }

    setIsVerifying(false);
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6 border-b border-base-200 pb-4">
        <Link to="/" className="btn btn-ghost btn-sm rounded-xl gap-2 font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
        <span className="badge badge-primary font-bold text-xs px-3 py-1">New Post Page</span>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-400" /> Share Travel Story
          </h1>
          <p className="text-xs text-base-content/75 leading-relaxed">
            Add multiple photos and multiple videos to a single travel post for the community.
          </p>
        </div>

        {verifyError && (
          <div className="alert alert-error text-xs rounded-2xl p-3 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {isVerifying ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 bg-base-200/40 rounded-2xl border border-dashed border-base-300">
            <Loader2 className="w-14 h-14 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-base-content">AI Multi-Media Verification in Progress</h3>
              <p className="text-xs text-base-content/75">
                {verifyStep === 1 && `Verifying ${photoItems.length} photos & ${videoItems.length} video streams...`}
                {verifyStep === 2 && "Extracting EXIF landmark tags & frame geometry..."}
                {verifyStep === 3 && `Matching media authenticity with geotag (${destination})...`}
              </p>
            </div>
            
            <div className="w-64 bg-base-300 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${(verifyStep / 3) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-6">
            
            {/* 1. Destination Tag */}
            <div className="form-control space-y-1.5">
              <label className="label py-0">
                <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                  <MapPin className="w-4 h-4 text-primary" /> Destination / Location Tag
                </span>
              </label>
              <select 
                className="select select-bordered w-full text-xs rounded-xl h-11 bg-base-100 focus:border-primary font-medium"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {MOCK_DESTINATIONS.map(d => (
                  <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                ))}
                <option value="custom">➕ Add Custom Location...</option>
              </select>

              {destination === "custom" && (
                <input 
                  type="text" 
                  placeholder="Enter custom location name (e.g. Kuakata Sea Beach)" 
                  className="input input-bordered w-full text-xs rounded-xl h-10 mt-2"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value)}
                  required
                />
              )}
            </div>

            {/* 2. Text / Caption Input */}
            <div className="form-control space-y-1.5">
              <label className="label py-0 justify-between">
                <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                  <FileText className="w-4 h-4 text-secondary" /> Post Text & Experience Story
                </span>
                <span className="text-[10px] text-base-content/60">{caption.length} characters</span>
              </label>
              <textarea 
                rows="4"
                placeholder="Write your experience details, recommendations, or budget tips..." 
                className="textarea textarea-bordered w-full text-xs rounded-xl bg-base-100 focus:border-secondary p-3 leading-relaxed"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
              />
            </div>

            {/* 3. MULTIPLE PHOTOS UPLOAD SECTION */}
            <div className="form-control space-y-3">
              <div className="flex justify-between items-center">
                <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                  <ImageIcon className="w-4 h-4 text-info" /> Photos Gallery ({photoItems.length} Attached)
                </span>
                <label className="btn btn-xs btn-info text-white font-bold rounded-lg gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Upload Photos
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleMultipleImages} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Photo Upload Dropzone or Grid */}
              {photoItems.length === 0 ? (
                <label className="border-2 border-dashed border-base-300 hover:border-info bg-base-200/40 hover:bg-base-200/80 transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-base-content block">Click to Upload Multiple Photos</span>
                    <span className="text-[10px] text-base-content/60 block mt-0.5">Select multiple photo files from your computer or phone</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleMultipleImages} 
                    className="hidden" 
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoItems.map((photo, idx) => (
                    <div key={photo.id} className="relative rounded-2xl overflow-hidden bg-black border border-base-300 group h-36 flex items-center justify-center">
                      <img src={photo.url} alt={`Uploaded ${idx}`} className="w-full h-full object-cover" />
                      
                      <span className="absolute top-2 left-2 badge badge-info badge-xs font-bold text-white px-2 py-1">
                        Photo #{idx + 1}
                      </span>

                      <button 
                        type="button" 
                        onClick={() => removePhoto(photo.id)} 
                        className="absolute top-2 right-2 btn btn-circle btn-xs btn-error text-white shadow-md"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Photo Preset Loaders */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <span className="text-[10px] text-base-content/60 font-semibold mr-1">Add sample photos:</span>
                {samplePhotos.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addPresetPhoto(s)}
                    className="btn btn-xs btn-outline rounded-lg text-[10px] capitalize font-medium border-base-300 hover:border-info"
                  >
                    📸 + {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. MULTIPLE VIDEOS UPLOAD SECTION */}
            <div className="form-control space-y-3">
              <div className="flex justify-between items-center">
                <span className="label-text font-bold text-xs flex items-center gap-1.5 text-base-content/85">
                  <VideoIcon className="w-4 h-4 text-error" /> Videos Gallery ({videoItems.length} Attached)
                </span>
                <label className="btn btn-xs btn-error text-white font-bold rounded-lg gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Upload Videos
                  <input 
                    type="file" 
                    accept="video/*" 
                    multiple 
                    onChange={handleMultipleVideos} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Video Upload Dropzone or Grid */}
              {videoItems.length === 0 ? (
                <label className="border-2 border-dashed border-base-300 hover:border-error bg-base-200/40 hover:bg-base-200/80 transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
                    <VideoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-base-content block">Click to Upload Multiple Videos</span>
                    <span className="text-[10px] text-base-content/60 block mt-0.5">Select multiple video files from your device</span>
                  </div>
                  <input 
                    type="file" 
                    accept="video/*" 
                    multiple 
                    onChange={handleMultipleVideos} 
                    className="hidden" 
                  />
                </label>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videoItems.map((video, idx) => (
                    <div key={video.id} className="relative rounded-2xl overflow-hidden bg-black border border-base-300">
                      <video src={video.url} controls className="w-full max-h-48 object-cover" />
                      
                      <span className="absolute top-2 left-2 badge badge-error badge-xs font-bold text-white px-2 py-1 z-10">
                        Video #{idx + 1}
                      </span>

                      <button 
                        type="button" 
                        onClick={() => removeVideo(video.id)} 
                        className="absolute top-2 right-2 btn btn-circle btn-xs btn-error text-white shadow-md z-10"
                        title="Remove video"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Video Preset Loaders */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <span className="text-[10px] text-base-content/60 font-semibold mr-1">Add sample videos:</span>
                {sampleVideos.map((sv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addPresetVideo(sv)}
                    className="btn btn-xs btn-outline rounded-lg text-[10px] capitalize font-medium border-base-300 hover:border-error"
                  >
                    🎥 + {sv.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Note alert */}
            <div className="p-3 bg-base-200/60 rounded-2xl border border-base-200 text-[11px] text-base-content/75 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Publishing multi-media posts earns <strong>+50 Traveler Points</strong>! Attach multiple photos and video clips to showcase complete itineraries.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-base-200">
              <Link to="/" className="btn btn-ghost btn-md rounded-2xl flex-1 text-xs font-bold">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary btn-md rounded-2xl flex-[2] text-xs font-bold gap-2 text-white shadow-lg shadow-primary/20"
              >
                <CheckCircle className="w-4 h-4" /> Verify & Publish Post
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
