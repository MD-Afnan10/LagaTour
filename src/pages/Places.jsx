import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_DESTINATIONS } from "../data/mockData";
import { 
  MapPin, 
  Star, 
  ShieldAlert, 
  ShieldCheck, 
  Compass, 
  MessageSquare, 
  Plus, 
  Send, 
  X, 
  Sparkles,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Places() {
  const { currentUser, addPoints } = useAuth();
  
  const [places, setPlaces] = useState(MOCK_DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [safetyFilter, setSafetyFilter] = useState("All"); // All, Safe, Unsafe

  // Modal State for Rating & Safety Report
  const [ratingModalPlace, setRatingModalPlace] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [markUnsafe, setMarkUnsafe] = useState(false);
  const [ratingComment, setRatingComment] = useState("");

  // Comment input state for inline comments
  const [commentInputs, setCommentInputs] = useState({});

  // Categories list
  const categories = ["All", ...new Set(places.map(p => p.category))];

  // Open modal handler
  const handleOpenRatingModal = (place) => {
    setRatingModalPlace(place);
    setUserRating(5);
    setMarkUnsafe(false);
    setRatingComment("");
  };

  // Submit Rating & Safety Report Modal
  const handleSubmitRatingModal = (e) => {
    e.preventDefault();
    if (!ratingModalPlace) return;

    setPlaces(prev => prev.map(p => {
      if (p.id === ratingModalPlace.id) {
        const newUnsafeCount = markUnsafe ? (p.unsafeCount || 0) + 1 : (p.unsafeCount || 0);
        const newComments = p.comments || [];
        
        if (ratingComment.trim()) {
          newComments.unshift({
            id: "pc_" + Date.now(),
            user: currentUser ? currentUser.username : "traveler",
            avatar: currentUser ? currentUser.avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=guest",
            text: ratingComment,
            time: "Just now"
          });
        }

        // Calculate new rating
        const currentCount = p.visitedCount || 10;
        const newScore = Number(((p.rating * currentCount + userRating) / (currentCount + 1)).toFixed(1));

        return {
          ...p,
          rating: newScore,
          unsafeCount: newUnsafeCount,
          comments: newComments
        };
      }
      return p;
    }));

    addPoints(20);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    setRatingModalPlace(null);
  };

  // Submit inline comment
  const handleInlineComment = (placeId, e) => {
    e.preventDefault();
    const commentText = commentInputs[placeId] || "";
    if (!commentText.trim()) return;

    setPlaces(prev => prev.map(p => {
      if (p.id === placeId) {
        return {
          ...p,
          comments: [
            {
              id: "pc_" + Date.now(),
              user: currentUser ? currentUser.username : "traveler",
              avatar: currentUser ? currentUser.avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=guest",
              text: commentText,
              time: "Just now"
            },
            ...(p.comments || [])
          ]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [placeId]: "" }));
    addPoints(10);
  };

  // Filtered places
  const filteredPlaces = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSafety = safetyFilter === "All" || 
                          (safetyFilter === "Safe" && (!p.unsafeCount || p.unsafeCount === 0)) ||
                          (safetyFilter === "Unsafe" && p.unsafeCount > 0);

    return matchesSearch && matchesCat && matchesSafety;
  });

  // Modal state for Adding New Place
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState("Nature");
  const [newPlaceImage, setNewPlaceImage] = useState("");
  const [newPlaceDesc, setNewPlaceDesc] = useState("");
  const [newPlaceCaption, setNewPlaceCaption] = useState("");

  const handleCreatePlace = (e) => {
    e.preventDefault();
    if (!newPlaceName || !newPlaceDesc) return;

    const createdPlace = {
      id: "dest_" + Date.now(),
      name: newPlaceName,
      lat: 23.8103,
      lng: 90.4125,
      image: newPlaceImage || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
      description: newPlaceDesc,
      caption: newPlaceCaption || "Must visit location for scenic sights!",
      rating: 5.0,
      category: newPlaceCategory,
      visitedCount: 1,
      unsafeCount: 0,
      comments: []
    };

    setPlaces([createdPlace, ...places]);
    setIsAddPlaceOpen(false);
    setNewPlaceName("");
    setNewPlaceDesc("");
    setNewPlaceCaption("");
    setNewPlaceImage("");

    addPoints(50);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2">
            <Compass className="w-7 h-7 text-primary" /> Destination Places
          </h1>
          <p className="text-sm text-base-content/60">
            Explore curated spots, read user reviews, check safety status, and rate tourist locations.
          </p>
        </div>

        <button 
          onClick={() => setIsAddPlaceOpen(true)}
          className="btn btn-primary text-primary-content font-black rounded-xl capitalize shadow-lg border-none gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Place
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card bg-base-100 border border-base-200 p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="form-control">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search place name or description..." 
                className="input input-sm input-bordered w-full pl-9 text-xs rounded-lg" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="form-control">
            <select 
              className="select select-sm select-bordered w-full text-xs rounded-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          {/* Safety Status Filter */}
          <div className="form-control">
            <select 
              className="select select-sm select-bordered w-full text-xs rounded-lg"
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
            >
              <option value="All">All Safety Statuses</option>
              <option value="Safe">Safe Places Only</option>
              <option value="Unsafe">Flagged Unsafe Places</option>
            </select>
          </div>
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPlaces.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-base-100 border border-base-200 rounded-2xl">
            <Compass className="w-12 h-12 text-base-content/30 mx-auto mb-2" />
            <p className="font-bold text-base-content/75">No places match your search filter</p>
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const isUnsafe = place.unsafeCount > 0;

            return (
              <div 
                key={place.id} 
                className={`card bg-base-100 border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isUnsafe ? "border-error/50 bg-error/5" : "border-base-200"
                }`}
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="relative h-56 overflow-hidden bg-base-300">
                    <img 
                      src={place.image} 
                      alt={place.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Category Pill */}
                    <span className="absolute top-3 left-3 badge badge-neutral text-xs font-bold shadow-md">
                      {place.category}
                    </span>

                    {/* Safety Status Tag */}
                    {isUnsafe ? (
                      <div className="absolute top-3 right-3 bg-error text-white font-black text-xs py-1 px-3 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span>UNSAFE ({place.unsafeCount} Reports)</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-success text-white font-bold text-xs py-1 px-3 rounded-full flex items-center gap-1 shadow-md">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verified Safe</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    
                    {/* Header: Title & Rating */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h2 className="text-xl font-black m-0 flex items-center gap-1.5">
                          <MapPin className="w-5 h-5 text-primary" /> {place.name}
                        </h2>
                        <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                          {place.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{place.rating}</span>
                        </div>
                        <span className="text-[10px] text-base-content/50">Visited {place.visitedCount}+</span>
                      </div>
                    </div>

                    {/* Worth Exploring Caption Box */}
                    {place.caption && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3.5 h-3.5" /> Worth Exploring
                        </span>
                        <p className="text-xs font-semibold text-base-content/90 italic">
                          "{place.caption}"
                        </p>
                      </div>
                    )}

                    {/* Rate & Mark Unsafe Action Button */}
                    <div className="flex justify-between items-center pt-2 border-t border-base-200">
                      <button 
                        onClick={() => handleOpenRatingModal(place)}
                        className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-1.5 shadow-sm"
                      >
                        <Star className="w-4 h-4" /> Rate & Review Place
                      </button>

                      {isUnsafe && (
                        <span className="text-[10px] text-error font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Exercise caution!
                        </span>
                      )}
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-3 pt-3 border-t border-base-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Traveler Comments ({place.comments?.length || 0})
                      </span>

                      {/* Comment Feed */}
                      {place.comments && place.comments.length > 0 && (
                        <div className="bg-base-200/50 rounded-xl p-3 space-y-2.5 max-h-48 overflow-y-auto border border-base-200">
                          {place.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 text-xs">
                              <Link to={`/profile/${comment.user}`}>
                                <img src={comment.avatar} alt={comment.user} className="w-6 h-6 rounded-full object-cover border border-base-300 mt-0.5" />
                              </Link>
                              <div className="flex-1 bg-base-100 p-2 rounded-lg border border-base-300">
                                <div className="flex justify-between items-center mb-0.5">
                                  <Link to={`/profile/${comment.user}`} className="font-bold text-primary hover:underline">
                                    @{comment.user}
                                  </Link>
                                  <span className="text-[9px] text-base-content/40">{comment.time}</span>
                                </div>
                                <p className="text-[11px] text-base-content/85">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Comment Input */}
                      <form onSubmit={(e) => handleInlineComment(place.id, e)} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Share your experience or tip about this place..." 
                          className="input input-sm input-bordered flex-1 rounded-lg text-xs"
                          value={commentInputs[place.id] || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [place.id]: e.target.value })}
                        />
                        <button type="submit" className="btn btn-sm btn-ghost btn-circle">
                          <Send className="w-4 h-4 text-primary" />
                        </button>
                      </form>

                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rate & Safety Report Modal */}
      {ratingModalPlace && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-md border border-base-300">
            <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
              <h3 className="font-black text-lg m-0 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Rate {ratingModalPlace.name}
              </h3>
              <button onClick={() => setRatingModalPlace(null)} className="btn btn-sm btn-circle btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRatingModal} className="space-y-5">
              
              {/* Star Rating selector */}
              <div className="form-control text-center space-y-2">
                <label className="label-text font-bold text-xs">Your Rating (1 to 5 Stars)</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className={`btn btn-circle btn-sm ${
                        star <= userRating ? "btn-warning text-slate-900 scale-110" : "btn-ghost border-base-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-yellow-600 block">{userRating} / 5 Stars</span>
              </div>

              {/* Safety Report Button */}
              <div className="form-control p-3 bg-base-200 border border-base-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-error" /> Mark Place as Unsafe
                  </span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-error toggle-sm"
                    checked={markUnsafe}
                    onChange={(e) => setMarkUnsafe(e.target.checked)}
                  />
                </div>
                <p className="text-[10px] text-base-content/60 leading-snug">
                  If this area has safety hazards, high water risks, or crime alerts, checking this will increment the public unsafe report count and mark it on the map.
                </p>
              </div>

              {/* Comment text area */}
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Review Comment</span></label>
                <textarea 
                  rows="3"
                  placeholder="Share details of your experience, safety tips, or things to watch out for..." 
                  className="textarea textarea-bordered w-full text-xs rounded-lg"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="modal-action border-t border-base-300 pt-3">
                <button type="button" onClick={() => setRatingModalPlace(null)} className="btn btn-sm btn-ghost rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">
                  Submit Rating & Report
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add New Place Modal */}
      {isAddPlaceOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg border border-base-300">
            <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
              <h3 className="font-black text-lg m-0 flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" /> Add Tourist Destination
              </h3>
              <button onClick={() => setIsAddPlaceOpen(false)} className="btn btn-sm btn-circle btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlace} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Place Name</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Inani Beach, Jaflong" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Category</span></label>
                  <select 
                    className="select select-sm select-bordered w-full rounded-lg text-xs"
                    value={newPlaceCategory}
                    onChange={(e) => setNewPlaceCategory(e.target.value)}
                  >
                    <option value="Beach">Beach</option>
                    <option value="Hills">Hills</option>
                    <option value="Nature">Nature</option>
                    <option value="Island">Island</option>
                    <option value="Forest">Forest</option>
                    <option value="Historic">Historic</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Image URL</span></label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..." 
                  className="input input-sm input-bordered w-full rounded-lg text-xs" 
                  value={newPlaceImage}
                  onChange={(e) => setNewPlaceImage(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Description</span></label>
                <textarea 
                  rows="2"
                  placeholder="Short description of this tourist location..." 
                  className="textarea textarea-bordered w-full text-xs rounded-lg" 
                  value={newPlaceDesc}
                  onChange={(e) => setNewPlaceDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-xs font-bold flex items-center gap-1 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" /> Things Worth Exploring (Caption)
                  </span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Secret waterfalls, sunset view points, grilled fish..." 
                  className="input input-sm input-bordered w-full rounded-lg text-xs" 
                  value={newPlaceCaption}
                  onChange={(e) => setNewPlaceCaption(e.target.value)}
                />
              </div>

              <div className="modal-action border-t border-base-300 pt-3">
                <button type="button" onClick={() => setIsAddPlaceOpen(false)} className="btn btn-sm btn-ghost rounded-lg text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">
                  Add Destination
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
