import React, { useState } from "react";
import { useAuth, calculateLeague } from "../context/AuthContext";
import { MOCK_TOUR_PLANS } from "../data/mockData";
import { 
  Trophy, 
  MapPin, 
  BookOpen, 
  Star, 
  Award, 
  Sparkles, 
  Settings, 
  Save, 
  ChevronRight,
  TrendingUp,
  Compass
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, addPoints } = useAuth();
  
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [isEditing, setIsEditing] = useState(false);

  if (!currentUser) return null;

  // Determine points range for progress bar
  const getLeagueProgress = (pts) => {
    let min = 0;
    let max = 300;
    let nextLeague = "Adventurer";

    if (pts >= 4000) {
      return { percent: 100, remaining: 0, next: "Max Rank reached!" };
    } else if (pts >= 2000) {
      min = 2000;
      max = 4000;
      nextLeague = "Legend";
    } else if (pts >= 1000) {
      min = 1000;
      max = 2000;
      nextLeague = "Expert";
    } else if (pts >= 300) {
      min = 300;
      max = 1000;
      nextLeague = "Traveler";
    }

    const percent = Math.min(Math.round(((pts - min) / (max - min)) * 100), 100);
    const remaining = max - pts;

    return { percent, remaining, next: nextLeague };
  };

  const { percent, remaining, next } = getLeagueProgress(currentUser.points);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditing(false);
    currentUser.bio = bio;
    addPoints(10); // small points reward for profile customization!
  };

  // Find saved plans
  const savedPlans = MOCK_TOUR_PLANS.filter(p => p.likes > 50); // mock saved filter

  // Mock CSS Bar graph items
  const monthlyTrips = [
    { month: "Jan", count: 2, height: "h-16 bg-orange-400" },
    { month: "Feb", count: 4, height: "h-28 bg-yellow-400" },
    { month: "Mar", count: 1, height: "h-10 bg-green-400" },
    { month: "Apr", count: 3, height: "h-20 bg-sky-400" },
    { month: "May", count: 5, height: "h-36 bg-purple-400" },
    { month: "Jun", count: 6, height: "h-44 bg-primary" }
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-2 card bg-base-100 border border-base-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-full border-4 border-primary object-cover" />
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-black m-0 leading-none">{currentUser.name}</h2>
                <span className="text-xs text-base-content/50 block mt-1">@{currentUser.username}</span>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-2">
                  <textarea 
                    className="textarea textarea-bordered textarea-sm w-full text-xs rounded-lg"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows="2"
                  />
                  <button type="submit" className="btn btn-xs btn-primary rounded-md gap-1">
                    <Save className="w-3 h-3" /> Save Bio
                  </button>
                </form>
              ) : (
                <div>
                  <p className="text-xs text-base-content/75 leading-relaxed">{currentUser.bio}</p>
                  <button onClick={() => setIsEditing(true)} className="btn btn-xs btn-ghost gap-1 mt-2 text-primary font-bold pl-0">
                    <Settings className="w-3 h-3" /> Edit Bio
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 border-t border-base-200 pt-4 mt-6 text-center">
            <div className="leading-tight">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Trips Shared</span>
              <span className="text-xl font-black text-primary">{currentUser.stats.trips}</span>
            </div>
            <div className="leading-tight border-x border-base-200">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Saved Plans</span>
              <span className="text-xl font-black text-secondary">{currentUser.stats.saved}</span>
            </div>
            <div className="leading-tight">
              <span className="text-[10px] text-base-content/50 block font-bold uppercase">Cities Visited</span>
              <span className="text-xl font-black text-accent">{currentUser.stats.cities}</span>
            </div>
          </div>
        </div>

        {/* Score & League Progress */}
        <div className="card bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-green-600/10 border border-base-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-base-content/60">My Rank</span>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/20 p-2.5 rounded-xl border border-yellow-500/30">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="leading-none text-left">
                <span className="text-xs font-bold text-base-content/50">Traveler League</span>
                <span className="text-2xl font-black block mt-1.5">{currentUser.league}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[11px] font-black">{currentUser.points} points earned</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span>Progress to {next}</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-base-300 h-2 rounded-full overflow-hidden border border-base-300">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            {remaining > 0 && (
              <span className="text-[9px] text-base-content/50 block text-left">
                Earn {remaining} more points to reach the next tier.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Statistics Custom Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CSS Chart Col (2 Cols) */}
        <div className="md:col-span-2 card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2 m-0">
            <TrendingUp className="w-4 h-4 text-primary" /> Monthly Travel Activity
          </h3>
          
          <div className="flex items-end justify-between h-48 pt-4 px-2">
            {monthlyTrips.map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-10">
                <span className="text-[10px] font-bold">{bar.count}</span>
                <div className={`w-6 ${bar.height} rounded-t-md transition-all duration-700 hover:opacity-80`} />
                <span className="text-[10px] text-base-content/60">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Plans Lists */}
        <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2 m-0">
            <BookOpen className="w-4 h-4 text-primary" /> Bookmarked Plans
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {savedPlans.map(plan => (
              <div key={plan.id} className="p-2.5 bg-base-200 border border-base-300 rounded-xl flex justify-between items-center hover:bg-base-300 transition-colors">
                <div className="leading-tight">
                  <span className="text-xs font-bold block truncate max-w-[150px]">{plan.title}</span>
                  <span className="text-[9px] text-primary font-semibold flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {plan.destinationName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-yellow-600 font-bold">
                  ★ {plan.rating}
                  <ChevronRight className="w-3.5 h-3.5 text-base-content/50" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
