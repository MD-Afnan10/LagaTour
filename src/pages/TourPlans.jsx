import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useExpeditions } from "../context/ExpeditionContext";
import ExpeditionCard from "../components/expedition/ExpeditionCard";
import LiveExpeditionTracker from "../components/expedition/LiveExpeditionTracker";
import ExpeditionFormModal from "../components/expedition/ExpeditionFormModal";
import ExpeditionSummaryModal from "../components/expedition/ExpeditionSummaryModal";
import ExpeditionDetailModal from "../components/expedition/ExpeditionDetailModal";
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
  Send,
  Radio,
  Trophy,
  Sparkles,
  Layers,
  ArrowRight,
  Play,
  Edit3,
  CheckCircle2,
  ListFilter
} from "lucide-react";
import confetti from "canvas-confetti";

export default function TourPlans() {
  const { currentUser, addPoints } = useAuth();
  const { 
    expeditions, 
    activeExpedition, 
    startExpedition, 
    deleteExpedition, 
    publishToSocialFeed 
  } = useExpeditions();

  const isAdmin = currentUser?.isAdmin || currentUser?.email?.toLowerCase().startsWith("admin");

  // Tab State: 'expeditions' | 'live_tracker' | 'community'
  const [activeTab, setActiveTab] = useState(() => {
    return activeExpedition ? "live_tracker" : "expeditions";
  });

  // Sub-category filter for expeditions tab: 'all' | 'ongoing' | 'planned' | 'completed'
  const [statusCategory, setStatusCategory] = useState("all");

  // Focused Expedition for live tracker
  const [focusedExpeditionId, setFocusedExpeditionId] = useState(() => {
    return activeExpedition?.id || (expeditions[0]?.id || null);
  });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpedition, setEditingExpedition] = useState(null);
  
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryExpedition, setSummaryExpedition] = useState(null);

  const [detailModalExpedition, setDetailModalExpedition] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [selectedTransport, setSelectedTransport] = useState("All");
  const [maxBudget, setMaxBudget] = useState(60000);

  // Community Tour ratings & comments
  const [hiddenPlans, setHiddenPlans] = useState(() => {
    const saved = localStorage.getItem("ts_hidden_plans");
    return saved ? JSON.parse(saved) : [];
  });
  const [reviewRatings, setReviewRatings] = useState({});
  const [tourCommentInputs, setTourCommentInputs] = useState({});

  const toggleHidePlan = (planId) => {
    setHiddenPlans(prev => {
      const updated = prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId];
      localStorage.setItem("ts_hidden_plans", JSON.stringify(updated));
      return updated;
    });
  };

  // Get current focused expedition object
  const focusedExpedition = expeditions.find(e => e.id === focusedExpeditionId) || activeExpedition || expeditions[0] || null;

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingExpedition(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpedition(exp);
    setIsFormModalOpen(true);
  };

  const handleStartExpedition = (expId) => {
    startExpedition(expId);
    setFocusedExpeditionId(expId);
    setActiveTab("live_tracker");
  };

  const handleTrackExpedition = (exp) => {
    setFocusedExpeditionId(exp.id);
    setActiveTab("live_tracker");
  };

  const handleViewSummary = (exp) => {
    setSummaryExpedition(exp);
    setIsSummaryModalOpen(true);
  };

  // Filter Expeditions List
  const filteredExpeditions = expeditions.filter(exp => {
    if (!isAdmin && hiddenPlans.includes(exp.id)) return false;

    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exp.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.startingLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusCategory === "all" || exp.status === statusCategory;
    const matchesType = selectedType === "All" || exp.travelType === selectedType;
    const matchesSeason = selectedSeason === "All" || exp.season === selectedSeason;
    const matchesBudget = exp.targetBudget <= maxBudget;

    return matchesSearch && matchesStatus && matchesType && matchesSeason && matchesBudget;
  });

  const ongoingCount = expeditions.filter(e => e.status === "ongoing").length;
  const plannedCount = expeditions.filter(e => e.status === "planned").length;
  const completedCount = expeditions.filter(e => e.status === "completed").length;

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-7xl space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">
              🗺️ Expedition Engine
            </span>
            <span className="text-xs text-base-content/60">Real-time GPS Tracking & Multi-Stop Plans</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1 mb-0 text-base-content">
            Tour Plans & Live Expeditions
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Plan multi-stop circuits with hotels, houseboats, and camping, upload tour photos, track journeys in real-time, and view full expedition history.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={handleOpenCreateModal}
            className="btn btn-primary text-primary-content font-black rounded-2xl capitalize shadow-lg shadow-primary/20 gap-2 border-none"
          >
            <Plus className="w-4 h-4" /> Plan New Expedition
          </button>
        </div>
      </div>

      {/* Ongoing Live Alert / Promotional Spot */}
      {activeExpedition ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-error/15 via-warning/15 to-primary/15 border border-error/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-error text-white flex items-center justify-center font-black animate-pulse shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-error badge-xs text-white font-bold animate-ping">●</span>
                <span className="text-xs font-black text-error uppercase tracking-wider">Live Tour in Progress</span>
              </div>
              <h4 className="font-bold text-sm text-base-content m-0">
                {activeExpedition.title}
              </h4>
            </div>
          </div>

          <button 
            onClick={() => handleTrackExpedition(activeExpedition)}
            className="btn btn-sm btn-error text-white font-black rounded-xl gap-1.5 shadow"
          >
            <Radio className="w-3.5 h-3.5" /> Jump to Live Cockpit
          </button>
        </div>
      ) : (
        <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-secondary/10 border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary badge-xs font-bold uppercase tracking-wider">✨ Ready For Adventure</span>
                <span className="text-xs font-semibold text-base-content/60">No Live Tour Ongoing</span>
              </div>
              <h4 className="font-black text-sm md:text-base text-base-content m-0 mt-0.5">
                Ready for your next journey? Create a new expedition now!
              </h4>
              <p className="text-xs text-base-content/60 m-0 hidden sm:block">
                Plan multi-stop circuits with hotels & houseboats, invite companions, and track your GPS live.
              </p>
            </div>
          </div>

          <button 
            onClick={handleOpenCreateModal}
            className="btn btn-sm md:btn-md btn-primary text-primary-content font-black rounded-2xl gap-2 shadow-lg shadow-primary/25 border-none hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Create a New Expedition Now
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          
          <button 
            onClick={() => setActiveTab("expeditions")}
            className={`btn btn-sm rounded-xl font-bold gap-2 text-xs ${
              activeTab === "expeditions" 
                ? 'btn-primary text-primary-content shadow-md' 
                : 'btn-ghost'
            }`}
          >
            <Layers className="w-4 h-4" /> My Expeditions & Plans ({expeditions.length})
          </button>

          <button 
            onClick={() => setActiveTab("live_tracker")}
            className={`btn btn-sm rounded-xl font-bold gap-2 text-xs relative ${
              activeTab === "live_tracker" 
                ? 'btn-primary text-primary-content shadow-md' 
                : 'btn-ghost'
            }`}
          >
            <Radio className="w-4 h-4 text-error" /> Live Tracking Cockpit
            {activeExpedition && (
              <span className="w-2 h-2 rounded-full bg-error animate-ping absolute top-2 right-2"></span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("community")}
            className={`btn btn-sm rounded-xl font-bold gap-2 text-xs ${
              activeTab === "community" 
                ? 'btn-primary text-primary-content shadow-md' 
                : 'btn-ghost'
            }`}
          >
            <Compass className="w-4 h-4" /> Community Itineraries & Reviews
          </button>

        </div>

        {/* Tab Status Counter */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-base-content/60 font-semibold">
          <span className="flex items-center gap-1 text-error">
            <span className="w-2 h-2 rounded-full bg-error"></span> {ongoingCount} Live
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary"></span> {plannedCount} Planned
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-success">
            <span className="w-2 h-2 rounded-full bg-success"></span> {completedCount} Completed
          </span>
        </div>

      </div>

      {/* ===================== TAB 1: ALL EXPEDITIONS & USER LIST ===================== */}
      {activeTab === "expeditions" && (
        <div className="space-y-6">
          
          {/* Status Sub-filter pills (All, Ongoing, Planned, Completed) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusCategory("all")}
              className={`btn btn-xs rounded-xl font-bold text-xs ${
                statusCategory === "all" ? "btn-neutral" : "btn-ghost border border-base-300"
              }`}
            >
              All Tours ({expeditions.length})
            </button>

            <button
              onClick={() => setStatusCategory("ongoing")}
              className={`btn btn-xs rounded-xl font-bold text-xs gap-1.5 ${
                statusCategory === "ongoing" ? "btn-error text-white" : "btn-ghost border border-base-300 text-error"
              }`}
            >
              <Radio className="w-3 h-3" /> Ongoing Live ({ongoingCount})
            </button>

            <button
              onClick={() => setStatusCategory("planned")}
              className={`btn btn-xs rounded-xl font-bold text-xs gap-1.5 ${
                statusCategory === "planned" ? "btn-primary text-primary-content" : "btn-ghost border border-base-300 text-primary"
              }`}
            >
              <Calendar className="w-3 h-3" /> Planned ({plannedCount})
            </button>

            <button
              onClick={() => setStatusCategory("completed")}
              className={`btn btn-xs rounded-xl font-bold text-xs gap-1.5 ${
                statusCategory === "completed" ? "btn-success text-white" : "btn-ghost border border-base-300 text-success"
              }`}
            >
              <Trophy className="w-3 h-3" /> Completed History ({completedCount})
            </button>
          </div>

          {/* Filter Bar */}
          <div className="card bg-base-100 border border-base-300 p-4 rounded-3xl shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              
              {/* Search Query */}
              <div className="form-control sm:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
                  <input 
                    type="text" 
                    placeholder="Search tour by place, city, title..." 
                    className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Travel Style */}
              <div className="form-control">
                <select 
                  className="select select-sm select-bordered w-full rounded-xl text-xs"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All">All Styles</option>
                  <option value="Friends">Friends Group</option>
                  <option value="Solo">Solo Traveler</option>
                  <option value="Couple">Couple Getaway</option>
                  <option value="Family">Family Trip</option>
                </select>
              </div>

              {/* Season */}
              <div className="form-control">
                <select 
                  className="select select-sm select-bordered w-full rounded-xl text-xs"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  <option value="All">All Seasons</option>
                  <option value="Monsoon">Monsoon</option>
                  <option value="Winter">Winter</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              {/* Max Budget Slider */}
              <div className="form-control flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-bold text-base-content/70">
                  <span>Max Budget</span>
                  <span className="text-primary font-black">{maxBudget.toLocaleString()} BDT</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="60000" 
                  step="2000"
                  className="range range-primary range-xs" 
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                />
              </div>

            </div>
          </div>

          {/* Expeditions Grid */}
          {filteredExpeditions.length === 0 ? (
            statusCategory === "ongoing" ? (
              <div className="text-center py-14 px-6 bg-gradient-to-b from-base-100 to-base-200/50 border border-primary/20 rounded-3xl space-y-4 shadow-sm max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-xl text-base-content">No Active Ongoing Expedition</h3>
                  <p className="text-xs md:text-sm text-base-content/60 max-w-md mx-auto">
                    Any previous tour has been completed and saved to your <b>Completed History</b>. Ready to start your next adventure?
                  </p>
                </div>
                <button 
                  onClick={handleOpenCreateModal} 
                  className="btn btn-primary text-primary-content font-black rounded-2xl px-6 shadow-lg shadow-primary/20 gap-2 hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" /> Create a New Expedition Now
                </button>
              </div>
            ) : (
              <div className="text-center py-16 bg-base-100 border border-base-300 rounded-3xl space-y-3">
                <Compass className="w-12 h-12 text-base-content/30 mx-auto" />
                <h3 className="font-bold text-base text-base-content/80">No tour expeditions match your filters</h3>
                <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                  Try widening your budget filter or search for other locations.
                </p>
                <button onClick={handleOpenCreateModal} className="btn btn-sm btn-primary text-primary-content rounded-xl font-bold">
                  Plan a New Tour
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExpeditions.map(exp => (
                <ExpeditionCard 
                  key={exp.id}
                  expedition={exp}
                  onStart={handleStartExpedition}
                  onTrack={handleTrackExpedition}
                  onEdit={handleOpenEditModal}
                  onViewDetail={(e) => setDetailModalExpedition(e)}
                  onViewSummary={handleViewSummary}
                  onDelete={deleteExpedition}
                  onPublish={publishToSocialFeed}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* ===================== TAB 2: LIVE TRACKING COCKPIT ===================== */}
      {activeTab === "live_tracker" && (
        activeExpedition ? (
          <div className="space-y-4">
            <LiveExpeditionTracker 
              expedition={activeExpedition} 
              onBack={() => setActiveTab("expeditions")}
              onCreateNew={handleOpenCreateModal}
            />
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-300 p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-sm max-w-3xl mx-auto my-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '20s' }} />
            </div>

            <div className="space-y-2">
              <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">
                📡 Live Cockpit Standby
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-base-content m-0">
                No Live Expedition in Progress
              </h2>
              <p className="text-sm text-base-content/60 max-w-lg mx-auto leading-relaxed">
                The live tracking cockpit activates in real time with interactive GPS maps, check-ins, and expense meters when an expedition is started. All previous tours have ended and are safely archived in your Completed History.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 space-y-1">
                <span className="text-xl">📍</span>
                <h4 className="font-bold text-xs text-base-content m-0">Live GPS Check-ins</h4>
                <p className="text-[11px] text-base-content/50 m-0">Record real-time coordinates and travel notes per stop.</p>
              </div>
              <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 space-y-1">
                <span className="text-xl">🌟</span>
                <h4 className="font-bold text-xs text-base-content m-0">Spontaneous Discoveries</h4>
                <p className="text-[11px] text-base-content/50 m-0">Pin unexpected detour spots & hidden gems on the fly.</p>
              </div>
              <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 space-y-1">
                <span className="text-xl">💰</span>
                <h4 className="font-bold text-xs text-base-content m-0">Live Expense Meter</h4>
                <p className="text-[11px] text-base-content/50 m-0">Log itemized receipts against your target budget.</p>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={handleOpenCreateModal}
                className="btn btn-primary text-primary-content font-black rounded-2xl px-8 shadow-xl shadow-primary/25 gap-2 border-none hover:scale-105 transition-all w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" /> Create a New Expedition Now
              </button>
              <button 
                onClick={() => setActiveTab("expeditions")}
                className="btn btn-ghost border border-base-300 rounded-2xl font-bold text-xs w-full sm:w-auto"
              >
                View Expeditions List
              </button>
            </div>
          </div>
        )
      )}

      {/* ===================== TAB 3: COMMUNITY ITINERARIES & REVIEWS ===================== */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-base-content">
                🌟 Community Shared Travel Stories & Ratings
              </h3>
              <p className="text-xs text-base-content/60">
                Explore itineraries published by top-ranked travelers, rate budget accuracy, and read verified traveler reviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {expeditions.filter(e => e.isPublished || e.status === "completed" || e.status === "ongoing").map(exp => (
                <div key={exp.id} className="card bg-base-200/50 border border-base-300 rounded-3xl p-5 space-y-4 hover:shadow-md transition-shadow">
                  
                  {/* Author line */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <img src={exp.author?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} alt="Author" className="w-10 h-10 rounded-full object-cover border border-base-300" />
                      <div>
                        <h4 className="font-bold text-sm text-base-content leading-tight m-0">{exp.author?.name || 'Traveler'}</h4>
                        <span className="text-[11px] text-base-content/50">@{exp.author?.username || 'traveler'} • <b className="text-amber-500">{exp.author?.league || 'Adventurer'}</b></span>
                      </div>
                    </div>
                    <span className="badge badge-primary text-primary-content font-black text-xs">{Number(exp.targetBudget).toLocaleString()} BDT</span>
                  </div>

                  <h3 className="font-black text-base text-base-content m-0">{exp.title}</h3>
                  <p className="text-xs text-base-content/75 italic line-clamp-2">"{exp.description}"</p>

                  {/* Route tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {exp.stops.map((s, i) => (
                      <span key={i} className="badge badge-sm badge-neutral text-[10px] py-1 px-2 font-semibold">
                        {s.isSpontaneous ? '🌟 ' : ''}{s.placeName}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-base-300/60">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{exp.aiScore ? `${exp.aiScore.budgetDisciplineScore}% Budget Accuracy` : '4.9 ★ Rating'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setDetailModalExpedition(exp)}
                        className="btn btn-xs btn-ghost border border-base-300 rounded-lg"
                      >
                        View Detail
                      </button>

                      <button 
                        onClick={() => handleTrackExpedition(exp)}
                        className="btn btn-xs btn-primary text-primary-content font-bold rounded-lg gap-1"
                      >
                        View Live Route <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ===================== SHARED MODALS ===================== */}

      {/* Create / Edit Expedition Form Modal */}
      {isFormModalOpen && (
        <ExpeditionFormModal 
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingExpedition(null);
          }}
          initialData={editingExpedition}
          onSaved={(savedExp) => {
            if (savedExp) {
              setFocusedExpeditionId(savedExp.id);
            }
          }}
        />
      )}

      {/* AI Summary Modal */}
      {isSummaryModalOpen && summaryExpedition && (
        <ExpeditionSummaryModal 
          isOpen={isSummaryModalOpen}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setSummaryExpedition(null);
          }}
          expedition={summaryExpedition}
        />
      )}

      {/* Full Expedition Details Modal */}
      {detailModalExpedition && (
        <ExpeditionDetailModal 
          isOpen={!!detailModalExpedition}
          onClose={() => setDetailModalExpedition(null)}
          expedition={detailModalExpedition}
          onEdit={(e) => handleOpenEditModal(e)}
          onStart={(eId) => handleStartExpedition(eId)}
          onTrack={(e) => handleTrackExpedition(e)}
          onPublish={(eId) => publishToSocialFeed(eId)}
        />
      )}

    </div>
  );
}
