import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_POSTS, MOCK_DESTINATIONS } from "../data/mockData";
import { 
  ArrowUp,
  ArrowDown,
  MessageCircle, 
  Bookmark, 
  Share2, 
  Image as ImageIcon,
  MapPin, 
  CheckCircle, 
  Loader2, 
  Send 
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SocialFeed() {
  const { currentUser, addPoints } = useAuth();
  
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0].name);
  const [imageUrl, setImageUrl] = useState("");
  
  // AI Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState("idle"); // idle, processing, success, fail

  // Comment section states
  const [commentInputs, setCommentInputs] = useState({});

  const handleVote = (postId, voteType) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let netScoreChange = 0;
        let nextVote = null;

        const currentVote = post.userVote; // 'up', 'down', or null

        if (voteType === 'up') {
          if (currentVote === 'up') {
            netScoreChange = -1;
            nextVote = null;
          } else if (currentVote === 'down') {
            netScoreChange = 2;
            nextVote = 'up';
          } else {
            netScoreChange = 1;
            nextVote = 'up';
          }
        } else if (voteType === 'down') {
          if (currentVote === 'down') {
            netScoreChange = 1;
            nextVote = null;
          } else if (currentVote === 'up') {
            netScoreChange = -2;
            nextVote = 'down';
          } else {
            netScoreChange = -1;
            nextVote = 'down';
          }
        }

        return {
          ...post,
          likes: post.likes + netScoreChange,
          userVote: nextVote
        };
      }
      return post;
    }));
    addPoints(5);
  };

  const handleSave = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasSaved: !post.hasSaved
        };
      }
      return post;
    }));
  };

  const handleCommentSubmit = (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || "";
    if (!commentText.trim() || !currentUser) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: Date.now().toString(), user: currentUser.username, text: commentText }
          ]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    
    // Add points for active engagement
    const result = addPoints(10);
    if (result && result.leveledUp) {
      triggerConfetti(result.league);
    }
  };

  const triggerConfetti = (newLeague) => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  // Simulate AI Verification Flow
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!caption || !imageUrl) return;

    setIsVerifying(true);
    setVerifyStep(1);
    setVerifyStatus("processing");

    // Phase 1: Uploading & geometry extraction
    await new Promise(resolve => setTimeout(resolve, 1500));
    setVerifyStep(2);

    // Phase 2: Metadata and Landmark analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    setVerifyStep(3);

    // Phase 3: Compare with Destination geotag
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simple simulation logic: check if imageUrl looks like a valid image url
    const isSuccess = imageUrl.startsWith("http");

    if (isSuccess) {
      setVerifyStatus("success");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost = {
        id: "post_" + Date.now(),
        author: currentUser,
        image: imageUrl,
        caption: caption,
        destination: destination,
        likes: 0,
        comments: [],
        hasLiked: false,
        hasSaved: false,
        time: "Just now"
      };

      setPosts([newPost, ...posts]);
      
      // Award points for verified media + level checking
      const res = addPoints(50);
      if (res) {
        triggerConfetti();
        if (res.leveledUp) {
          alert(`🎉 LEAGUE UPGRADED! You are now a ${res.league}!`);
        }
      }

      setIsModalOpen(false);
      // Reset form
      setCaption("");
      setImageUrl("");
    } else {
      setVerifyStatus("fail");
    }

    setIsVerifying(false);
    setVerifyStatus("idle");
    setVerifyStep(0);
  };

  // Preset Unsplash templates for easy testing
  const presets = [
    { name: "Cox's Bazar", url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800" },
    { name: "Sajek Valley", url: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800" },
    { name: "Tea Gardens", url: "https://images.unsplash.com/photo-1597843798940-02c349a5b3a4?w=800" },
    { name: "Saint Martin", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" }
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-4xl relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Traveler Feed</h1>
          <p className="text-sm text-base-content/60">Discover shared itineraries and photo updates from the community.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary text-primary-content font-black rounded-xl shadow-lg border-none capitalize gap-2"
        >
          <ImageIcon className="w-4 h-4" /> Share Story
        </button>
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${post.author.id || post.author.username}`}>
                  <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border border-base-300 hover:opacity-80 transition-opacity" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${post.author.id || post.author.username}`} className="font-bold text-sm hover:underline">
                      {post.author.name}
                    </Link>
                    <span className="badge badge-sm badge-outline text-[10px] opacity-75">{post.author.league}</span>
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

            {/* Media Image */}
            <figure className="relative max-h-[500px] overflow-hidden bg-black flex items-center justify-center">
              <img src={post.image} alt="Travel Post" className="w-full object-cover h-[400px]" />
              <div className="absolute top-3 right-3 bg-green-500 text-white font-bold text-[10px] py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle className="w-3 h-3" />
                <span>AI Verified Media</span>
              </div>
            </figure>

            {/* Engagement Actions */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  
                  {/* Upvote & Downvote Control */}
                  <div className="flex items-center gap-1 bg-base-200 border border-base-300 rounded-full px-2 py-0.5 shadow-inner">
                    <button 
                      onClick={() => handleVote(post.id, "up")} 
                      className={`hover:text-primary transition-colors p-1 ${post.userVote === "up" ? "text-primary scale-110 animate-bounce" : "text-base-content/60"}`}
                      title="Upvote"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="font-black text-xs px-1.5 text-base-content min-w-[16px] text-center">{post.likes}</span>
                    <button 
                      onClick={() => handleVote(post.id, "down")} 
                      className={`hover:text-error transition-colors p-1 ${post.userVote === "down" ? "text-error scale-110" : "text-base-content/60"}`}
                      title="Downvote"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-base-content/75 bg-base-200 border border-base-300 rounded-full px-3 py-0.5">
                    <MessageCircle className="w-4 h-4 text-base-content/70" />
                    <span>{post.comments.length} Comments</span>
                  </div>
                </div>
                <button onClick={() => handleSave(post.id)} className="hover:text-primary transition-colors">
                  <Bookmark className={`w-5 h-5 ${post.hasSaved ? "fill-primary text-primary" : ""}`} />
                </button>
              </div>

              {/* Caption */}
              <div>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold mr-2">@{post.author.username}</span>
                  {post.caption}
                </p>
              </div>

              {/* Inline Comments */}
              {post.comments.length > 0 && (
                <div className="bg-base-200/50 rounded-xl p-3 space-y-2 border border-base-200">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="text-xs">
                      <span className="font-bold text-primary mr-1.5">@{comment.user}</span>
                      <span className="text-base-content/85">{comment.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2 items-center pt-2 border-t border-base-200">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  className="input input-sm input-bordered flex-1 rounded-lg text-xs"
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                />
                <button type="submit" className="btn btn-sm btn-ghost btn-circle">
                  <Send className="w-4 h-4 text-primary" />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Share Story Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg border border-base-300">
            <h3 className="font-black text-xl mb-4">Share Travel Story</h3>
            
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="text-center">
                  <h4 className="font-bold text-md">AI Verification Engine</h4>
                  <p className="text-xs text-base-content/60 mt-1">
                    {verifyStep === 1 && "Uploading photo & parsing EXIF data..."}
                    {verifyStep === 2 && "Analyzing landscape morphology & color layers..."}
                    {verifyStep === 3 && `Comparing landmark tags with ${destination}...`}
                  </p>
                </div>
                
                {/* Simulated scanner visual */}
                <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${(verifyStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handlePublish} className="space-y-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold text-xs">Destination Tag</span></label>
                  <select 
                    className="select select-bordered w-full select-sm text-xs rounded-lg"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {MOCK_DESTINATIONS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold text-xs text-warning">Photo URL (Paste any online image URL)</span></label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    className="input input-sm input-bordered w-full text-xs rounded-lg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                  
                  {/* Preset helpers */}
                  <div className="mt-2">
                    <span className="text-[10px] text-base-content/50 block mb-1">Or use quick templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((pre, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(pre.url);
                            setDestination(pre.name === "Tea Gardens" ? "Sreemangal Tea Gardens" : pre.name === "Saint Martin" ? "Saint Martin's Island" : `${pre.name} Beach` || `${pre.name} Valley`);
                          }}
                          className="btn btn-xs btn-outline text-[9px] capitalize rounded-md border-base-300"
                        >
                          {pre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-semibold text-xs">Caption</span></label>
                  <textarea 
                    rows="3"
                    placeholder="Write details of your experience..." 
                    className="textarea textarea-bordered w-full text-xs rounded-lg"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    required
                  />
                </div>

                {verifyStatus === "fail" && (
                  <div className="alert alert-error text-xs p-2 rounded-lg">
                    <span>AI verification failed! The image URL must be a valid online image link. Try presets.</span>
                  </div>
                )}

                <div className="modal-action gap-2 mt-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsModalOpen(false);
                      setImageUrl("");
                      setCaption("");
                    }} 
                    className="btn btn-sm btn-ghost rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs"
                  >
                    Verify & Publish
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
