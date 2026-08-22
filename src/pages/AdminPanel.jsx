import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldAlert, 
  Trash2, 
  Check, 
  Users as UsersIcon, 
  Image as ImageIcon, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react";

export default function AdminPanel() {
  const { currentUser, addPoints } = useAuth();

  // Mock flagged posts
  const [flaggedItems, setFlaggedItems] = useState([
    {
      id: "flag_1",
      author: { name: "Rashed Karim", username: "rashed_backpacks", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150" },
      destination: "Sajek Valley",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500", // Eiffel tower image
      reason: "Landmark Mismatch: AI detected urban architectural landmark (Eiffel Tower, Paris) instead of natural hills.",
      confidence: "99.8%",
      time: "10 minutes ago"
    },
    {
      id: "flag_2",
      author: { name: "Sadia Rahman", username: "sadia_expeditions", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" },
      destination: "Cox's Bazar Beach",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", // red shoe image
      reason: "Relevance Failure: AI detected commercial footwear item instead of coastal outdoor scenery.",
      confidence: "97.2%",
      time: "1 hour ago"
    }
  ]);

  const [stats, setStats] = useState({
    usersCount: 1420,
    postsScanned: 8430,
    accuracyRate: 98.4,
    flaggedCount: 230
  });

  const handleApprove = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - 1 }));
    addPoints(30); // Award points for administrative actions!
    alert("✅ Post approved! Overriding AI flag.");
  };

  const handleDiscard = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    setStats(prev => ({ 
      ...prev, 
      flaggedCount: prev.flaggedCount - 1,
      postsScanned: prev.postsScanned + 1
    }));
    addPoints(30);
    alert("🗑️ Flagged media discarded and deleted from platform.");
  };

  if (!currentUser || currentUser.username !== "nabil_wanderer") {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <ShieldAlert className="w-16 h-16 text-error mx-auto mb-4" />
        <h2 className="text-xl font-bold">Admin Authorization Required</h2>
        <p className="text-xs text-base-content/60 mt-1">
          Only authorized administrator accounts (like <span className="font-bold text-primary">nabil_wanderer</span>) can access the platform moderation filters.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-error" /> Platform Administration
        </h1>
        <p className="text-sm text-base-content/60">Review content alerts, manage traveler ratings, and audit machine learning flags.</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/50 uppercase block">Travelers Managed</span>
          <span className="text-2xl font-black text-primary mt-1.5 flex justify-center items-center gap-1.5">
            <UsersIcon className="w-5 h-5" /> {stats.usersCount}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/50 uppercase block">Media Scanned</span>
          <span className="text-2xl font-black text-secondary mt-1.5 flex justify-center items-center gap-1.5">
            <ImageIcon className="w-5 h-5" /> {stats.postsScanned}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/50 uppercase block">AI Scan Accuracy</span>
          <span className="text-2xl font-black text-success mt-1.5 flex justify-center items-center gap-1.5">
            <Activity className="w-5 h-5" /> {stats.accuracyRate}%
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/50 uppercase block">Flagged Alerts</span>
          <span className="text-2xl font-black text-warning mt-1.5 flex justify-center items-center gap-1.5">
            <AlertTriangle className="w-5 h-5" /> {flaggedItems.length}
          </span>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2 m-0 text-warning">
          <AlertTriangle className="w-4 h-4" /> AI Image Flag Queue
        </h3>

        {flaggedItems.length === 0 ? (
          <div className="text-center py-10 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
            <p className="font-bold text-xs">All clear!</p>
            <p className="text-[10px] text-base-content/50 mt-0.5">There are no flagged travel stories pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedItems.map(item => (
              <div key={item.id} className="p-4 bg-base-200/50 border border-base-300 rounded-xl flex flex-col md:flex-row gap-4 items-start">
                
                {/* Flagged Image Preview */}
                <div className="relative w-full md:w-44 h-28 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-base-300">
                  <img src={item.image} className="w-full h-full object-cover" alt="Flagged" />
                  <span className="absolute top-1 right-1 badge badge-error badge-xs font-bold py-1.5 px-2 text-[8px] text-white">
                    Conf: {item.confidence}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="leading-tight">
                      <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                        ⚠️ AI Geotag Flag
                      </span>
                      <h4 className="font-bold text-xs mt-1">Tagged: {item.destination}</h4>
                    </div>
                    <span className="text-[9px] text-base-content/50">{item.time}</span>
                  </div>

                  <p className="text-[11px] bg-error/10 border border-error/25 text-error p-2 rounded-lg leading-relaxed font-semibold">
                    {item.reason}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-base-content/60 pt-1">
                    <img src={item.author.avatar} alt="Author" className="w-4 h-4 rounded-full object-cover" />
                    <span>Uploaded by @{item.author.username}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-1 w-full md:w-auto pt-2 md:pt-0">
                  <button 
                    onClick={() => handleApprove(item.id)}
                    className="btn btn-xs btn-success text-white font-bold flex-1 md:flex-initial rounded gap-1 py-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Overrule Flag
                  </button>
                  <button 
                    onClick={() => handleDiscard(item.id)}
                    className="btn btn-xs btn-outline btn-error font-bold flex-1 md:flex-initial rounded gap-1 py-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Discard Post
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
