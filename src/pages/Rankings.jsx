import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Flame, 
  MapPin, 
  Compass, 
  Sparkles, 
  Search, 
  Map, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Heart, 
  ShieldCheck, 
  Users, 
  Bookmark, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  Zap
} from "lucide-react";

/**
 * Formats ratings to display exactly 4 digits after the decimal point (x.abcd)
 * e.g. 4.9 -> "4.9000", 5 -> "5.0000", 4.95 -> "4.9500"
 */
function formatRating(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "0.0000";
  return num.toFixed(4);
}

/**
 * Fallback avatar generator
 */
function getAvatarUrl(url, seed) {
  if (url && typeof url === "string" && url.trim().length > 0 && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"))) {
    return url;
  }
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed || "traveler")}`;
}

export default function Rankings() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?.user_id;
  const isAdmin = currentUser?.isAdmin || currentUser?.email?.toLowerCase().startsWith("admin");

  // Tab state: 'travelers' | 'guides' | 'plans' | 'places'
  const [activeTab, setActiveTab] = useState("travelers");

  // Category Guide Show/Hide toggle state
  const [showCategoryGuide, setShowCategoryGuide] = useState(true);

  // Overview data & stats
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Tab specific data
  const [travelers, setTravelers] = useState([]);
  const [guides, setGuides] = useState([]);
  const [plans, setPlans] = useState([]);
  const [places, setPlaces] = useState([]);

  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters state
  const [travelerSearch, setTravelerSearch] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [travelerSortBy, setTravelerSortBy] = useState("points");

  const [guideSearch, setGuideSearch] = useState("");
  const [guideDivision, setGuideDivision] = useState("All");

  const [planSearch, setPlanSearch] = useState("");
  const [planSortBy, setPlanSortBy] = useState("rating");
  const [planTravelType, setPlanTravelType] = useState("All");

  const [placeSearch, setPlaceSearch] = useState("");
  const [placeDivision, setPlaceDivision] = useState("All");

  // Admin ban state
  const [bannedUsers, setBannedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("ts_banned_users");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBanUser = (userId) => {
    setBannedUsers(prev => {
      const updated = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem("ts_banned_users", JSON.stringify(updated));
      return updated;
    });
  };

  // 1. Fetch Overview on Mount
  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      setErrorMsg(null);
      const res = await api.fetchRankingsOverview(currentUserId);
      if (res && res.success) {
        setOverview(res);
      }
    } catch (err) {
      console.error("Failed to load rankings overview:", err);
      setErrorMsg("Unable to load leaderboard overview. Please verify your connection.");
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [currentUserId]);

  // 2. Fetch Active Tab Data when tab or filters change
  useEffect(() => {
    let isCancelled = false;

    const loadTabData = async () => {
      setLoadingList(true);
      setErrorMsg(null);

      try {
        if (activeTab === "travelers") {
          const res = await api.fetchRankedTravelers({
            league: selectedLeague,
            search: travelerSearch,
            sortBy: travelerSortBy,
            limit: 50
          });
          if (!isCancelled && res?.success) setTravelers(res.travelers || []);
        } else if (activeTab === "guides") {
          const res = await api.fetchRankedGuides({
            search: guideSearch,
            division: guideDivision,
            limit: 50
          });
          if (!isCancelled && res?.success) setGuides(res.guides || []);
        } else if (activeTab === "plans") {
          const res = await api.fetchRankedPlans({
            sortBy: planSortBy,
            travelType: planTravelType,
            search: planSearch,
            limit: 50
          });
          if (!isCancelled && res?.success) setPlans(res.plans || []);
        } else if (activeTab === "places") {
          const res = await api.fetchRankedPlaces({
            division: placeDivision,
            search: placeSearch,
            limit: 50
          });
          if (!isCancelled && res?.success) setPlaces(res.places || []);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching ranked tab data:", err);
          setErrorMsg("Could not fetch leaderboard data. Please try again.");
        }
      } finally {
        if (!isCancelled) setLoadingList(false);
      }
    };

    const timer = setTimeout(() => {
      loadTabData();
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    activeTab,
    selectedLeague,
    travelerSearch,
    travelerSortBy,
    guideSearch,
    guideDivision,
    planSearch,
    planSortBy,
    planTravelType,
    placeSearch,
    placeDivision
  ]);

  // League badge helper
  const getLeagueBadgeStyle = (league) => {
    switch (league) {
      case "Legend": return "badge-error text-white font-black shadow-sm tracking-wide";
      case "Expert": return "badge-warning text-slate-900 font-bold";
      case "Traveler": return "badge-success text-white font-semibold";
      case "Adventurer": return "badge-info text-white font-semibold";
      default: return "badge-neutral text-xs";
    }
  };

  // Top 3 Podium selection for active tab
  const podiumItems = useMemo(() => {
    if (activeTab === "travelers") return travelers.slice(0, 3);
    if (activeTab === "guides") return guides.slice(0, 3);
    if (activeTab === "plans") return plans.slice(0, 3);
    if (activeTab === "places") return places.slice(0, 3);
    return [];
  }, [activeTab, travelers, guides, plans, places]);

  // Simple, easy-to-understand category descriptions
  const tabDescriptions = {
    travelers: {
      title: "Top Travelers Leaderboard",
      badge: "Most Active",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "This leaderboard shows the most active travelers in Bangladesh. Points are earned when you share trips, post stories, and get followers.",
      howItWorks: "Post travel stories, share your completed trips, and add new places to earn points and climb to the top."
    },
    guides: {
      title: "Master Tour Guides",
      badge: "Local Experts",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      description: "This leaderboard shows the top local tour guides. These travelers map out safe places to visit and organize group travel trips.",
      howItWorks: "Add new places on the map with safety ratings and lead group trips to rank higher as a guide."
    },
    plans: {
      title: "Top Travel Itineraries",
      badge: "Best Trips",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      description: "This leaderboard shows the best travel plans created by travelers. Plans with higher star ratings, more likes, and more saves appear first.",
      howItWorks: "Create detailed trip plans with budgets and helpful tips so other travelers can like, save, and rate them."
    },
    places: {
      title: "Top Rated Places & Spots",
      badge: "Safest Spots",
      badgeColor: "bg-secondary/10 text-secondary border-secondary/20",
      description: "This list shows the safest and most popular places to visit across Bangladesh, based on real safety ratings from travelers.",
      howItWorks: "Visit places, write safety reviews, and save places you like to help rank the best destinations."
    }
  };

  const currentDesc = tabDescriptions[activeTab];

  return (
    <div className="min-h-screen bg-base-100/50 pb-20">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl space-y-8">
        
        {/* ================= HERO HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
            <Trophy className="w-4 h-4" /> Bangladesh Travel Hall of Fame
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-base-content">
            Community Rankings & Leaderboard
          </h1>
          <p className="text-sm md:text-base text-base-content/70">
            Celebrating Bangladesh’s most active explorers, master regional guides, and top-rated travel itineraries.
          </p>

          {/* User's Personal Rank Card */}
          {currentUser && overview?.currentUserRank && (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 px-5 py-2.5 rounded-2xl shadow-sm mt-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-content font-black text-xs flex items-center justify-center">
                #{overview.currentUserRank.rank}
              </div>
              <div className="text-left text-xs">
                <span className="text-base-content/60 block">Your Standing</span>
                <span className="font-extrabold text-base-content">
                  {currentUser.name || currentUser.username} •{" "}
                  <span className="text-amber-500">{overview.currentUserRank.points.toLocaleString()} pts</span>
                  {" "}({overview.currentUserRank.league} Tier)
                </span>
              </div>
            </div>
          )}

          {/* ================= PLATFORM STATS TICKER ================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-base-100 border border-base-200 p-3.5 rounded-2xl shadow-xs text-center">
              <Users className="w-4 h-4 mx-auto text-primary mb-1" />
              <div className="font-black text-base md:text-lg text-base-content">
                {overview?.stats?.totalTravelers || 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-base-content/50">Travelers</div>
            </div>

            <div className="bg-base-100 border border-base-200 p-3.5 rounded-2xl shadow-xs text-center">
              <Compass className="w-4 h-4 mx-auto text-secondary mb-1" />
              <div className="font-black text-base md:text-lg text-base-content">
                {overview?.stats?.totalPlaces || 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-base-content/50">Mapped Places</div>
            </div>

            <div className="bg-base-100 border border-base-200 p-3.5 rounded-2xl shadow-xs text-center">
              <Map className="w-4 h-4 mx-auto text-accent mb-1" />
              <div className="font-black text-base md:text-lg text-base-content">
                {overview?.stats?.totalPlans || 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-base-content/50">Tour Itineraries</div>
            </div>

            <div className="bg-base-100 border border-base-200 p-3.5 rounded-2xl shadow-xs text-center">
              <Flame className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <div className="font-black text-base md:text-lg text-base-content">
                {overview?.stats?.totalPosts || 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-base-content/50">Travel Stories</div>
            </div>
          </div>

          {/* ================= CATEGORY TAB SWITCHER ================= */}
          <div className="flex justify-center pt-4">
            <div className="join bg-base-200/80 border border-base-300 p-1 rounded-2xl shadow-xs flex-wrap justify-center">
              <button 
                onClick={() => setActiveTab("travelers")}
                className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-4 md:px-6 transition-all ${
                  activeTab === "travelers" ? "btn-primary text-primary-content shadow" : "btn-ghost text-base-content/70"
                }`}
              >
                <Crown className="w-4 h-4" /> Top Travelers
              </button>
              <button 
                onClick={() => setActiveTab("guides")}
                className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-4 md:px-6 transition-all ${
                  activeTab === "guides" ? "btn-primary text-primary-content shadow" : "btn-ghost text-base-content/70"
                }`}
              >
                <Compass className="w-4 h-4" /> Master Guides
              </button>
              <button 
                onClick={() => setActiveTab("plans")}
                className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-4 md:px-6 transition-all ${
                  activeTab === "plans" ? "btn-primary text-primary-content shadow" : "btn-ghost text-base-content/70"
                }`}
              >
                <Map className="w-4 h-4" /> Top Tour Plans
              </button>
              <button 
                onClick={() => setActiveTab("places")}
                className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-4 md:px-6 transition-all ${
                  activeTab === "places" ? "btn-primary text-primary-content shadow" : "btn-ghost text-base-content/70"
                }`}
              >
                <MapPin className="w-4 h-4" /> Top Places
              </button>
            </div>
          </div>

          {/* ================= SIMPLE & CLEAR CATEGORY PURPOSE CARD WITH HIDE/SHOW ================= */}
          {showCategoryGuide ? (
            <div className="bg-base-100 border border-base-200/80 rounded-2xl p-4 text-left shadow-xs transition-all relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-extrabold text-sm text-base-content m-0">
                    {currentDesc.title}
                  </h3>
                  <span className={`badge badge-sm border font-bold text-[10px] ${currentDesc.badgeColor}`}>
                    {currentDesc.badge}
                  </span>
                </div>

                {/* Hide Control Button */}
                <button 
                  onClick={() => setShowCategoryGuide(false)}
                  className="btn btn-ghost btn-xs rounded-lg gap-1 text-[11px] text-base-content/60 hover:text-base-content hover:bg-base-200"
                  title="Hide this guide"
                >
                  <span>Hide guide</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-base-content/75 leading-relaxed m-0">
                {currentDesc.description}
              </p>

              <div className="mt-2 pt-2 border-t border-base-200 flex items-center gap-1.5 text-[11px] text-base-content/60">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span><strong>How to rank higher:</strong> {currentDesc.howItWorks}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={() => setShowCategoryGuide(true)}
                className="btn btn-ghost btn-xs text-xs font-semibold text-base-content/60 hover:text-primary gap-1.5 rounded-xl border border-dashed border-base-300 px-3.5 py-1.5 transition-all shadow-xs"
              >
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>About {currentDesc.title} • <strong>Show guide</strong></span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="alert alert-error shadow-sm text-xs rounded-2xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={loadOverview} className="btn btn-xs btn-ghost gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* ================= TOP 3 PODIUM HIGHLIGHT ================= */}
        {podiumItems.length >= 3 && !loadingList && (
          <div className="pt-2">
            <div className="text-center mb-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-base-content/40">
                ⭐ Top 3 Hall of Fame Podium ⭐
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              
              {/* 🥈 2nd Place (Silver) */}
              <div className="card bg-base-100 border-2 border-slate-300 shadow-md p-6 text-center relative order-2 md:order-1 rounded-3xl hover:-translate-y-1 transition-transform">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-xs px-3.5 py-1 rounded-full shadow flex items-center gap-1">
                  🥈 #2 Silver
                </div>

                {activeTab === "travelers" || activeTab === "guides" ? (
                  <>
                    <Link to={`/profile/${podiumItems[1].id || podiumItems[1].username}`} className="mx-auto mt-3 hover:opacity-85 transition-opacity block">
                      <img 
                        src={getAvatarUrl(podiumItems[1].avatar, podiumItems[1].username || podiumItems[1].id)} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-slate-300 shadow mx-auto bg-base-200" 
                        alt={podiumItems[1].name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(podiumItems[1].username || podiumItems[1].id || 'traveler')}`;
                        }}
                      />
                    </Link>
                    <h3 className="font-black text-base mt-3 m-0">
                      <Link to={`/profile/${podiumItems[1].id || podiumItems[1].username}`} className="hover:underline">
                        {podiumItems[1].name}
                      </Link>
                    </h3>
                    <span className="text-xs text-base-content/60">@{podiumItems[1].username}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className={`badge ${getLeagueBadgeStyle(podiumItems[1].league)}`}>{podiumItems[1].league}</span>
                      <span className="text-xs font-black text-amber-500">
                        {activeTab === "travelers" 
                          ? `${podiumItems[1].points.toLocaleString()} pts`
                          : `${podiumItems[1].guideScore} Score`}
                      </span>
                    </div>
                    {activeTab === "guides" && (
                      <div className="mt-2 text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(podiumItems[1].avgRating)}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Trips / Spots</span>
                        <span className="font-bold">{podiumItems[1].stats?.trips || podiumItems[1].verifiedPlaces || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Followers</span>
                        <span className="font-bold">{podiumItems[1].followers}</span>
                      </div>
                    </div>
                  </>
                ) : activeTab === "plans" ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl shadow-inner mt-2">
                      🗺️
                    </div>
                    <h3 className="font-black text-sm mt-3 line-clamp-1">{podiumItems[1].title}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[1].destination}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="badge badge-accent badge-sm font-bold">{podiumItems[1].travelType}</span>
                      <span className="text-xs font-black text-yellow-500 flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(podiumItems[1].rating)}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 line-clamp-2 mt-2">{podiumItems[1].description}</p>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">{Number(podiumItems[1].totalBudget).toLocaleString()} BDT</span>
                      <span className="text-base-content/50">{podiumItems[1].likes} likes</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={podiumItems[1].coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
                      className="w-full h-24 rounded-2xl object-cover shadow mx-auto mt-2 bg-base-200" 
                      alt={podiumItems[1].placeName} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                      }}
                    />
                    <h3 className="font-black text-sm mt-3 line-clamp-1">{podiumItems[1].placeName}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[1].district}, {podiumItems[1].division}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="text-xs font-black text-yellow-500 flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {formatRating(podiumItems[1].safetyRating)} Safety
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-500 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500" /> {podiumItems[1].likes}</span>
                      <span className="text-base-content/50">{podiumItems[1].saves} saves</span>
                    </div>
                  </>
                )}
              </div>

              {/* 🥇 1st Place (Gold Champion) */}
              <div className="card bg-base-100 border-4 border-amber-400 shadow-xl p-6 text-center relative order-1 md:order-2 scale-105 rounded-3xl bg-gradient-to-b from-amber-500/10 via-base-100 to-base-100 hover:-translate-y-2 transition-transform">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs md:text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <Crown className="w-4 h-4 fill-slate-950" /> 🥇 #1 Champion
                </div>

                {activeTab === "travelers" || activeTab === "guides" ? (
                  <>
                    <Link to={`/profile/${podiumItems[0].id || podiumItems[0].username}`} className="mx-auto mt-4 hover:opacity-85 transition-opacity block">
                      <div className="relative inline-block">
                        <img 
                          src={getAvatarUrl(podiumItems[0].avatar, podiumItems[0].username || podiumItems[0].id)} 
                          className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl bg-base-200" 
                          alt={podiumItems[0].name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(podiumItems[0].username || podiumItems[0].id || 'traveler')}`;
                          }}
                        />
                        <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" />
                      </div>
                    </Link>
                    <h3 className="font-black text-lg mt-3 m-0">
                      <Link to={`/profile/${podiumItems[0].id || podiumItems[0].username}`} className="hover:underline">
                        {podiumItems[0].name}
                      </Link>
                    </h3>
                    <span className="text-xs text-base-content/60">@{podiumItems[0].username}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className={`badge ${getLeagueBadgeStyle(podiumItems[0].league)}`}>{podiumItems[0].league}</span>
                      <span className="text-sm font-black text-amber-500">
                        {activeTab === "travelers" 
                          ? `${podiumItems[0].points.toLocaleString()} pts`
                          : `${podiumItems[0].guideScore} Score`}
                      </span>
                    </div>
                    {activeTab === "guides" && (
                      <div className="mt-2 text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500" /> {formatRating(podiumItems[0].avgRating)}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Trips</span>
                        <span className="font-bold">{podiumItems[0].stats?.trips || podiumItems[0].verifiedPlaces || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Origin</span>
                        <span className="font-bold">{podiumItems[0].city || "Dhaka"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Followers</span>
                        <span className="font-bold">{podiumItems[0].followers}</span>
                      </div>
                    </div>
                  </>
                ) : activeTab === "plans" ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-amber-100/60 flex items-center justify-center mx-auto text-3xl shadow-inner mt-2">
                      🏆
                    </div>
                    <h3 className="font-black text-base mt-3 line-clamp-1">{podiumItems[0].title}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[0].destination}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="badge badge-accent badge-sm font-bold">{podiumItems[0].travelType}</span>
                      <span className="text-xs font-black text-yellow-500 flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(podiumItems[0].rating)}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 line-clamp-2 mt-2">{podiumItems[0].description}</p>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-black text-primary text-sm">{Number(podiumItems[0].totalBudget).toLocaleString()} BDT</span>
                      <span className="font-bold text-rose-500 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500" /> {podiumItems[0].likes}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={podiumItems[0].coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
                      className="w-full h-28 rounded-2xl object-cover shadow mx-auto mt-2 bg-base-200" 
                      alt={podiumItems[0].placeName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                      }}
                    />
                    <h3 className="font-black text-base mt-3 line-clamp-1">{podiumItems[0].placeName}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[0].district}, {podiumItems[0].division}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> {formatRating(podiumItems[0].safetyRating)} Safety
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-500 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500" /> {podiumItems[0].likes} likes</span>
                      <span className="text-base-content/50">{podiumItems[0].saves} saves</span>
                    </div>
                  </>
                )}
              </div>

              {/* 🥉 3rd Place (Bronze) */}
              <div className="card bg-base-100 border-2 border-amber-700/40 shadow-md p-6 text-center relative order-3 rounded-3xl hover:-translate-y-1 transition-transform">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 font-black text-xs px-3.5 py-1 rounded-full shadow flex items-center gap-1">
                  🥉 #3 Bronze
                </div>

                {activeTab === "travelers" || activeTab === "guides" ? (
                  <>
                    <Link to={`/profile/${podiumItems[2].id || podiumItems[2].username}`} className="mx-auto mt-3 hover:opacity-85 transition-opacity block">
                      <img 
                        src={getAvatarUrl(podiumItems[2].avatar, podiumItems[2].username || podiumItems[2].id)} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-amber-800/60 shadow mx-auto bg-base-200" 
                        alt={podiumItems[2].name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(podiumItems[2].username || podiumItems[2].id || 'traveler')}`;
                        }}
                      />
                    </Link>
                    <h3 className="font-black text-base mt-3 m-0">
                      <Link to={`/profile/${podiumItems[2].id || podiumItems[2].username}`} className="hover:underline">
                        {podiumItems[2].name}
                      </Link>
                    </h3>
                    <span className="text-xs text-base-content/60">@{podiumItems[2].username}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className={`badge ${getLeagueBadgeStyle(podiumItems[2].league)}`}>{podiumItems[2].league}</span>
                      <span className="text-xs font-black text-amber-500">
                        {activeTab === "travelers" 
                          ? `${podiumItems[2].points.toLocaleString()} pts`
                          : `${podiumItems[2].guideScore} Score`}
                      </span>
                    </div>
                    {activeTab === "guides" && (
                      <div className="mt-2 text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(podiumItems[2].avgRating)}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Trips / Spots</span>
                        <span className="font-bold">{podiumItems[2].stats?.trips || podiumItems[2].verifiedPlaces || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 block">Followers</span>
                        <span className="font-bold">{podiumItems[2].followers}</span>
                      </div>
                    </div>
                  </>
                ) : activeTab === "plans" ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-2xl shadow-inner mt-2">
                      🧭
                    </div>
                    <h3 className="font-black text-sm mt-3 line-clamp-1">{podiumItems[2].title}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[2].destination}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="badge badge-accent badge-sm font-bold">{podiumItems[2].travelType}</span>
                      <span className="text-xs font-black text-yellow-500 flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(podiumItems[2].rating)}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70 line-clamp-2 mt-2">{podiumItems[2].description}</p>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">{Number(podiumItems[2].totalBudget).toLocaleString()} BDT</span>
                      <span className="text-base-content/50">{podiumItems[2].likes} likes</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={podiumItems[2].coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
                      className="w-full h-24 rounded-2xl object-cover shadow mx-auto mt-2 bg-base-200" 
                      alt={podiumItems[2].placeName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                      }}
                    />
                    <h3 className="font-black text-sm mt-3 line-clamp-1">{podiumItems[2].placeName}</h3>
                    <span className="text-xs text-base-content/60">{podiumItems[2].district}, {podiumItems[2].division}</span>
                    <div className="mt-3 flex justify-center items-center gap-2">
                      <span className="text-xs font-black text-yellow-500 flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {formatRating(podiumItems[2].safetyRating)} Safety
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-base-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-500 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500" /> {podiumItems[2].likes}</span>
                      <span className="text-base-content/50">{podiumItems[2].saves} saves</span>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: TOP TRAVELERS LEADERBOARD */}
        {/* ========================================================================= */}
        {activeTab === "travelers" && (
          <div className="space-y-6">
            
            {/* Filter & Search Bar */}
            <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                  <input 
                    type="text" 
                    placeholder="Search traveler by name or handle..." 
                    className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs" 
                    value={travelerSearch}
                    onChange={(e) => setTravelerSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <span className="text-xs font-bold text-base-content/60 shrink-0">League Tier:</span>
                  {["All", "Legend", "Expert", "Traveler", "Adventurer", "Explorer"].map(league => (
                    <button
                      key={league}
                      onClick={() => setSelectedLeague(league)}
                      className={`btn btn-xs rounded-lg capitalize ${
                        selectedLeague === league ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                      }`}
                    >
                      {league}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Travelers Table */}
            <div className="card bg-base-100 border border-base-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-xs">
                  <thead>
                    <tr className="bg-base-200/60 text-base-content/70">
                      <th className="w-16 text-center">Rank</th>
                      <th>Traveler</th>
                      <th>League Tier</th>
                      <th className="text-center">Score (Points)</th>
                      <th className="text-center">Trips Shared</th>
                      <th className="text-center">Followers</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingList ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <span className="loading loading-spinner loading-md text-primary"></span>
                          <span className="block text-xs text-base-content/50 mt-2">Loading live leaderboard...</span>
                        </td>
                      </tr>
                    ) : travelers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-base-content/50 space-y-2">
                          <Users className="w-8 h-8 mx-auto text-base-content/30" />
                          <p className="font-bold text-sm text-base-content">No ranked travelers found.</p>
                          <p className="text-xs">Try adjusting your search terms or league filters.</p>
                        </td>
                      </tr>
                    ) : (
                      travelers.map((user, idx) => {
                        const rankNum = user.rank || idx + 1;
                        const isBanned = bannedUsers.includes(user.id);

                        return (
                          <tr key={user.id} className="hover">
                            <td className="text-center font-black text-sm">
                              {rankNum === 1 && <span className="text-amber-500 font-extrabold text-base">🥇 #1</span>}
                              {rankNum === 2 && <span className="text-slate-400 font-extrabold text-base">🥈 #2</span>}
                              {rankNum === 3 && <span className="text-amber-800 font-extrabold text-base">🥉 #3</span>}
                              {rankNum > 3 && <span className="text-base-content/60 font-bold">#{rankNum}</span>}
                            </td>

                            <td>
                              <div className="flex items-center gap-3">
                                <Link to={`/profile/${user.id || user.username}`}>
                                  <img 
                                    src={getAvatarUrl(user.avatar, user.username || user.id)} 
                                    className="w-9 h-9 rounded-full object-cover border border-base-300 hover:opacity-85 transition-opacity bg-base-200" 
                                    alt={user.name}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.username || user.name || user.id || 'traveler')}`;
                                    }}
                                  />
                                </Link>
                                <div>
                                  <Link 
                                    to={`/profile/${user.id || user.username}`} 
                                    className={`font-bold text-xs hover:underline block leading-tight ${isBanned ? 'line-through text-error' : ''}`}
                                  >
                                    {user.name}
                                    {user.isVerified && <CheckCircle2 className="w-3 h-3 text-primary inline ml-1" />}
                                    {isBanned && <span className="badge badge-error badge-xs ml-1 text-[8px]">BANNED</span>}
                                  </Link>
                                  <span className="text-[10px] text-base-content/50">@{user.username} • {user.city}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className={`badge ${getLeagueBadgeStyle(user.league)}`}>
                                {user.league}
                              </span>
                            </td>

                            <td className="text-center font-black text-amber-500 text-sm">
                              {(user.points || 0).toLocaleString()} <span className="text-[10px] font-medium text-base-content/60">pts</span>
                            </td>

                            <td className="text-center font-bold">
                              {user.stats?.trips || 0}
                            </td>

                            <td className="text-center font-bold">
                              {(user.followers || 0).toLocaleString()}
                            </td>

                            <td className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isAdmin ? (
                                  <button 
                                    onClick={() => toggleBanUser(user.id)}
                                    className={`btn btn-xs rounded-lg font-bold border-none ${isBanned ? 'btn-warning text-slate-900' : 'btn-error text-white'}`}
                                  >
                                    {isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                ) : (
                                  <Link 
                                    to={`/profile/${user.id || user.username}`}
                                    className="btn btn-xs btn-outline btn-primary rounded-lg font-bold"
                                  >
                                    View
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MASTER GUIDES LEADERBOARD */}
        {/* ========================================================================= */}
        {activeTab === "guides" && (
          <div className="space-y-6">
            
            {/* Filter & Division Bar */}
            <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                  <input 
                    type="text" 
                    placeholder="Search guide by name or city..." 
                    className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs" 
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  <span className="text-xs font-bold text-base-content/60 shrink-0">Region:</span>
                  {["All", "Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal"].map(div => (
                    <button
                      key={div}
                      onClick={() => setGuideDivision(div)}
                      className={`btn btn-xs rounded-lg capitalize ${
                        guideDivision === div ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Master Guides Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingList ? (
                <div className="col-span-full text-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="block text-xs text-base-content/50 mt-2">Loading Master Guides...</span>
                </div>
              ) : guides.length === 0 ? (
                <div className="col-span-full card bg-base-100 border border-dashed border-base-300 p-12 text-center text-xs text-base-content/50 rounded-3xl space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-base-content/30" />
                  <p className="font-bold text-sm text-base-content">No local guides found.</p>
                  <p>Map places and organize expeditions to get ranked as a Master Guide!</p>
                </div>
              ) : (
                guides.map((guide, idx) => {
                  const rankNum = guide.rank || idx + 1;

                  return (
                    <div 
                      key={guide.id}
                      className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img 
                            src={getAvatarUrl(guide.avatar, guide.username || guide.id)} 
                            className="w-14 h-14 rounded-2xl object-cover border border-base-300 bg-base-200" 
                            alt={guide.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(guide.username || guide.name || guide.id || 'guide')}`;
                            }}
                          />
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-content font-black text-[10px] flex items-center justify-center shadow">
                            #{rankNum}
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <Link to={`/profile/${guide.id || guide.username}`} className="font-black text-sm hover:underline">
                              {guide.name}
                            </Link>
                            <span className="text-xs font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                              {guide.guideScore} Score
                            </span>
                          </div>
                          <span className="text-[11px] text-base-content/60 block">{guide.specialty}</span>
                          <p className="text-xs text-base-content/80 line-clamp-2 pt-1">{guide.bio}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-base-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-black flex items-center gap-1 text-yellow-500 text-xs">
                            <Star className="w-3.5 h-3.5 fill-yellow-500" /> {formatRating(guide.avgRating)}
                          </span>
                          <span className="text-base-content/60">
                            <strong>{guide.verifiedPlaces}</strong> spots mapped
                          </span>
                          <span className="text-base-content/60">
                            <strong>{guide.expeditionsLed}</strong> led
                          </span>
                        </div>

                        <Link 
                          to={`/profile/${guide.id || guide.username}`}
                          className="btn btn-xs btn-primary font-bold rounded-xl"
                        >
                          Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TOP TOUR PLAN RANKINGS */}
        {/* ========================================================================= */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            
            {/* Sorting & Search Controls */}
            <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                  <input 
                    type="text" 
                    placeholder="Search plan destination, route, title..." 
                    className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs" 
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-base-content/60 shrink-0">Sort By:</span>
                  <button
                    onClick={() => setPlanSortBy("rating")}
                    className={`btn btn-xs rounded-lg capitalize gap-1 ${
                      planSortBy === "rating" ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                    }`}
                  >
                    <Star className="w-3 h-3" /> Highest Rated
                  </button>
                  <button
                    onClick={() => setPlanSortBy("likes")}
                    className={`btn btn-xs rounded-lg capitalize gap-1 ${
                      planSortBy === "likes" ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                    }`}
                  >
                    <Heart className="w-3 h-3" /> Most Liked
                  </button>
                  <button
                    onClick={() => setPlanSortBy("budget")}
                    className={`btn btn-xs rounded-lg capitalize gap-1 ${
                      planSortBy === "budget" ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" /> Best Budget
                  </button>
                  <button
                    onClick={() => setPlanSortBy("saves")}
                    className={`btn btn-xs rounded-lg capitalize gap-1 ${
                      planSortBy === "saves" ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                    }`}
                  >
                    <Bookmark className="w-3 h-3" /> Most Saved
                  </button>
                </div>
              </div>
            </div>

            {/* Tour Plan Rankings Cards List */}
            <div className="grid grid-cols-1 gap-4">
              {loadingList ? (
                <div className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="block text-xs text-base-content/50 mt-2">Loading ranked itineraries...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="card bg-base-100 border border-dashed border-base-300 p-12 text-center text-xs text-base-content/50 rounded-3xl space-y-2">
                  <Map className="w-10 h-10 mx-auto text-base-content/30" />
                  <p className="font-bold text-sm text-base-content">No tour plans available.</p>
                  <p>Create and share tour itineraries to see them ranked on the leaderboard!</p>
                </div>
              ) : (
                plans.map((plan, idx) => {
                  const rankNum = plan.rank || idx + 1;

                  return (
                    <div 
                      key={plan.id} 
                      className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                    >
                      {/* Left: Rank Badge + Plan Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Rank Badge */}
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-base-200 border border-base-300 shrink-0 font-black text-sm">
                          {rankNum === 1 && <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />}
                          {rankNum === 2 && <Medal className="w-6 h-6 text-slate-400" />}
                          {rankNum === 3 && <Award className="w-6 h-6 text-amber-800" />}
                          {rankNum > 3 && <span className="text-base-content/60">#{rankNum}</span>}
                        </div>

                        {/* Plan Details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-base md:text-lg m-0 text-base-content">{plan.title}</h3>
                            <span className="badge badge-accent badge-sm font-bold">{plan.travelType}</span>
                            <span className="badge badge-neutral badge-sm font-semibold">{plan.durationDays} Days</span>
                          </div>

                          {/* Author */}
                          <div className="flex items-center gap-2 text-xs text-base-content/70">
                            <span>Authored by</span>
                            <Link to={`/profile/${plan.author?.id || plan.author?.username}`} className="flex items-center gap-1.5 font-bold hover:underline">
                              <img 
                                src={getAvatarUrl(plan.author?.avatar, plan.author?.username || plan.author?.id)} 
                                className="w-4 h-4 rounded-full object-cover bg-base-200" 
                                alt={plan.author?.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(plan.author?.username || plan.author?.name || 'author')}`;
                                }}
                              />
                              <span>{plan.author?.name}</span>
                            </Link>
                          </div>

                          <p className="text-xs text-base-content/70 line-clamp-2">{plan.description}</p>
                        </div>
                      </div>

                      {/* Right: Stats & Action */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-base-200 gap-3 shrink-0">
                        <div className="flex items-center gap-3 text-xs font-bold">
                          {/* Rating with exactly 4 decimal places */}
                          <div className="flex items-center gap-1 text-yellow-500 font-black">
                            <Star className="w-4 h-4 fill-yellow-500" />
                            <span className="tracking-tight">{formatRating(plan.rating)}</span>
                          </div>

                          {/* Likes */}
                          <div className="flex items-center gap-1 text-rose-500">
                            <Heart className="w-4 h-4 fill-rose-500" />
                            <span>{plan.likes}</span>
                          </div>

                          {/* Budget */}
                          <div className="badge badge-primary font-black text-xs py-2 px-3 whitespace-nowrap">
                            {Number(plan.totalBudget).toLocaleString()} BDT
                          </div>
                        </div>

                        <Link 
                          to="/plans" 
                          className="btn btn-sm btn-outline btn-primary rounded-xl font-bold gap-1 text-xs"
                        >
                          View Itinerary <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TOP TOURIST SPOTS & HIDDEN GEMS */}
        {/* ========================================================================= */}
        {activeTab === "places" && (
          <div className="space-y-6">
            
            {/* Division Filter Bar */}
            <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                  <input 
                    type="text" 
                    placeholder="Search place name, district, division..." 
                    className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs" 
                    value={placeSearch}
                    onChange={(e) => setPlaceSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  <span className="text-xs font-bold text-base-content/60 shrink-0">Division:</span>
                  {["All", "Chattogram", "Sylhet", "Khulna", "Dhaka", "Rajshahi", "Barishal"].map(div => (
                    <button
                      key={div}
                      onClick={() => setPlaceDivision(div)}
                      className={`btn btn-xs rounded-lg capitalize ${
                        placeDivision === div ? "btn-primary text-primary-content font-bold shadow-xs" : "btn-ghost"
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Places Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loadingList ? (
                <div className="col-span-full text-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="block text-xs text-base-content/50 mt-2">Loading ranked tourist spots...</span>
                </div>
              ) : places.length === 0 ? (
                <div className="col-span-full card bg-base-100 border border-dashed border-base-300 p-12 text-center text-xs text-base-content/50 rounded-3xl space-y-2">
                  <MapPin className="w-8 h-8 mx-auto text-base-content/30" />
                  <p className="font-bold text-sm text-base-content">No attractions found.</p>
                  <p>Add new places and record safety reviews to rank destinations!</p>
                </div>
              ) : (
                places.map((place, idx) => {
                  const rankNum = place.rank || idx + 1;

                  return (
                    <div 
                      key={place.id}
                      className="card bg-base-100 border border-base-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative">
                        <img 
                          src={place.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
                          className="w-full h-44 object-cover bg-base-200" 
                          alt={place.placeName} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                          }}
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white font-black text-xs px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                          #{rankNum} Ranked
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> {formatRating(place.safetyRating)} Safety
                        </div>
                      </div>

                      <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                            {place.district}, {place.division}
                          </span>
                          <h3 className="font-black text-base text-base-content line-clamp-1">{place.placeName}</h3>
                          <p className="text-xs text-base-content/70 line-clamp-2">{place.description}</p>
                        </div>

                        <div className="pt-3 border-t border-base-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-rose-500 flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 fill-rose-500" /> {place.likes}
                            </span>
                            <span className="text-base-content/50">
                              {place.saves} saves
                            </span>
                          </div>

                          <Link 
                            to="/places" 
                            className="btn btn-xs btn-outline btn-primary rounded-xl font-bold"
                          >
                            Explore
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
