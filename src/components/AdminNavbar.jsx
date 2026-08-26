import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Bell, 
  MapPin, 
  Compass, 
  Landmark,
  Map, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon,
  Trophy,
  Send,
  AlertTriangle,
  Radio,
  X,
  MessageSquare
} from "lucide-react";

export default function AdminNavbar() {
  const { currentUser, logout, sendPushNotification, setGlobalBannerAlert, clearGlobalBannerAlert, globalBanner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [theme, setTheme] = useState(localStorage.getItem("ts_theme") || "sunset");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Broadcast Modal States
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("info");
  const [isBanner, setIsBanner] = useState(false);

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

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (isBanner) {
      setGlobalBannerAlert(broadcastMessage, broadcastPriority);
    } else {
      sendPushNotification(broadcastTitle || "System Notification", broadcastMessage, broadcastPriority);
    }
    setBroadcastTitle("");
    setBroadcastMessage("");
    setIsBroadcastOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path 
      ? "btn-error text-white font-bold shadow-sm" 
      : "btn-ghost text-slate-200 hover:text-white hover:bg-slate-700/60 font-semibold";
  };

  return (
    <>
      <div className="navbar bg-slate-900 border-b border-error/20 sticky top-0 z-50 px-4 md:px-8 shadow-md">
        
        {/* Navbar Start - Mobile Dropdown & Logo */}
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden mr-1 text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow bg-slate-800 rounded-box w-52 border border-slate-700">
              <li><Link to="/" className="text-slate-200 hover:text-white font-medium"><Compass className="w-4 h-4 text-error" /> Feed Moderation</Link></li>
              <li><Link to="/places" className="text-slate-200 hover:text-white font-medium"><Landmark className="w-4 h-4 text-error" /> Places</Link></li>
              <li><Link to="/plans" className="text-slate-200 hover:text-white font-medium"><Map className="w-4 h-4 text-error" /> Plan Audits</Link></li>
              <li><Link to="/rankings" className="text-slate-200 hover:text-white font-medium"><Trophy className="w-4 h-4 text-warning" /> User Bans</Link></li>
              <li><Link to="/admin" className="text-slate-200 hover:text-white font-medium"><ShieldAlert className="w-4 h-4 text-error" /> Admin Portal</Link></li>
            </ul>
          </div>
          
          <Link to="/admin" className="btn btn-ghost text-xl font-black gap-2 hover:bg-transparent px-2 text-white">
            <div className="bg-error/20 p-1.5 rounded-lg border border-error/50">
              <ShieldAlert className="w-6 h-6 text-error" />
            </div>
            <span className="hidden sm:inline-block">Admin<span className="text-error font-light">Panel</span></span>
          </Link>
        </div>

        {/* Navbar Center - Desktop Links */}
        <div className="navbar-center hidden lg:flex">
          <div className="flex gap-1 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
            <Link to="/" className={`btn btn-sm rounded-xl font-bold ${isActive("/")}`}>Feed</Link>
            <Link to="/plans" className={`btn btn-sm rounded-xl font-bold ${isActive("/plans")}`}>Plans</Link>
            <Link to="/rankings" className={`btn btn-sm rounded-xl font-bold ${isActive("/rankings")}`}>Users</Link>
            <Link to="/admin" className={`btn btn-sm rounded-xl font-bold ${isActive("/admin")}`}>Portal</Link>
          </div>
        </div>

        {/* Navbar End - Profile & Actions */}
        <div className="navbar-end gap-2 sm:gap-4">
          <button 
            onClick={() => setIsBroadcastOpen(true)}
            className="btn btn-sm btn-error text-white font-bold rounded-xl gap-2 shadow-lg shadow-error/20"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>

          <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm text-slate-300">
            <input type="checkbox" onChange={toggleTheme} checked={theme === "light"} />
            <Sun className="swap-on w-5 h-5" />
            <Moon className="swap-off w-5 h-5" />
          </label>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border-2 border-error/50 ring-2 ring-error/20">
              <div className="w-9 rounded-full">
                <img src={currentUser.avatar} alt="Admin" />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow-xl bg-slate-800 border border-slate-700 rounded-2xl w-60">
              <li className="px-4 py-3 border-b border-slate-700 mb-2">
                <div className="font-bold text-white text-sm p-0 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-error" /> {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">{currentUser.email}</div>
              </li>
              <li><Link to="/admin" className="text-white hover:bg-slate-700"><ShieldAlert className="w-4 h-4 text-error" /> Admin Settings</Link></li>
              <li>
                <button onClick={handleLogout} className="text-error font-bold hover:bg-error hover:text-white mt-1">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-error/30 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-white">
            <button 
              onClick={() => setIsBroadcastOpen(false)}
              className="absolute top-4 right-4 btn btn-circle btn-ghost btn-sm text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2 text-error mb-1">
              <Radio className="w-6 h-6" /> Push Broadcast
            </h3>
            <p className="text-xs text-slate-300 mb-6">Send an instant push notification or global banner to all active users on the platform.</p>

            <form onSubmit={handleBroadcast} className="space-y-4">
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-error toggle-sm" 
                    checked={isBanner} 
                    onChange={(e) => setIsBanner(e.target.checked)} 
                  />
                  <span className="label-text text-white font-bold text-xs">Set as Global Top Banner Instead of Push Alert</span>
                </label>
              </div>

              {!isBanner && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. System Update" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="input input-sm w-full bg-slate-800 border-slate-700 text-white focus:border-error" 
                    required={!isBanner}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Message Content</label>
                <textarea 
                  placeholder="Enter the broadcast message..." 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="textarea textarea-sm w-full bg-slate-800 border-slate-700 text-white focus:border-error resize-none h-24" 
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Priority Level</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBroadcastPriority("info")} className={`btn btn-xs flex-1 rounded-lg ${broadcastPriority === 'info' ? 'btn-info text-white' : 'btn-outline border-slate-700 text-slate-400'}`}>Info</button>
                  <button type="button" onClick={() => setBroadcastPriority("warning")} className={`btn btn-xs flex-1 rounded-lg ${broadcastPriority === 'warning' ? 'btn-warning text-slate-900' : 'btn-outline border-slate-700 text-slate-400'}`}>Warning</button>
                  <button type="button" onClick={() => setBroadcastPriority("error")} className={`btn btn-xs flex-1 rounded-lg ${broadcastPriority === 'error' ? 'btn-error text-white' : 'btn-outline border-slate-700 text-slate-400'}`}>Critical</button>
                  <button type="button" onClick={() => setBroadcastPriority("success")} className={`btn btn-xs flex-1 rounded-lg ${broadcastPriority === 'success' ? 'btn-success text-white' : 'btn-outline border-slate-700 text-slate-400'}`}>Success</button>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn btn-error w-full rounded-xl font-bold text-white shadow-lg shadow-error/20">
                  <Send className="w-4 h-4" /> Send Broadcast Now
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
