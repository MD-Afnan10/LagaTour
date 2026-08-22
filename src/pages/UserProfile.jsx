import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS, MOCK_TOUR_PLANS, MOCK_POSTS } from "../data/mockData";
import { 
  User, 
  MapPin, 
  Trophy, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Compass, 
  Map, 
  Heart, 
  Calendar, 
  Star,
  ArrowRight
} from "lucide-react";

export default function UserProfile() {
  const { userId } = useParams();
  const { currentUser, addPoints } = useAuth();
  const navigate = useNavigate();

  // Match target user by username or id
  const matchedUser = MOCK_USERS.find(
    u => u.id === userId || u.username.toLowerCase() === userId?.toLowerCase()
  ) || (currentUser && (currentUser.id === userId || currentUser.username.toLowerCase() === userId?.toLowerCase()) ? currentUser : MOCK_USERS[0]);

  const isSelf = currentUser && (currentUser.id === matchedUser.id || currentUser.username === matchedUser.username);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(matchedUser.followers || 0);

  // Active Tab: plans or stories
  const [activeTab, setActiveTab] = useState("plans");

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      addPoints(15);
    }
  };

  const handleSendMessage = () => {
    navigate("/chats");
  };

  // User's authored tour plans & posts
  const userPlans = MOCK_TOUR_PLANS.filter(
    p => p.author?.id === matchedUser.id || p.author?.username === matchedUser.username
  );

  const userPosts = MOCK_POSTS.filter(
    p => p.author?.id === matchedUser.id || p.author?.username === matchedUser.username
  );

  // Helper for league badge styling
  const getLeagueBadge = (league) => {
    switch (league) {
      case "Legend": return "badge-error text-white font-bold animate-pulse";
      case "Expert": return "badge-warning text-slate-900 font-bold";
      case "Traveler": return "badge-success text-white";
      case "Adventurer": return "badge-info text-white";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      {/* Profile Header Banner Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        {/* Cover Background */}
        <div className="h-40 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-12">
          
          {/* Avatar & Main details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <img 
              src={matchedUser.avatar} 
              alt={matchedUser.name} 
              className="w-24 h-24 rounded-full border-4 border-base-100 object-cover shadow-lg bg-base-200" 
            />
            <div className="mb-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-black m-0 leading-none">{matchedUser.name}</h1>
                <span className={`badge badge-sm ${getLeagueBadge(matchedUser.league)}`}>
                  {matchedUser.league}
                </span>
              </div>
              <p className="text-xs text-base-content/60 font-semibold">@{matchedUser.username}</p>
              <p className="text-xs text-base-content/85 max-w-lg leading-relaxed mt-2">
                {matchedUser.bio || "Passionate backpacker & traveler exploring top destinations with Laga Tour."}
              </p>
            </div>
          </div>

          {/* Action Buttons: Follow & Message */}
          {!isSelf ? (
            <div className="flex gap-2 self-center sm:self-end">
              <button 
                onClick={handleToggleFollow}
                className={`btn btn-sm capitalize rounded-xl gap-1.5 font-bold shadow-sm ${
                  isFollowing ? "btn-neutral" : "btn-primary text-slate-900"
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4 text-success" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "Following" : "Follow User"}
              </button>
              <button 
                onClick={handleSendMessage}
                className="btn btn-sm btn-outline rounded-xl gap-1.5 font-bold"
              >
                <MessageSquare className="w-4 h-4 text-primary" /> Message
              </button>
            </div>
          ) : (
            <Link to="/dashboard" className="btn btn-sm btn-outline rounded-xl font-bold self-center sm:self-end">
              Edit My Profile
            </Link>
          )}

        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-base-200 p-4 text-center bg-base-200/30 gap-2">
          <div className="leading-tight">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Points</span>
            <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" /> {matchedUser.points}
            </span>
          </div>
          <div className="leading-tight border-l sm:border-x border-base-200">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Followers</span>
            <span className="text-lg font-black text-primary">{followerCount}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 sm:border-r border-base-200 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Following</span>
            <span className="text-lg font-black text-secondary">{matchedUser.following || 0}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 sm:border-r border-base-200 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Trips Shared</span>
            <span className="text-lg font-black text-accent">{matchedUser.stats?.trips || userPlans.length}</span>
          </div>
          <div className="leading-tight border-t sm:border-t-0 col-span-2 sm:col-span-1 pt-2 sm:pt-0">
            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Cities Visited</span>
            <span className="text-lg font-black">{matchedUser.stats?.cities || 3}</span>
          </div>
        </div>

      </div>

      {/* Authored Content Tabs & Feed */}
      <div className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="tabs tabs-boxed rounded-none bg-base-200 border-b border-base-300 p-1 flex gap-1">
          <button 
            onClick={() => setActiveTab("plans")}
            className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "plans" ? "tab-active bg-primary text-slate-900 font-black" : ""}`}
          >
            <Map className="w-3.5 h-3.5" /> Shared Tour Plans ({userPlans.length})
          </button>
          <button 
            onClick={() => setActiveTab("stories")}
            className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "stories" ? "tab-active bg-primary text-slate-900 font-black" : ""}`}
          >
            <Compass className="w-3.5 h-3.5" /> Travel Stories ({userPosts.length})
          </button>
        </div>

        {/* Content area */}
        <div className="p-6">
          
          {/* Tab 1: Tour Plans */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              {userPlans.length === 0 ? (
                <div className="text-center py-10 text-xs text-base-content/50 border border-dashed border-base-300 rounded-xl">
                  This traveler has not shared any public tour plans yet.
                </div>
              ) : (
                userPlans.map(plan => (
                  <div key={plan.id} className="card bg-base-200 border border-base-300 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-md m-0">{plan.title}</h3>
                        <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {plan.destinationName} &nbsp;•&nbsp; 
                          <Calendar className="w-3.5 h-3.5" /> {plan.duration} Days
                        </p>
                      </div>
                      <span className="badge badge-primary py-2 px-3 font-black text-xs whitespace-nowrap shrink-0">{Number(plan.totalBudget).toLocaleString()} BDT</span>
                    </div>

                    {/* Visited Places */}
                    <div className="flex flex-wrap gap-1.5">
                      {plan.placesVisited?.map((place, idx) => (
                        <span key={idx} className="badge badge-sm badge-outline text-[10px]">{place}</span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-base-300 text-xs">
                      <div className="flex items-center gap-1 text-yellow-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {plan.rating} ({plan.ratingsCount} reviews)
                      </div>
                      <Link to="/plans" className="btn btn-xs btn-ghost text-primary font-bold gap-1">
                        View Plan <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Travel Stories */}
          {activeTab === "stories" && (
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="text-center py-10 text-xs text-base-content/50 border border-dashed border-base-300 rounded-xl">
                  This traveler has not posted any travel stories yet.
                </div>
              ) : (
                userPosts.map(post => (
                  <div key={post.id} className="card bg-base-200 border border-base-300 overflow-hidden rounded-2xl">
                    <figure className="h-64 bg-black">
                      <img src={post.image} alt="Travel Post" className="w-full h-full object-cover" />
                    </figure>
                    <div className="p-4 space-y-2">
                      <p className="text-xs leading-relaxed font-semibold">{post.caption}</p>
                      <div className="flex justify-between items-center text-[10px] text-base-content/50 pt-2 border-t border-base-300">
                        <span>Destination: {post.destination}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-error fill-error" /> {post.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
