import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_NOTIFICATIONS } from "../data/mockData";
import { 
  Bell, 
  MapPin, 
  Compass, 
  Landmark,
  Map, 
  Users, 
  MessageSquare, 
  Sparkles, 
  ShieldAlert, 
  LogOut, 
  User, 
  Sun, 
  Moon,
  Trophy
} from "lucide-react";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [theme, setTheme] = useState(localStorage.getItem("ts_theme") || "sunset");

  // Sync DaisyUI theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ts_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "sunset" ? "light" : "sunset");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const isActive = (path) => {
    return location.pathname === path ? "btn-primary text-primary-content" : "btn-ghost";
  };

  // Helper to determine league badge style
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
    <div className="navbar bg-base-100/90 backdrop-blur sticky top-0 z-50 border-b border-base-300 px-4 md:px-8">
      {/* Navbar Start */}
      <div className="navbar-start">
        {/* Mobile Dropdown */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow bg-base-200 rounded-box w-52 border border-base-300">
            {currentUser && (
              <>
                <li><Link to="/"><Compass className="w-4 h-4" /> Social Feed</Link></li>
                <li><Link to="/map"><MapPin className="w-4 h-4" /> Map Explorer</Link></li>
                <li><Link to="/places"><Landmark className="w-4 h-4" /> Places</Link></li>
                <li><Link to="/plans"><Map className="w-4 h-4" /> Tour Plans</Link></li>
                <li><Link to="/rankings"><Trophy className="w-4 h-4 text-warning" /> Rankings</Link></li>
                <li><Link to="/groups"><Users className="w-4 h-4" /> Group Planner</Link></li>
                <li><Link to="/chats"><MessageSquare className="w-4 h-4" /> Messages</Link></li>
                <li><Link to="/ai-builder"><Sparkles className="w-4 h-4 text-warning" /> AI Builder</Link></li>
                <li><Link to="/dashboard"><User className="w-4 h-4" /> Dashboard</Link></li>
                {currentUser.username === "nabil_wanderer" && (
                  <li><Link to="/admin"><ShieldAlert className="w-4 h-4 text-error" /> Admin Panel</Link></li>
                )}
              </>
            )}
          </ul>
        </div>

        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-all duration-300">
          <img 
            src="/logo.png" 
            alt="Laga Tour Logo" 
            className="h-10 md:h-12 w-auto object-contain rounded-full shadow-lg border border-base-200/10" 
          />
          <span className="text-2xl md:text-3xl font-bold tracking-wide text-amber-400 font-['Caveat'] hidden sm:inline-block">
            Laga Tour
          </span>
        </Link>
      </div>

      {/* Navbar Center for Desktop */}
      <div className="navbar-center hidden lg:flex">
        {currentUser && (
          <div className="flex gap-1">
            <Link to="/" className={`btn btn-sm capitalize ${isActive("/")}`}>
              <Compass className="w-4 h-4" /> Social Feed
            </Link>
            <Link to="/map" className={`btn btn-sm capitalize ${isActive("/map")}`}>
              <MapPin className="w-4 h-4" /> Map Explorer
            </Link>
            <Link to="/places" className={`btn btn-sm capitalize ${isActive("/places")}`}>
              <Landmark className="w-4 h-4" /> Places
            </Link>
            <Link to="/plans" className={`btn btn-sm capitalize ${isActive("/plans")}`}>
              <Map className="w-4 h-4" /> Tour Plans
            </Link>
            <Link to="/rankings" className={`btn btn-sm capitalize ${isActive("/rankings")}`}>
              <Trophy className="w-4 h-4 text-warning" /> Rankings
            </Link>
            <Link to="/groups" className={`btn btn-sm capitalize ${isActive("/groups")}`}>
              <Users className="w-4 h-4" /> Group Planner
            </Link>
            <Link to="/chats" className={`btn btn-sm capitalize ${isActive("/chats")}`}>
              <MessageSquare className="w-4 h-4" /> Chats
            </Link>
            <Link to="/ai-builder" className={`btn btn-sm capitalize ${isActive("/ai-builder")}`}>
              <Sparkles className="w-4 h-4 text-warning" /> AI Builder
            </Link>
          </div>
        )}
      </div>

      {/* Navbar End */}
      <div className="navbar-end gap-2">
        {currentUser ? (
          <>
            {/* Traveler League Score - Desktop */}
            <div className="hidden md:flex items-center gap-2 bg-base-200 border border-base-300 py-1.5 px-3 rounded-full hover:bg-base-300 transition-colors cursor-pointer" onClick={() => navigate("/dashboard")}>
              <Trophy className="w-4 h-4 text-yellow-400" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold leading-none text-base-content/75">Score</span>
                <span className="text-xs font-bold leading-none mt-0.5">{currentUser.points} pts</span>
              </div>
              <span className={`badge badge-sm ${getLeagueBadge(currentUser.league)}`}>
                {currentUser.league}
              </span>
            </div>

            {/* Notification Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="badge badge-error badge-sm absolute top-1 right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] text-white font-bold animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div tabIndex={0} className="mt-3 z-[100] card card-compact dropdown-content w-80 shadow bg-base-200 border border-base-300 text-base-content">
                <div className="card-body">
                  <div className="flex justify-between items-center border-b border-base-300 pb-2 mb-2">
                    <span className="font-bold text-md">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-base-content/50">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n.id)}
                          className={`flex items-start gap-2 p-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer ${n.unread ? 'bg-base-300/40 border-l-4 border-primary' : ''}`}
                        >
                          <img src={n.user?.avatar} alt={n.user?.name} className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold">{n.title}</p>
                            <p className="text-[10px] text-base-content/70 italic mt-0.5 truncate">{n.body}</p>
                            <span className="text-[9px] text-base-content/50 mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
              {theme === "sunset" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Avatar Menu */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-base-300 p-0.5">
                <div className="w-10 rounded-full">
                  <img src={currentUser.avatar} alt="Profile" />
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow bg-base-200 rounded-box w-52 border border-base-300">
                <li><Link to="/dashboard"><User className="w-4 h-4" /> My Profile</Link></li>
                {currentUser.username === "nabil_wanderer" && (
                  <li><Link to="/admin"><ShieldAlert className="w-4 h-4 text-error" /> Admin Panel</Link></li>
                )}
                <div className="divider my-1"></div>
                <li><button onClick={handleLogout} className="text-error"><LogOut className="w-4 h-4" /> Logout</button></li>
              </ul>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
              {theme === "sunset" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/auth" className="btn btn-primary btn-sm rounded-lg">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
