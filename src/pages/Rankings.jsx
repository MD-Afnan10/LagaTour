import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS, MOCK_TOUR_PLANS } from "../data/mockData";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Flame, 
  MapPin, 
  Compass, 
  User, 
  Sparkles, 
  Filter, 
  Search, 
  Map,
  ArrowUp,
  Award,
  ChevronRight,
  TrendingUp,
  Heart
} from "lucide-react";

export default function Rankings() {
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.isAdmin || currentUser?.email?.toLowerCase().startsWith("admin");

  const [bannedUsers, setBannedUsers] = useState(() => {
    const saved = localStorage.getItem("ts_banned_users");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleBanUser = (userId) => {
    setBannedUsers(prev => {
      const updated = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem("ts_banned_users", JSON.stringify(updated));
      return updated;
    });
  };

  // Tab state: 'travelers' or 'plans'
  const [activeTab, setActiveTab] = useState("travelers");

  // Traveler filters
  const [selectedLeague, setSelectedLeague] = useState("All"); // 'All', 'Legend', 'Expert', etc.
  const [travelerSearch, setTravelerSearch] = useState("");

  // Plan filters
  const [planSortBy, setPlanSortBy] = useState("rating"); // 'rating', 'likes', 'budget'
  const [planSearch, setPlanSearch] = useState("");

  // Dynamic Travelers list for leaderboard sorting
  const extendedUsers = currentUser ? [{
    id: currentUser.id || currentUser.user_id,
    name: currentUser.name || currentUser.username || "Traveler",
    username: currentUser.username || "traveler",
    avatar: currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user",
    points: currentUser.points || currentUser.league_points || 350,
    league: currentUser.league || "Explorer",
    bio: currentUser.bio || "",
    followers: currentUser.followers || 0,
    following: currentUser.following || 0,
    stats: currentUser.stats || { trips: 0, saved: 0, cities: 0 }
  }] : [];

  // Sorted & Filtered Travelers
  const sortedTravelers = [...extendedUsers]
    .filter(u => {
      const matchesSearch = (u.name || "").toLowerCase().includes(travelerSearch.toLowerCase()) || 
                            (u.username || "").toLowerCase().includes(travelerSearch.toLowerCase());
      const matchesLeague = selectedLeague === "All" || u.league === selectedLeague;
      return matchesSearch && matchesLeague;
    })
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const topThreeTravelers = sortedTravelers.slice(0, 3);

  // Sorted & Filtered Tour Plans
  const sortedPlans = [...MOCK_TOUR_PLANS]
    .filter(p => {
      return (p.title || "").toLowerCase().includes(planSearch.toLowerCase()) ||
             (p.destinationName || "").toLowerCase().includes(planSearch.toLowerCase());
    })
    .sort((a, b) => {
      if (planSortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (planSortBy === "likes") return (b.likes || 0) - (a.likes || 0);
      if (planSortBy === "budget") return (a.totalBudget || 0) - (b.totalBudget || 0); // Lowest budget first
      return (b.rating || 0) - (a.rating || 0);
    });

  // Helper for league badge styling
  const getLeagueBadgeStyle = (league) => {
    switch (league) {
      case "Legend": return "badge-error text-white font-bold animate-pulse";
      case "Expert": return "badge-warning text-slate-900 font-bold";
      case "Traveler": return "badge-success text-white font-semibold";
      case "Adventurer": return "badge-info text-white font-semibold";
      default: return "badge-neutral text-xs";
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
          <Trophy className="w-4 h-4" /> Community Leaderboards
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          Hall of Fame & Rankings
        </h1>
        <p className="text-sm md:text-base text-base-content/70">
          Recognizing the top travel contributors, master guides, and highest-rated trip itineraries in Bangladesh.
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center pt-4">
          <div className="join bg-base-200 border border-base-300 p-1 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveTab("travelers")}
              className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-6 ${
                activeTab === "travelers" ? "btn-primary text-primary-content shadow" : "btn-ghost"
              }`}
            >
              <Crown className="w-4 h-4" /> Top Travelers
            </button>
            <button 
              onClick={() => setActiveTab("plans")}
              className={`join-item btn btn-sm font-black capitalize rounded-xl gap-2 px-6 ${
                activeTab === "plans" ? "btn-primary text-primary-content shadow" : "btn-ghost"
              }`}
            >
              <Map className="w-4 h-4" /> Top Tour Plans
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: TOP TRAVELERS LEADERBOARD ================= */}
      {activeTab === "travelers" && (
        <div className="space-y-10">
          
          {/* Top 3 Podium Cards */}
          {topThreeTravelers.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
              
              {/* 2nd Place (Silver) */}
              <div className="card bg-base-100 border-2 border-slate-300 shadow-md p-6 text-center relative order-2 md:order-1 rounded-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-xs px-3 py-1 rounded-full shadow flex items-center gap-1">
                  🥈 #2 Silver
                </div>
                <Link to={`/profile/${topThreeTravelers[1].id || topThreeTravelers[1].username}`} className="mx-auto mt-2 hover:opacity-85 transition-opacity">
                  <div className="relative inline-block">
                    <img src={topThreeTravelers[1].avatar} className="w-20 h-20 rounded-full object-cover border-4 border-slate-300 shadow" alt="Avatar" />
                  </div>
                </Link>
                <h3 className="font-black text-base mt-3 m-0">
                  <Link to={`/profile/${topThreeTravelers[1].id || topThreeTravelers[1].username}`} className="hover:underline">
                    {topThreeTravelers[1].name}
                  </Link>
                </h3>
                <span className="text-xs text-base-content/60">@{topThreeTravelers[1].username}</span>
                
                <div className="mt-3 flex justify-center items-center gap-2">
                  <span className={`badge ${getLeagueBadgeStyle(topThreeTravelers[1].league)}`}>{topThreeTravelers[1].league}</span>
                  <span className="text-xs font-black text-amber-500">{topThreeTravelers[1].points.toLocaleString()} pts</span>
                </div>

                <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Trips</span>
                    <span className="font-bold">{topThreeTravelers[1].stats.trips}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Followers</span>
                    <span className="font-bold">{topThreeTravelers[1].followers}</span>
                  </div>
                </div>
              </div>

              {/* 1st Place (Gold Leader) */}
              <div className="card bg-base-100 border-4 border-amber-400 shadow-xl p-6 text-center relative order-1 md:order-2 scale-105 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-sm px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <Crown className="w-4 h-4 fill-slate-950" /> 🥇 #1 Champion
                </div>
                <Link to={`/profile/${topThreeTravelers[0].id || topThreeTravelers[0].username}`} className="mx-auto mt-3 hover:opacity-85 transition-opacity">
                  <div className="relative inline-block">
                    <img src={topThreeTravelers[0].avatar} className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl" alt="Avatar" />
                    <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" />
                  </div>
                </Link>
                <h3 className="font-black text-lg mt-3 m-0">
                  <Link to={`/profile/${topThreeTravelers[0].id || topThreeTravelers[0].username}`} className="hover:underline">
                    {topThreeTravelers[0].name}
                  </Link>
                </h3>
                <span className="text-xs text-base-content/60">@{topThreeTravelers[0].username}</span>
                
                <div className="mt-3 flex justify-center items-center gap-2">
                  <span className={`badge ${getLeagueBadgeStyle(topThreeTravelers[0].league)}`}>{topThreeTravelers[0].league}</span>
                  <span className="text-sm font-black text-amber-500">{topThreeTravelers[0].points.toLocaleString()} pts</span>
                </div>

                <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Trips</span>
                    <span className="font-bold">{topThreeTravelers[0].stats.trips}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Cities</span>
                    <span className="font-bold">{topThreeTravelers[0].stats.cities}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Followers</span>
                    <span className="font-bold">{topThreeTravelers[0].followers}</span>
                  </div>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="card bg-base-100 border-2 border-amber-700/50 shadow-md p-6 text-center relative order-3 rounded-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 font-black text-xs px-3 py-1 rounded-full shadow flex items-center gap-1">
                  🥉 #3 Bronze
                </div>
                <Link to={`/profile/${topThreeTravelers[2].id || topThreeTravelers[2].username}`} className="mx-auto mt-2 hover:opacity-85 transition-opacity">
                  <div className="relative inline-block">
                    <img src={topThreeTravelers[2].avatar} className="w-20 h-20 rounded-full object-cover border-4 border-amber-800/60 shadow" alt="Avatar" />
                  </div>
                </Link>
                <h3 className="font-black text-base mt-3 m-0">
                  <Link to={`/profile/${topThreeTravelers[2].id || topThreeTravelers[2].username}`} className="hover:underline">
                    {topThreeTravelers[2].name}
                  </Link>
                </h3>
                <span className="text-xs text-base-content/60">@{topThreeTravelers[2].username}</span>
                
                <div className="mt-3 flex justify-center items-center gap-2">
                  <span className={`badge ${getLeagueBadgeStyle(topThreeTravelers[2].league)}`}>{topThreeTravelers[2].league}</span>
                  <span className="text-xs font-black text-amber-500">{topThreeTravelers[2].points.toLocaleString()} pts</span>
                </div>

                <div className="mt-4 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Trips</span>
                    <span className="font-bold">{topThreeTravelers[2].stats.trips}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Followers</span>
                    <span className="font-bold">{topThreeTravelers[2].followers}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Traveler Search & League Filters */}
          <div className="card bg-base-100 border border-base-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                <input 
                  type="text" 
                  placeholder="Search traveler name or handle..." 
                  className="input input-sm input-bordered w-full pl-9 rounded-lg text-xs" 
                  value={travelerSearch}
                  onChange={(e) => setTravelerSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-bold text-base-content/60 shrink-0">Filter League:</span>
                {["All", "Legend", "Expert", "Adventurer", "Traveler", "Explorer"].map(league => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league)}
                    className={`btn btn-xs rounded-lg capitalize ${
                      selectedLeague === league ? "btn-primary text-primary-content font-bold" : "btn-ghost"
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Leaderboard Table */}
          <div className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200 text-base-content/70">
                    <th className="w-16 text-center">Rank</th>
                    <th>Traveler</th>
                    <th>League Tier</th>
                    <th className="text-center">Score (Pts)</th>
                    <th className="text-center">Trips Shared</th>
                    <th className="text-center">Cities Visited</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTravelers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-base-content/50">
                        No ranked travelers yet. Start earning points by posting travel stories and discovering places!
                      </td>
                    </tr>
                  ) : (
                    sortedTravelers.map((user, idx) => {
                      const rankNum = idx + 1;

                      return (
                        <tr key={user.id} className="hover">
                          <td className="text-center font-black text-sm">
                            {rankNum === 1 && <span className="text-amber-400 font-extrabold text-base">🥇 #1</span>}
                            {rankNum === 2 && <span className="text-slate-400 font-extrabold text-base">🥈 #2</span>}
                            {rankNum === 3 && <span className="text-amber-700 font-extrabold text-base">🥉 #3</span>}
                            {rankNum > 3 && <span className="text-base-content/60">#{rankNum}</span>}
                          </td>

                          <td>
                            <div className="flex items-center gap-3">
                              <Link to={`/profile/${user.id || user.username}`}>
                                <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border border-base-300 hover:opacity-85 transition-opacity" alt={user.name} />
                              </Link>
                              <div>
                                <Link to={`/profile/${user.id || user.username}`} className={`font-bold text-xs hover:underline block leading-tight ${bannedUsers.includes(user.id) ? 'line-through text-error' : ''}`}>
                                  {user.name} {bannedUsers.includes(user.id) && <span className="badge badge-error badge-xs ml-1 text-[8px]">BANNED</span>}
                                </Link>
                                <span className="text-[10px] text-base-content/50">@{user.username}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className={`badge ${getLeagueBadgeStyle(user.league)}`}>
                              {user.league}
                            </span>
                          </td>

                          <td className="text-center font-black text-amber-500">
                            {(user.points || 0).toLocaleString()} pts
                          </td>

                          <td className="text-center font-bold">
                            {user.stats?.trips || 0}
                          </td>

                          <td className="text-center font-bold">
                            {user.stats?.cities || 0}
                          </td>

                          <td className="text-right">
                            {isAdmin ? (
                              <button 
                                onClick={() => toggleBanUser(user.id)}
                                className={`btn btn-xs rounded-lg font-bold border-none shadow-md ${bannedUsers.includes(user.id) ? 'btn-warning text-slate-900' : 'btn-error text-white'}`}
                              >
                                {bannedUsers.includes(user.id) ? 'Unban' : 'Ban User'}
                              </button>
                            ) : (
                              <Link 
                                to={`/profile/${user.id || user.username}`}
                                className="btn btn-xs btn-outline btn-primary rounded-lg font-bold"
                              >
                                View Profile
                              </Link>
                            )}
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

      {/* ================= TAB 2: TOP TOUR PLAN RANKINGS ================= */}
      {activeTab === "plans" && (
        <div className="space-y-8">
          
          {/* Plan Sorting & Search Controls */}
          <div className="card bg-base-100 border border-base-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-base-content/40" />
                <input 
                  type="text" 
                  placeholder="Search plan title or destination..." 
                  className="input input-sm input-bordered w-full pl-9 rounded-lg text-xs" 
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-base-content/60 shrink-0">Sort By:</span>
                <button
                  onClick={() => setPlanSortBy("rating")}
                  className={`btn btn-xs rounded-lg capitalize gap-1 ${
                    planSortBy === "rating" ? "btn-primary text-primary-content font-bold" : "btn-ghost"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" /> Highest Rated
                </button>
                <button
                  onClick={() => setPlanSortBy("likes")}
                  className={`btn btn-xs rounded-lg capitalize gap-1 ${
                    planSortBy === "likes" ? "btn-primary text-primary-content font-bold" : "btn-ghost"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" /> Most Liked
                </button>
                <button
                  onClick={() => setPlanSortBy("budget")}
                  className={`btn btn-xs rounded-lg capitalize gap-1 ${
                    planSortBy === "budget" ? "btn-primary text-primary-content font-bold" : "btn-ghost"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Best Budget
                </button>
              </div>
            </div>
          </div>

          {/* Tour Plan Rankings Cards Grid */}
          <div className="grid grid-cols-1 gap-6">
            {sortedPlans.length === 0 ? (
              <div className="card bg-base-100 border border-dashed border-base-300 p-12 text-center text-xs text-base-content/50 rounded-3xl space-y-2">
                <Map className="w-10 h-10 mx-auto text-base-content/30" />
                <p className="font-bold text-sm text-base-content">No tour plans available yet.</p>
                <p>Create and share tour itineraries to see them ranked on the leaderboard!</p>
              </div>
            ) : (
              sortedPlans.map((plan, idx) => {
                const rankNum = idx + 1;

                return (
                  <div 
                    key={plan.id} 
                    className="card bg-base-100 border border-base-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                  >
                  {/* Left: Rank Badge + Plan Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-base-200 border border-base-300 shrink-0">
                      {rankNum === 1 && <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />}
                      {rankNum === 2 && <Medal className="w-6 h-6 text-slate-400" />}
                      {rankNum === 3 && <Award className="w-6 h-6 text-amber-700" />}
                      {rankNum > 3 && <span className="font-black text-base text-base-content/60">#{rankNum}</span>}
                    </div>

                    {/* Plan Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-lg m-0">{plan.title}</h3>
                        <span className="badge badge-accent badge-sm font-bold">{plan.travelType}</span>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-2 text-xs text-base-content/70">
                        <span>Authored by</span>
                        <Link to={`/profile/${plan.author.id || plan.author.username}`} className="flex items-center gap-1.5 font-bold hover:underline">
                          <img src={plan.author.avatar} className="w-5 h-5 rounded-full object-cover" alt="Author" />
                          <span>{plan.author.name}</span>
                        </Link>
                      </div>

                      {/* Multi-Leg Circuit Route Preview */}
                      {plan.legs && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-bold text-base-content/50 uppercase">Route:</span>
                          {plan.legs.map((leg, legIdx) => (
                            <React.Fragment key={legIdx}>
                              <span className="badge badge-xs bg-base-200 border-base-300 font-bold text-[10px]">
                                {leg.from || plan.startingLocation}
                              </span>
                              <span className="text-[10px] text-primary font-bold">➔</span>
                              {legIdx === plan.legs.length - 1 && (
                                <span className="badge badge-xs bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
                                  📍 {leg.placeName}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Stats & Action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-base-200 gap-4 shrink-0">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-yellow-500 font-black">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span>{plan.rating}</span>
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
                      View Full Itinerary <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              );
            }))}
          </div>

        </div>
      )}

    </div>
  );
}
