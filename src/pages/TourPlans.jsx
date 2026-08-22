import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_TOUR_PLANS, MOCK_DESTINATIONS } from "../data/mockData";
import { 
  Search, 
  Filter, 
  Map, 
  Plus, 
  Star, 
  DollarSign, 
  Clock, 
  Calendar, 
  Car, 
  Home as HomeIcon,
  CheckCircle,
  TrendingUp,
  X,
  Compass,
  Smile,
  ArrowUp,
  ArrowDown,
  Send
} from "lucide-react";
import confetti from "canvas-confetti";

export default function TourPlans() {
  const { currentUser, addPoints } = useAuth();
  
  const [plans, setPlans] = useState(MOCK_TOUR_PLANS);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [selectedTransport, setSelectedTransport] = useState("All");
  const [maxBudget, setMaxBudget] = useState(25000);

  // Create Form States - Multi-place Circuit
  const [title, setTitle] = useState("");
  const [startingLocation, setStartingLocation] = useState("Dhaka");
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0].name);
  const [duration, setDuration] = useState(4);
  const [tips, setTips] = useState("");
  const [travelType, setTravelType] = useState("Friends");
  const [season, setSeason] = useState("Winter");

  // Dynamic Places & Stops Array
  const [legs, setLegs] = useState([
    {
      id: "leg_init_1",
      from: "Dhaka",
      placeName: "Chittagong",
      transportMode: "Bus",
      transportCost: 1200,
      accommodation: "Hotel Peninsula",
      accommodationCost: 3500,
      otherCosts: 1800,
      stayDuration: "1 Day",
      activities: "Batali Hill & Patenga Beach sunset"
    },
    {
      id: "leg_init_2",
      from: "Chittagong",
      placeName: "Cox's Bazar",
      transportMode: "Aeroplane",
      transportCost: 4500,
      accommodation: "Sayeman Beach Resort",
      accommodationCost: 7000,
      otherCosts: 2800,
      stayDuration: "2 Days",
      activities: "Laboni Beach evening, Inani Beach drive"
    },
    {
      id: "leg_init_3",
      from: "Cox's Bazar",
      placeName: "Dhaka",
      transportMode: "Bus",
      transportCost: 1200,
      accommodation: "Overnight Bus",
      accommodationCost: 0,
      otherCosts: 500,
      stayDuration: "1 Night",
      activities: "Return bus trip to Dhaka"
    }
  ]);

  // Leg Management Helpers
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const prevDest = lastLeg ? lastLeg.placeName : startingLocation;
    setLegs([
      ...legs,
      {
        id: "leg_" + Date.now(),
        from: prevDest,
        placeName: "New Location",
        transportMode: "Bus",
        transportCost: 1000,
        accommodation: "Hotel / Resort Name",
        accommodationCost: 2500,
        otherCosts: 1000,
        stayDuration: "1 Day",
        activities: "Sightseeing"
      }
    ]);
  };

  const handleUpdateLeg = (index, field, val) => {
    const updated = [...legs];
    updated[index][field] = val;
    setLegs(updated);
  };

  const handleRemoveLeg = (index) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, idx) => idx !== index));
  };

  // Community Review state
  const [reviewRatings, setReviewRatings] = useState({});
  const [tourCommentInputs, setTourCommentInputs] = useState({});

  // Multi-place Total Budget Calculation
  const totalLegsTransport = legs.reduce((sum, l) => sum + Number(l.transportCost || 0), 0);
  const totalLegsAccom = legs.reduce((sum, l) => sum + Number(l.accommodationCost || 0), 0);
  const totalLegsOther = legs.reduce((sum, l) => sum + Number(l.otherCosts || 0), 0);
  const calculatedTotalBudget = totalLegsTransport + totalLegsAccom + totalLegsOther;

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!title || legs.length === 0) return;

    // Build places visited array from legs
    const placesList = legs.map(l => l.placeName);
    const primaryTransport = legs.map(l => l.transportMode).filter((v, i, a) => a.indexOf(v) === i).join(" & ");
    const primaryAccom = legs.map(l => l.accommodation).filter(a => a && a !== "N/A").join(" & ");

    const newPlan = {
      id: "plan_" + Date.now(),
      title: title,
      destinationId: MOCK_DESTINATIONS.find(d => d.name === destination)?.id || "dest_1",
      destinationName: destination,
      startingLocation: startingLocation,
      transportation: primaryTransport || "Multi-Transport",
      accommodation: primaryAccom || "Hotels & Resorts",
      placesVisited: placesList,
      legs: legs,
      duration: Number(duration),
      totalBudget: calculatedTotalBudget,
      expenseBreakdown: [
        { category: "Transport Total", amount: totalLegsTransport },
        { category: "Accommodation Total", amount: totalLegsAccom },
        { category: "Other Costs Total", amount: totalLegsOther }
      ],
      travelTips: tips,
      photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"],
      rating: 5.0,
      ratingsCount: 1,
      budgetAccuracy: 5.0,
      experienceRating: 5.0,
      author: currentUser,
      travelType: travelType,
      season: season,
      likes: 0,
      comments: []
    };

    setPlans([newPlan, ...plans]);
    
    // Award traveler points for plan sharing!
    const result = addPoints(100);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    if (result && result.leveledUp) {
      alert(`🎉 Congratulation! You leveled up to ${result.league}!`);
    }

    // Reset Form
    setIsFormOpen(false);
    setTitle("");
    setTips("");
  };

  const handleVote = (planId, voteType) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        let netScoreChange = 0;
        let nextVote = null;

        const currentVote = p.userVote; // 'up', 'down', or null

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
          ...p,
          likes: p.likes + netScoreChange,
          userVote: nextVote
        };
      }
      return p;
    }));
    addPoints(5);
  };

  const handleTourCommentSubmit = (planId, e) => {
    e.preventDefault();
    const commentText = tourCommentInputs[planId] || "";
    if (!commentText.trim() || !currentUser) return;

    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          comments: [
            ...(p.comments || []),
            { user: currentUser.username, text: commentText }
          ]
        };
      }
      return p;
    }));

    setTourCommentInputs(prev => ({ ...prev, [planId]: "" }));
    addPoints(10);
  };

  // User submits a rating
  const handleRatingSubmit = (planId, aspect, val) => {
    setReviewRatings(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [aspect]: val
      }
    }));

    // Instantly update rating stats for the card
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        // Average review
        const currentScore = p.rating;
        const newCount = p.ratingsCount + 1;
        const newScore = Number(((currentScore * p.ratingsCount + val) / newCount).toFixed(1));
        return {
          ...p,
          rating: newScore,
          ratingsCount: newCount
        };
      }
      return p;
    }));

    addPoints(15); // points for contributing a rating review!
  };

  // Filter logic
  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || p.travelType === selectedType;
    const matchesSeason = selectedSeason === "All" || p.season === selectedSeason;
    const matchesTransport = selectedTransport === "All" || p.transportation.toLowerCase().includes(selectedTransport.toLowerCase());
    const matchesBudget = p.totalBudget <= maxBudget;

    return matchesSearch && matchesType && matchesSeason && matchesTransport && matchesBudget;
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Trip Itineraries</h1>
          <p className="text-sm text-base-content/60">Search, rate, and duplicate travel budgets shared by experienced guides.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary text-primary-content font-black rounded-xl capitalize shadow-lg border-none gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Share Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel */}
        <div className="card bg-base-100 border border-base-200 p-4 h-fit space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2">
            <Filter className="w-4 h-4 text-primary" /> Filter Plans
          </h3>

          {/* Destination Query */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-semibold">Search Destination</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="e.g. Sajek..." 
                className="input input-sm input-bordered w-full pl-9 text-xs" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Budget Range Slider */}
          <div className="form-control">
            <div className="flex justify-between items-center py-1">
              <span className="label-text text-xs font-semibold">Max Budget</span>
              <span className="text-xs font-bold text-primary">{maxBudget} BDT</span>
            </div>
            <input 
              type="range" 
              min="5000" 
              max="50000" 
              step="1000"
              className="range range-primary range-xs" 
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
            />
          </div>

          {/* Travel Type */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-semibold">Travel Type</span></label>
            <select 
              className="select select-sm select-bordered w-full text-xs"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Solo">Solo Traveler</option>
              <option value="Friends">Friends Group</option>
              <option value="Family">Family Trip</option>
              <option value="Couple">Couple Getaway</option>
            </select>
          </div>

          {/* Season */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-semibold">Season</span></label>
            <select 
              className="select select-sm select-bordered w-full text-xs"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              <option value="All">All Seasons</option>
              <option value="Winter">Winter</option>
              <option value="Monsoon">Monsoon</option>
              <option value="Autumn">Autumn</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>
          </div>

          {/* Transportation */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-semibold">Transportation</span></label>
            <select 
              className="select select-sm select-bordered w-full text-xs"
              value={selectedTransport}
              onChange={(e) => setSelectedTransport(e.target.value)}
            >
              <option value="All">All Transports</option>
              <option value="Bus">Bus</option>
              <option value="Train">Train</option>
              <option value="Jeep">Jeep / SUV</option>
              <option value="Ship">Launch / Ship</option>
            </select>
          </div>
        </div>

        {/* Plans Directory */}
        <div className="lg:col-span-3 space-y-6">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12 bg-base-100 border border-base-200 rounded-2xl">
              <Compass className="w-12 h-12 text-base-content/30 mx-auto mb-2" />
              <p className="font-bold text-base-content/75">No matching tour plans found</p>
              <p className="text-xs text-base-content/50 mt-1">Try widening your budget filter or searching another town.</p>
            </div>
          ) : (
            filteredPlans.map(plan => (
              <div key={plan.id} className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${plan.author.id || plan.author.username}`}>
                      <img src={plan.author.avatar} alt={plan.author.name} className="w-11 h-11 rounded-full object-cover border border-base-300 hover:opacity-85 transition-opacity" />
                    </Link>
                    <div>
                      <h3 className="font-black text-md leading-tight m-0">{plan.title}</h3>
                      <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                        <span>By </span>
                        <Link to={`/profile/${plan.author.id || plan.author.username}`} className="font-bold text-primary hover:underline">
                          @{plan.author.username}
                        </Link>
                        <span className="badge badge-xs badge-ghost text-[9px]">{plan.author.league}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <span className="badge badge-primary py-3 px-3.5 font-bold rounded-lg text-xs whitespace-nowrap shrink-0">{Number(plan.totalBudget).toLocaleString()} BDT</span>
                    <span className="badge badge-accent py-3 px-3.5 font-bold rounded-lg text-xs whitespace-nowrap shrink-0">{plan.travelType}</span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-base-200/30">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-orange-500" />
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/50 block">Destination</span>
                      <span className="text-xs font-bold">{plan.destinationName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/50 block">Duration</span>
                      <span className="text-xs font-bold">{plan.duration} Days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-green-500" />
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/50 block">Transports</span>
                      <span className="text-xs font-bold truncate max-w-[120px] inline-block">{plan.transportation}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HomeIcon className="w-4 h-4 text-purple-500" />
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/50 block">Hotels / Stays</span>
                      <span className="text-xs font-bold truncate max-w-[120px] inline-block">{plan.accommodation}</span>
                    </div>
                  </div>
                </div>

                {/* Body & Collapse Accordion */}
                <div className="p-4 md:p-6 space-y-4">
                  
                  {/* Multi-place Route Flow Visualization */}
                  {plan.legs && plan.legs.length > 0 ? (
                    <div className="bg-base-200/50 p-4 rounded-xl border border-base-300 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                        🗺️ Multi-Place Circuit Route & Itemized Costs
                      </span>
                      
                      <div className="space-y-3">
                        {plan.legs.map((leg, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-base-100 p-3 rounded-lg border border-base-300 text-xs gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="badge badge-sm badge-neutral font-bold">{leg.from || plan.startingLocation}</span>
                              <span className="text-primary font-bold text-[10px] bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                ➔ via {leg.transportMode} ({leg.transportCost} BDT)
                              </span>
                              <span className="font-black text-xs text-base-content">📍 {leg.placeName}</span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-base-content flex-wrap">
                              <span className="font-bold bg-base-200 border border-base-300 text-base-content px-2.5 py-1 rounded-lg flex items-center gap-1">
                                🏠 {leg.accommodation} ({Number(leg.accommodationCost).toLocaleString()} BDT)
                              </span>
                              {Number(leg.otherCosts) > 0 && (
                                <span className="font-bold bg-base-200 border border-base-300 text-base-content px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  🏷️ Other: {Number(leg.otherCosts).toLocaleString()} BDT
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 block mb-1">Key Places Visited</span>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.placesVisited.map((place, idx) => (
                          <span key={idx} className="badge badge-sm badge-outline text-[11px] py-2 px-2.5 rounded-md">{place}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accordion list */}
                  <div className="collapse collapse-arrow bg-base-200 border border-base-300 rounded-xl">
                    <input type="checkbox" className="peer" /> 
                    <div className="collapse-title text-xs font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> View Total Expense Split & Travel Tips
                    </div>
                    <div className="collapse-content space-y-4 pt-0">
                      
                      {/* Budget Split */}
                      <div className="border-t border-base-300 pt-3">
                        <span className="text-[10px] font-bold uppercase text-base-content/60 block mb-2">Cost Breakdown</span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {plan.expenseBreakdown.map((exp, idx) => (
                            <div key={idx} className="bg-base-100 p-2.5 rounded-lg border border-base-300 flex justify-between items-center text-xs">
                              <span className="text-base-content/60 font-semibold">{exp.category}</span>
                              <span className="font-bold text-primary">{exp.amount} BDT</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Travel Tips */}
                      <div className="border-t border-base-300 pt-3">
                        <span className="text-[10px] font-bold uppercase text-base-content/60 block mb-1">Organizer Tips</span>
                        <p className="text-xs text-base-content/80 italic leading-relaxed">
                          "{plan.travelTips}"
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Rating / Likes Interaction */}
                  <div className="border-t border-base-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    {/* Social Rating Stats */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-yellow-600 font-black">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{plan.rating}</span>
                        <span className="text-xs font-normal text-base-content/50">({plan.ratingsCount} reviews)</span>
                      </div>
                      
                      {/* Reddit-style Upvote & Downvote Control */}
                      <div className="flex items-center gap-1 bg-base-200 border border-base-300 rounded-full px-2 py-0.5 shadow-inner">
                        <button 
                          onClick={() => handleVote(plan.id, "up")} 
                          className={`hover:text-primary transition-colors p-1 ${plan.userVote === "up" ? "text-primary scale-110 animate-bounce" : "text-base-content/60"}`}
                          title="Upvote"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="font-black text-xs px-1.5 text-base-content min-w-[16px] text-center">{plan.likes}</span>
                        <button 
                          onClick={() => handleVote(plan.id, "down")} 
                          className={`hover:text-error transition-colors p-1 ${plan.userVote === "down" ? "text-error scale-110" : "text-base-content/60"}`}
                          title="Downvote"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Community Rating Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-base-content/60 uppercase">Rate Accuracy:</span>
                      <div className="join">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const activeReview = reviewRatings[plan.id]?.accuracy || 0;
                          return (
                            <button
                              key={starVal}
                              onClick={() => handleRatingSubmit(plan.id, "accuracy", starVal)}
                              className={`btn btn-xs join-item ${starVal <= activeReview ? 'btn-warning text-slate-900 font-bold' : 'btn-ghost border-base-300'}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                      {reviewRatings[plan.id]?.accuracy && (
                        <span className="text-[9px] bg-green-500/20 text-green-500 font-bold py-0.5 px-1.5 rounded flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> +15 pts
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Comment Section under Tour Plan Card */}
                  <div className="border-t border-base-200 pt-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 block">Discussion ({plan.comments?.length || 0})</span>
                    
                    {plan.comments && plan.comments.length > 0 && (
                      <div className="bg-base-200/50 rounded-xl p-3 space-y-2 border border-base-200 max-h-40 overflow-y-auto">
                        {plan.comments.map((comment, idx) => (
                          <div key={idx} className="text-xs text-left">
                            <span className="font-bold text-primary mr-1.5">@{comment.user}</span>
                            <span className="text-base-content/85">{comment.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment input form */}
                    <form onSubmit={(e) => handleTourCommentSubmit(plan.id, e)} className="flex gap-2 items-center pt-2">
                      <input 
                        type="text" 
                        placeholder="Ask a question about this itinerary..." 
                        className="input input-sm input-bordered flex-1 rounded-lg text-xs"
                        value={tourCommentInputs[plan.id] || ""}
                        onChange={(e) => setTourCommentInputs({ ...tourCommentInputs, [plan.id]: e.target.value })}
                      />
                      <button type="submit" className="btn btn-sm btn-ghost btn-circle">
                        <Send className="w-4 h-4 text-primary" />
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* Plan Creator Modal Form */}
      {isFormOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-2xl border border-base-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
              <h3 className="font-black text-lg m-0 flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" /> Create Trip Itinerary
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="btn btn-sm btn-circle btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Itinerary Title</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dhaka ➔ Chittagong ➔ Cox's Bazar Circuit" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Main Destination</span></label>
                  <select 
                    className="select select-sm select-bordered w-full rounded-lg text-xs"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {MOCK_DESTINATIONS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Trip Origin (Starting Location)</span></label>
                  <input 
                    type="text" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={startingLocation}
                    onChange={(e) => setStartingLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Total Duration (Days)</span></label>
                  <input 
                    type="number" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>

              </div>

              {/* Multi-Place Legs Builder */}
              <div className="border border-base-300 p-4 rounded-xl space-y-4 bg-base-200/40">
                <div className="flex justify-between items-center border-b border-base-300 pb-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-primary block">
                      🗺️ Multi-Place Circuit Builder
                    </span>
                    <span className="text-[10px] text-base-content/60">Configure transport, accommodation, and costs for each place/leg</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddLeg}
                    className="btn btn-xs btn-primary text-slate-900 font-bold rounded-lg gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Place/Stop
                  </button>
                </div>

                <div className="space-y-3">
                  {legs.map((leg, index) => (
                    <div key={leg.id || index} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="badge badge-sm badge-neutral font-bold text-[10px]">
                          Stop #{index + 1}: {leg.from} ➔ {leg.placeName || "Next Place"}
                        </span>
                        {legs.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveLeg(index)}
                            className="text-xs text-error font-bold hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        
                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Location / Place Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Chittagong, Cox's Bazar"
                            className="input input-xs input-bordered w-full rounded"
                            value={leg.placeName}
                            onChange={(e) => handleUpdateLeg(index, "placeName", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Transport Service</label>
                          <select 
                            className="select select-xs select-bordered w-full rounded"
                            value={leg.transportMode}
                            onChange={(e) => handleUpdateLeg(index, "transportMode", e.target.value)}
                          >
                            <option value="Bus">Bus</option>
                            <option value="Aeroplane">Aeroplane</option>
                            <option value="Train">Train</option>
                            <option value="Jeep">Jeep / SUV</option>
                            <option value="Launch">Launch / Ship</option>
                            <option value="Local Rickshaw">Local Transport</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Transport Cost (BDT)</label>
                          <input 
                            type="number" 
                            className="input input-xs input-bordered w-full rounded"
                            value={leg.transportCost}
                            onChange={(e) => handleUpdateLeg(index, "transportCost", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Hotel / Stay Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Seagull Hotel, Eco Cottage"
                            className="input input-xs input-bordered w-full rounded"
                            value={leg.accommodation}
                            onChange={(e) => handleUpdateLeg(index, "accommodation", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Accommodation Cost (BDT)</label>
                          <input 
                            type="number" 
                            className="input input-xs input-bordered w-full rounded"
                            value={leg.accommodationCost}
                            onChange={(e) => handleUpdateLeg(index, "accommodationCost", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-base-content/60 block mb-0.5">Other Costs (Food/Activities BDT)</label>
                          <input 
                            type="number" 
                            className="input input-xs input-bordered w-full rounded"
                            value={leg.otherCosts}
                            onChange={(e) => handleUpdateLeg(index, "otherCosts", e.target.value)}
                          />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-base-300 text-xs">
                  <span className="font-bold text-base-content/70">Calculated Multi-Place Total Budget:</span>
                  <span className="font-black text-primary text-sm">{calculatedTotalBudget} BDT</span>
                </div>
              </div>

              {/* Extra Tips */}
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Important Travel Tips</span></label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Book flights early, bring cash..." 
                  className="textarea textarea-bordered w-full text-xs rounded-lg" 
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                />
              </div>

              {/* Meta selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Traveler Group Style</span></label>
                  <select 
                    className="select select-sm select-bordered w-full rounded-lg text-xs"
                    value={travelType}
                    onChange={(e) => setTravelType(e.target.value)}
                  >
                    <option value="Solo">Solo Traveler</option>
                    <option value="Friends">Friends Group</option>
                    <option value="Family">Family Trip</option>
                    <option value="Couple">Couple Getaway</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Season Type</span></label>
                  <select 
                    className="select select-sm select-bordered w-full rounded-lg text-xs"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option value="Winter">Winter</option>
                    <option value="Monsoon">Monsoon</option>
                    <option value="Autumn">Autumn</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="modal-action border-t border-base-300 pt-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-sm btn-ghost rounded-lg text-xs">Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs flex items-center gap-1">
                  Publish Plan <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
