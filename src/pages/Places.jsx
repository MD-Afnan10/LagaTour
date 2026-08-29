import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AddPlaceLocationModal from "../components/modals/AddPlaceLocationModal";
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
  Filter, 
  Heart, 
  Share2, 
  Flag, 
  Navigation, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Places() {
  const { currentUser, addPoints } = useAuth();
  
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState({ divisions: [], districts: [] });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [safetyFilter, setSafetyFilter] = useState("All"); // All, Safe, Moderate, Caution

  // Modals
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [ratingModalPlace, setRatingModalPlace] = useState(null);
  const [safetyRatingScore, setSafetyRatingScore] = useState(5);
  const [safetyReviewText, setSafetyReviewText] = useState("");
  const [reportModalPlace, setReportModalPlace] = useState(null);
  const [reportReason, setReportReason] = useState("");
  
  // Inline Comment Inputs State
  const [commentInputs, setCommentInputs] = useState({});
  const [activePhotoIdx, setActivePhotoIdx] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // 1. Fetch Divisions & Districts
  useEffect(() => {
    api.fetchLocations().then(res => {
      if (res && res.divisions) {
        setLocations(res);
      }
    }).catch(() => {});
  }, []);

  // 2. Fetch Public Places from Backend
  const loadPlaces = async () => {
    setIsLoading(true);
    const uId = currentUser?.id || currentUser?.user_id || null;
    try {
      const fetched = await api.fetchPublicPlaces({
        userId: uId,
        divisionId: selectedDivision,
        districtId: selectedDistrict,
        safetyFilter: safetyFilter,
        search: searchQuery
      });

      setPlaces(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.warn("Could not fetch public places from backend:", err.message);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, [currentUser, selectedDivision, selectedDistrict, safetyFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlaces();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter districts by selected division
  const availableDistricts = selectedDivision === "All" 
    ? locations.districts 
    : locations.districts.filter(d => d.division_id === selectedDivision);

  // 3. Handle Like Place
  const handleLikePlace = async (placeId) => {
    if (!currentUser) {
      showToast("⚠️ Please log in to like places.");
      return;
    }

    setPlaces(prev => prev.map(p => {
      if (p.id === placeId || p.place_id === placeId) {
        const nextLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked: nextLiked,
          likesCount: Math.max(0, (p.likesCount || 0) + (nextLiked ? 1 : -1))
        };
      }
      return p;
    }));

    if (addPoints) addPoints(5);

    try {
      await api.likePlace(placeId, currentUser);
    } catch (err) {
      console.warn("Like API failed:", err.message);
    }
  };

  // 4. Handle Inline Comment
  const handleInlineComment = async (placeId, e) => {
    e.preventDefault();
    const commentText = commentInputs[placeId] || "";
    if (!commentText.trim() || !currentUser) return;

    const newCommentObj = {
      id: "pc_" + Date.now(),
      user: currentUser.username || currentUser.name || "traveler",
      avatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`,
      text: commentText.trim(),
      time: "Just now"
    };

    setPlaces(prev => prev.map(p => {
      if (p.id === placeId || p.place_id === placeId) {
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [newCommentObj, ...(p.comments || [])]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [placeId]: "" }));
    if (addPoints) addPoints(10);
    showToast("💬 Comment posted!");

    try {
      await api.commentPlace(placeId, currentUser, commentText.trim());
    } catch (err) {
      console.warn("Comment API failed:", err.message);
    }
  };

  // 6. Handle Safety Rating Modal Submit
  const handleSubmitSafetyRating = async (e) => {
    e.preventDefault();
    if (!ratingModalPlace) return;

    const pId = ratingModalPlace.id || ratingModalPlace.place_id;

    try {
      const res = await api.ratePlaceSafety(pId, currentUser, safetyRatingScore, safetyReviewText);

      setPlaces(prev => prev.map(p => {
        if (p.id === pId || p.place_id === pId) {
          return {
            ...p,
            safetyRating: res.safetyRating || safetyRatingScore,
            safetyRatingCount: res.safetyRatingCount || (p.safetyRatingCount || 0) + 1
          };
        }
        return p;
      }));

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast("🛡️ Verified safety rating & review submitted!");
      if (addPoints) addPoints(15);
      setRatingModalPlace(null);
    } catch (err) {
      showToast(err.message || "Failed to submit safety rating.");
    }
  };

  // 7. Handle Report Modal Submit
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportModalPlace) return;

    const pId = reportModalPlace.id || reportModalPlace.place_id;

    try {
      await api.reportPlace(pId, currentUser, reportReason);
      showToast("🚩 Place reported. Our moderation team will verify.");
      setReportModalPlace(null);
      setReportReason("");
    } catch (err) {
      showToast(err.message || "Failed to submit report.");
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-6">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-50 animate-bounce">
          <div className="alert alert-info text-white text-xs font-bold shadow-2xl rounded-2xl py-2.5 px-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gradient-to-r from-primary/10 via-base-200 to-primary/5 p-6 rounded-3xl border border-base-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight mb-1">Explore Places & Safety</h1>
            <span className="badge badge-primary font-bold text-xs">Community Verified</span>
          </div>
          <p className="text-xs text-base-content/70 max-w-lg">
            Discover verified spots across all 64 districts in Bangladesh, record your GPS locations, and review tourist safety ratings.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddLocationOpen(true)}
          className="btn btn-primary text-slate-900 font-black rounded-2xl capitalize shadow-lg border-none gap-2 self-start md:self-auto hover:scale-105 transition-transform"
        >
          <Navigation className="w-4 h-4" /> 📍 Record Current Place
        </button>
      </div>

      {/* Filters Card */}
      <div className="card bg-base-100 border border-base-200 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-base-content/40" />
            <input 
              type="text" 
              placeholder="Search place, district, notes..." 
              className="input input-sm input-bordered w-full pl-9 text-xs rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Division Filter */}
          <div>
            <select 
              className="select select-sm select-bordered w-full text-xs rounded-xl font-semibold"
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict("All");
              }}
            >
              <option value="All">All Divisions</option>
              {locations.divisions.map((div) => (
                <option key={div.division_id} value={div.division_id}>{div.division_name}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <select 
              className="select select-sm select-bordered w-full text-xs rounded-xl font-semibold"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="All">All Districts</option>
              {availableDistricts.map((dis) => (
                <option key={dis.district_id} value={dis.district_id}>{dis.district_name}</option>
              ))}
            </select>
          </div>

          {/* Safety Filter */}
          <div>
            <select 
              className="select select-sm select-bordered w-full text-xs rounded-xl font-semibold"
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
            >
              <option value="All">All Safety Ratings</option>
              <option value="Safe">Very Safe (4.5★ - 5.0★)</option>
              <option value="Moderate">Moderate (3.5★ - 4.4★)</option>
              <option value="Caution">Exercise Caution (&lt; 3.5★)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Places Feed Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-xs text-base-content/50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="font-bold">Loading community verified places...</span>
        </div>
      ) : places.length === 0 ? (
        <div className="text-center py-16 bg-base-100 border border-base-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <Compass className="w-12 h-12 text-base-content/30 mx-auto" />
          <h3 className="font-black text-base text-base-content">No places found matching your filters</h3>
          <p className="text-xs text-base-content/60 max-w-sm mx-auto">
            Be the first traveler to record and publish a new location in this area!
          </p>
          <button
            onClick={() => setIsAddLocationOpen(true)}
            className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-2 mt-2 shadow-md"
          >
            <Navigation className="w-4 h-4" /> 📍 Record Spot Here
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {places.map((place) => {
            const pId = place.id || place.place_id;
            const images = place.images && Array.isArray(place.images) && place.images.length > 0 
              ? place.images 
              : (place.image ? [place.image] : []);
            
            const curPhotoIdx = activePhotoIdx[pId] || 0;
            const currentImg = images[curPhotoIdx] || images[0];
            const safety = parseFloat(place.safetyRating || place.safety_rating || 5.0);
            const isSafe = safety >= 4.5;
            const isCaution = safety < 3.5;

            return (
              <div 
                key={pId}
                className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between rounded-3xl"
              >
                <div>
                  
                  {/* Photo Gallery Banner */}
                  <div className="relative h-60 overflow-hidden bg-base-300 group">
                    {images.length > 0 ? (
                      <img 
                        src={currentImg} 
                        alt={place.placeName || place.name || place.place_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-base-200/80 text-base-content/40 space-y-2">
                        <MapPin className="w-10 h-10 text-primary/40" />
                        <span className="text-xs font-bold text-base-content/50">No photos attached</span>
                      </div>
                    )}

                    {/* Left/Right Photo Carousel Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActivePhotoIdx(prev => ({ ...prev, [pId]: (curPhotoIdx - 1 + images.length) % images.length }))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-xs btn-circle bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActivePhotoIdx(prev => ({ ...prev, [pId]: (curPhotoIdx + 1) % images.length }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-xs btn-circle bg-black/50 text-white border-none opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {images.map((_, idx) => (
                            <span 
                              key={idx} 
                              className={`w-1.5 h-1.5 rounded-full ${idx === curPhotoIdx ? 'bg-primary w-3' : 'bg-white/60'} transition-all`} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* District / Division Badge */}
                    <span className="absolute top-3 left-3 badge badge-neutral text-[11px] font-bold shadow-md bg-black/70 text-white border-none">
                      📍 {place.district || "Bangladesh"} • {place.division || "BD"}
                    </span>

                    {/* Safety Badge */}
                    <div className={`absolute top-3 right-3 text-xs font-black py-1 px-3 rounded-full flex items-center gap-1 shadow-lg ${
                      isSafe ? "bg-emerald-500 text-white" : isCaution ? "bg-error text-white animate-pulse" : "bg-amber-500 text-slate-900"
                    }`}>
                      {isSafe ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>Safety: {safety.toFixed(1)}★</span>
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 space-y-4">
                    
                    {/* Title & Coordinates */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h2 className="text-xl font-black m-0 leading-tight">
                          {place.name || place.place_name}
                        </h2>
                        <div className="flex items-center gap-2 text-[11px] text-base-content/60 mt-1">
                          <span>By @{place.author?.username || "traveler"}</span>
                          {place.latitude && (
                            <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              GPS: {parseFloat(place.latitude).toFixed(3)}, {parseFloat(place.longitude).toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-yellow-500 font-black text-sm shrink-0 bg-yellow-500/10 px-2.5 py-1 rounded-xl">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{safety.toFixed(1)}</span>
                        <span className="text-[10px] text-base-content/50 font-normal">({place.safetyRatingCount || 1})</span>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-base-content/80 leading-relaxed">
                      {place.description || "Scenic travel destination recorded by community traveler."}
                    </p>

                    {/* Action Bar: Like, Rate Safety, Report */}
                    <div className="flex items-center justify-between pt-3 border-t border-base-200 gap-2 flex-wrap">
                      
                      <div className="flex items-center gap-1.5">
                        {/* Like Button */}
                        <button 
                          onClick={() => handleLikePlace(pId)}
                          className={`btn btn-xs rounded-xl font-bold gap-1 ${
                            place.hasLiked ? "btn-error text-white" : "btn-ghost"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${place.hasLiked ? 'fill-current' : ''}`} />
                          <span>{place.likesCount || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Safety Rating Button - Only available if place is saved in user's My Places */}
                        {place.inMyPlaces ? (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                showToast("⚠️ Please log in to rate safety.");
                                return;
                              }
                              setRatingModalPlace(place);
                              setSafetyRatingScore(Math.round(safety));
                              setSafetyReviewText("");
                            }}
                            className="btn btn-xs btn-outline btn-warning font-bold rounded-xl gap-1 shadow-sm"
                            title="Verified visitor: Rate safety score"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Rate Safety
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              showToast("⚠️ You can only rate safety for places saved in your 'My Places'.");
                            }}
                            className="btn btn-xs btn-ghost text-[10px] text-base-content/40 hover:text-warning font-bold gap-1 opacity-60"
                            title="Only travelers who have this spot in 'My Places' can rate safety"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 opacity-40" />
                            <span>Rate Safety</span>
                          </button>
                        )}

                        {/* Report Button */}
                        <button
                          onClick={() => setReportModalPlace(place)}
                          className="btn btn-xs btn-ghost btn-circle text-base-content/40 hover:text-error"
                          title="Report this place"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* Comments Feed Section */}
                    <div className="space-y-3 pt-3 border-t border-base-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Comments ({place.commentsCount || (place.comments || []).length})
                      </span>

                      {/* Comments List */}
                      {place.comments && place.comments.length > 0 && (
                        <div className="bg-base-200/50 rounded-2xl p-3 space-y-2 max-h-36 overflow-y-auto border border-base-200">
                          {place.comments.map((comment, cIdx) => (
                            <div key={comment.id || cIdx} className="flex gap-2 text-xs">
                              <img 
                                src={comment.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.user}`} 
                                alt={comment.user} 
                                className="w-6 h-6 rounded-full object-cover bg-black/20 shrink-0 mt-0.5" 
                              />
                              <div className="flex-1 bg-base-100 p-2 rounded-xl border border-base-300">
                                <div className="flex justify-between items-center text-[10px] font-bold text-base-content/60 mb-0.5">
                                  <span>@{comment.user}</span>
                                  <span>{comment.time || "Recent"}</span>
                                </div>
                                <p className="text-xs text-base-content/90 font-medium m-0 leading-tight">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input Form */}
                      {currentUser ? (
                        <form onSubmit={(e) => handleInlineComment(pId, e)} className="flex gap-1.5 pt-1">
                          <input 
                            type="text" 
                            placeholder="Share safety tip or local update..." 
                            className="input input-xs input-bordered w-full rounded-xl text-xs py-3" 
                            value={commentInputs[pId] || ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [pId]: e.target.value }))}
                          />
                          <button 
                            type="submit" 
                            disabled={!commentInputs[pId]?.trim()} 
                            className="btn btn-xs btn-primary text-slate-900 rounded-xl px-2.5 font-bold shrink-0"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <p className="text-[11px] text-base-content/50 italic text-center">
                          Log in to leave comments and safety tips.
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add / Record Place Location */}
      <AddPlaceLocationModal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        currentUser={currentUser}
        onPlaceAdded={() => {
          showToast("📍 Spot recorded in 'My Places'! Head to your profile to edit and publish.");
          loadPlaces();
        }}
      />

      {/* Modal 2: Verified Safety Rating */}
      {ratingModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-md bg-base-100 border border-base-200 shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-base m-0">Rate Place Safety</h3>
              </div>
              <button onClick={() => setRatingModalPlace(null)} className="btn btn-ghost btn-xs btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-base-content/70">
              Your verified rating helps travelers know the security and safety level of <strong>{ratingModalPlace.name || ratingModalPlace.place_name}</strong>.
            </p>

            <form onSubmit={handleSubmitSafetyRating} className="space-y-4">
              <div className="card bg-base-200/60 p-4 rounded-2xl space-y-2 text-center">
                <span className="text-xs font-bold text-base-content/70">Safety Rating Level</span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSafetyRatingScore(star)}
                      className={`btn btn-sm btn-circle ${
                        safetyRatingScore >= star ? "btn-warning" : "btn-ghost"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${safetyRatingScore >= star ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-amber-500">
                  {safetyRatingScore >= 4.5 ? "Very Safe (Tourist Friendly)" : safetyRatingScore >= 3.5 ? "Moderate Safety" : "Exercise Caution"}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-base-content/80">Safety Review Note (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Well lit at night, local police booth nearby, safe for solo travelers..."
                  value={safetyReviewText}
                  onChange={(e) => setSafetyReviewText(e.target.value)}
                  className="textarea textarea-bordered w-full rounded-2xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRatingModalPlace(null)} className="btn btn-sm btn-ghost rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl shadow-md">
                  Submit Safety Rating (+15 Pts)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Report Place */}
      {reportModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-md bg-base-100 border border-base-200 shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2 text-error">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-base m-0">Report Place</h3>
              </div>
              <button onClick={() => setReportModalPlace(null)} className="btn btn-ghost btn-xs btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-base-content/70">
              Report incorrect location coordinates, safety hazards, or inappropriate photos for <strong>{reportModalPlace.name || reportModalPlace.place_name}</strong>.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Reason for report (e.g. Danger zone without warning, private property, inaccurate coordinates)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="textarea textarea-bordered w-full rounded-2xl text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReportModalPlace(null)} className="btn btn-sm btn-ghost rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-error text-white font-bold rounded-xl">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
