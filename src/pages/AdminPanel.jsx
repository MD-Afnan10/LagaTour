import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { 
  ShieldAlert, 
  Trash2, 
  Check, 
  Users as UsersIcon, 
  Image as ImageIcon, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Info,
  Calendar,
  UserCheck,
  X,
  Shield,
  Flag,
  Video as VideoIcon
} from "lucide-react";

export default function AdminPanel() {
  const { currentUser, addPoints, adminAccounts, addAdminAccount, toggleBlockAdminAccount } = useAuth();
  const { posts, reports, hidePost, makePostVisible, dismissReport } = usePosts();
  const navigate = useNavigate();

  const [newAdminHandle, setNewAdminHandle] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState("");
  const [adminErr, setAdminErr] = useState("");

  // Modal States
  const [blockConfirmAdmin, setBlockConfirmAdmin] = useState(null);
  const [viewInfoAdmin, setViewInfoAdmin] = useState(null);

  // AI flagged posts queue
  const [flaggedItems, setFlaggedItems] = useState([
    {
      id: "flag_1",
      author: { name: "Rashed Karim", username: "rashed_backpacks", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150" },
      destination: "Sajek Valley",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500",
      reason: "Landmark Mismatch: AI detected urban architectural landmark (Eiffel Tower, Paris) instead of natural hills.",
      confidence: "99.8%",
      time: "10 minutes ago"
    }
  ]);

  const [stats] = useState({
    usersCount: 1420,
    postsScanned: 8430,
    accuracyRate: 98.4
  });

  const handleApproveFlag = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    addPoints(30);
    alert("✅ AI flag overruled! Media approved.");
  };

  const handleDiscardFlag = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    addPoints(30);
    alert("🗑️ Flagged post discarded.");
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    setAdminMsg("");
    setAdminErr("");

    try {
      const added = addAdminAccount(newAdminHandle, newAdminPassword, currentUser?.email || "admin@laga.tour");
      setAdminMsg(`✅ Created administrator account '${added.handle}' with custom passcode!`);
      setNewAdminHandle("");
      setNewAdminPassword("");
    } catch (err) {
      setAdminErr(err.message || "Failed to create administrator account.");
    }
  };

  const handleConfirmToggleBlock = () => {
    if (!blockConfirmAdmin) return;
    toggleBlockAdminAccount(blockConfirmAdmin.handle);
    const isNowBlocked = blockConfirmAdmin.status !== "Blocked";
    setAdminMsg(isNowBlocked ? `🚫 Administrator ${blockConfirmAdmin.handle} has been BLOCKED.` : `✅ Administrator ${blockConfirmAdmin.handle} has been UNBLOCKED.`);
    setBlockConfirmAdmin(null);
  };

  const isUserAdmin = currentUser && (
    currentUser.isAdmin || 
    currentUser.email?.toLowerCase().startsWith("admin") || 
    currentUser.username === "nabil_wanderer"
  );

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-base-content/90">Admin Authorization Required</h2>
        <p className="text-xs text-base-content/80 leading-relaxed">
          Only authorized administrator accounts with the <span className="font-bold text-amber-400 font-mono">admin@</span> prefix can access the platform administration portal.
        </p>
        <div className="pt-2 flex gap-3 justify-center">
          <button 
            onClick={() => navigate("/auth", { state: { openAdmin: true } })}
            className="btn btn-warning btn-sm rounded-xl font-bold text-xs"
          >
            Staff & Admin Sign In 🔒
          </button>
          <button 
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm rounded-xl text-xs text-base-content/80"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2 text-base-content/95">
          <ShieldAlert className="w-8 h-8 text-error" /> Platform Administration & Moderation
        </h1>
        <p className="text-sm text-base-content/80">Review user report flags, hide/unhide posts, manage traveler ratings, and audit admin credentials.</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">Travelers Managed</span>
          <span className="text-2xl font-black text-primary mt-1.5 flex justify-center items-center gap-1.5">
            <UsersIcon className="w-5 h-5" /> {stats.usersCount}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">Media Scanned</span>
          <span className="text-2xl font-black text-secondary mt-1.5 flex justify-center items-center gap-1.5">
            <ImageIcon className="w-5 h-5" /> {stats.postsScanned}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">User Reports Queue</span>
          <span className="text-2xl font-black text-error mt-1.5 flex justify-center items-center gap-1.5">
            <Flag className="w-5 h-5" /> {reports.length}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">AI Scan Accuracy</span>
          <span className="text-2xl font-black text-success mt-1.5 flex justify-center items-center gap-1.5">
            <Activity className="w-5 h-5" /> {stats.accuracyRate}%
          </span>
        </div>
      </div>

      {/* USER REPORTS & CONTENT MODERATION SECTION */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-base-200 pb-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-error m-0">
              <Flag className="w-5 h-5 text-error" /> User Reports & Post Moderation Panel
            </h3>
            <p className="text-xs text-base-content/80 mt-0.5">
              Review flagged content submitted by users. You can <strong className="text-base-content">Hide Post</strong> to unpublish from feed, or <strong className="text-base-content">Make Visible</strong> if previously hidden.
            </p>
          </div>
          <span className="badge badge-error text-white font-bold text-xs px-3 py-1">
            {reports.length} Pending Reports
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-10 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
            <p className="font-bold text-xs text-base-content/90">No active user reports</p>
            <p className="text-[10px] text-base-content/75 mt-0.5">All community post reports have been addressed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => {
              const currentPost = posts.find(p => p.id === rep.postId) || rep.post;
              const isHidden = currentPost?.isHidden;

              return (
                <div key={rep.id} className="p-4 bg-base-200/50 border border-base-300 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
                  
                  {/* Media Thumbnail */}
                  <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-base-300 shrink-0">
                    {currentPost?.video ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-100 bg-slate-900 p-2 text-center">
                        <VideoIcon className="w-8 h-8 text-error mb-1" />
                        <span className="text-[10px] font-bold text-slate-200">Video Content</span>
                      </div>
                    ) : currentPost?.image ? (
                      <img src={currentPost.image} className="w-full h-full object-cover" alt="Reported post" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base-content/75 text-xs p-2 text-center font-bold">
                        Text Content Only
                      </div>
                    )}

                    <span className={`absolute top-2 left-2 badge badge-xs font-bold px-2 py-1 ${
                      isHidden ? "badge-warning text-slate-900" : "badge-success text-white"
                    }`}>
                      {isHidden ? "Hidden" : "Visible"}
                    </span>
                  </div>

                  {/* Report & Post Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-error flex items-center gap-1">
                            <Flag className="w-3.5 h-3.5" /> Flagged by: <span className="text-base-content/90">{rep.reporter || "Anonymous"}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-base-content/90 mt-0.5">
                          Post by @{currentPost?.author?.username || "traveler"} • Tagged: {currentPost?.destination || "Location"}
                        </h4>
                      </div>
                      <span className="text-[10px] text-base-content/75 font-mono">{rep.timestamp}</span>
                    </div>

                    {/* Reported Reason Box */}
                    <div className="p-2.5 bg-error/10 border border-error/20 rounded-xl text-xs text-error leading-relaxed">
                      <span className="font-bold">Report Reason: </span>
                      <span className="text-base-content/90 font-medium">{rep.reason}</span>
                    </div>

                    {/* Post Caption Preview */}
                    <div className="p-2 bg-base-100 rounded-xl border border-base-200 text-xs text-base-content/85 line-clamp-2">
                      <span className="font-bold mr-1 text-base-content/95">Caption:</span>
                      <span>"{currentPost?.caption}"</span>
                    </div>
                  </div>

                  {/* Actions: Hide / Make Visible / Dismiss */}
                  <div className="flex md:flex-col gap-2 w-full md:w-36 pt-2 md:pt-0 shrink-0">
                    {isHidden ? (
                      <button 
                        onClick={() => {
                          makePostVisible(rep.postId);
                          alert("👁️ Post is now visible again on the community feed.");
                        }}
                        className="btn btn-xs btn-success text-white font-bold rounded-xl gap-1 py-1 flex-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Make Visible
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          hidePost(rep.postId);
                          alert("🙈 Post has been hidden from the public community feed.");
                        }}
                        className="btn btn-xs btn-warning text-slate-900 font-bold rounded-xl gap-1 py-1 flex-1"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Hide Post
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        dismissReport(rep.id);
                        alert("✅ Report dismissed from queue.");
                      }}
                      className="btn btn-xs btn-outline btn-ghost text-base-content/85 hover:bg-base-300 font-bold rounded-xl gap-1 py-1 flex-1"
                    >
                      <X className="w-3.5 h-3.5" /> Dismiss Report
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI IMAGE FLAG QUEUE */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2 m-0 text-warning">
          <AlertTriangle className="w-4 h-4" /> AI Image Geotag Scan Queue
        </h3>

        {flaggedItems.length === 0 ? (
          <div className="text-center py-8 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-1" />
            <p className="font-bold text-xs text-base-content/90">All clear!</p>
            <p className="text-[10px] text-base-content/75">No pending AI geotag flags.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedItems.map(item => (
              <div key={item.id} className="p-4 bg-base-200/50 border border-base-300 rounded-xl flex flex-col md:flex-row gap-4 items-start">
                <div className="relative w-full md:w-44 h-28 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-base-300">
                  <img src={item.image} className="w-full h-full object-cover" alt="Flagged" />
                  <span className="absolute top-1 right-1 badge badge-error badge-xs font-bold py-1.5 px-2 text-[8px] text-white">
                    Conf: {item.confidence}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="leading-tight">
                      <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                        ⚠️ AI Geotag Flag
                      </span>
                      <h4 className="font-bold text-xs mt-1 text-base-content/90">Tagged: {item.destination}</h4>
                    </div>
                    <span className="text-[10px] text-base-content/75 font-mono">{item.time}</span>
                  </div>

                  <p className="text-[11px] bg-error/10 border border-error/25 text-error p-2 rounded-lg leading-relaxed font-semibold">
                    {item.reason}
                  </p>
                </div>

                <div className="flex md:flex-col gap-1 w-full md:w-auto pt-2 md:pt-0">
                  <button 
                    onClick={() => handleApproveFlag(item.id)}
                    className="btn btn-xs btn-success text-white font-bold flex-1 md:flex-initial rounded gap-1 py-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Overrule Flag
                  </button>
                  <button 
                    onClick={() => handleDiscardFlag(item.id)}
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

      {/* Administrator Delegation & Management Section */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-base-200 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2 m-0 text-primary">
              <ShieldCheck className="w-5 h-5 text-primary" /> Administrator Delegation & Auditing
            </h3>
            <p className="text-xs text-base-content/80 mt-0.5">
              Enter an admin handle starting with <span className="font-mono text-amber-400 font-bold">admin</span> and set a corresponding passcode.
            </p>
          </div>
          <span className="badge badge-warning text-slate-900 font-bold text-[10px]">
            {adminAccounts?.length || 2} Active Admins
          </span>
        </div>

        {adminMsg && (
          <div className="alert alert-success bg-success/10 border-success/20 text-success text-xs py-2.5 px-3 rounded-xl flex justify-between items-center">
            <span>{adminMsg}</span>
            <button onClick={() => setAdminMsg("")} className="btn btn-ghost btn-xs text-success p-0">✕</button>
          </div>
        )}

        {adminErr && (
          <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs py-2.5 px-3 rounded-xl flex justify-between items-center">
            <span>{adminErr}</span>
            <button onClick={() => setAdminErr("")} className="btn btn-ghost btn-xs text-error p-0">✕</button>
          </div>
        )}

        {/* 2-Box Admin Creation Form */}
        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-base-200/40 p-4 rounded-2xl border border-base-200">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-base-content/75 uppercase block mb-1">1. Admin Handle / Email</label>
            <input 
              type="text"
              placeholder="admin_sarah@laga.tour"
              value={newAdminHandle}
              onChange={(e) => setNewAdminHandle(e.target.value)}
              className="input input-sm h-10 w-full bg-base-100 border-base-300 text-xs rounded-xl focus:border-amber-400 font-mono text-base-content/90"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-base-content/75 uppercase block mb-1">2. Corresponding Passcode</label>
            <input 
              type="password"
              placeholder="Set Admin Passcode"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="input input-sm h-10 w-full bg-base-100 border-base-300 text-xs rounded-xl focus:border-amber-400 text-base-content/90"
              required
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="btn btn-primary btn-sm h-10 w-full text-xs rounded-xl font-bold gap-1.5 capitalize shrink-0 shadow-sm text-white"
            >
              <UserPlus className="w-4 h-4" /> Grant Access
            </button>
          </div>
        </form>

        {/* Registered Administrators List */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-base-content/90">System Administrator Roster ({adminAccounts?.length || 0})</span>
            <span className="text-[10px] text-base-content/75">Click "View Info" for audit trail or "Block" to revoke access.</span>
          </div>

          <div className="space-y-2.5">
            {(adminAccounts || []).map((acc, i) => (
              <div 
                key={acc.id || i} 
                className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  acc.status === "Blocked" 
                    ? "bg-error/5 border-error/30 text-base-content/80" 
                    : "bg-base-200/60 border-base-300 hover:border-base-400"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    acc.status === "Blocked" ? "bg-error/20 text-error border border-error/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {acc.status === "Blocked" ? <ShieldOff className="w-4.5 h-4.5" /> : <Shield className="w-4.5 h-4.5" />}
                  </div>
                  
                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-base-content/95 truncate">{acc.handle}</span>
                      <span className={`badge badge-xs font-bold ${
                        acc.status === "Blocked" ? "badge-error text-white" : "badge-success text-white"
                      }`}>
                        {acc.status || "Active"}
                      </span>
                    </div>
                    <span className="text-[10px] text-base-content/75 block mt-1 truncate">
                      Passcode: <span className="font-mono text-amber-400 font-bold">{acc.password}</span> • Added by <span className="font-semibold text-base-content/85">{acc.addedBy || "admin@laga.tour"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-base-300 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => setViewInfoAdmin(acc)}
                    className="btn btn-xs btn-ghost bg-base-300 hover:bg-base-400 text-base-content/90 font-bold rounded-lg gap-1 text-[11px] px-2.5 py-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-info" /> View Info
                  </button>

                  <button 
                    onClick={() => setBlockConfirmAdmin(acc)}
                    className={`btn btn-xs font-bold rounded-lg gap-1 text-[11px] px-2.5 py-1 ${
                      acc.status === "Blocked" 
                        ? "btn-success text-white" 
                        : "btn-outline btn-error hover:bg-error hover:text-white"
                    }`}
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    {acc.status === "Blocked" ? "Unblock Admin" : "Block Admin"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Blocking/Unblocking Admin */}
      {blockConfirmAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setBlockConfirmAdmin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/60 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                blockConfirmAdmin.status === "Blocked" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}>
                <ShieldOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-base-content/95">
                {blockConfirmAdmin.status === "Blocked" ? "Unblock Administrator Access?" : "Block Administrator Access?"}
              </h3>
              <p className="text-xs text-base-content/80">
                {blockConfirmAdmin.status === "Blocked"
                  ? `Are you sure you want to reinstate administrative privileges for ${blockConfirmAdmin.handle}?`
                  : `Are you sure you want to block administrator ${blockConfirmAdmin.handle}? Blocked admins will be immediately barred from logging in.`
                }
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setBlockConfirmAdmin(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold text-base-content/80"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmToggleBlock}
                className={`btn btn-sm flex-1 rounded-xl text-xs font-bold text-white ${
                  blockConfirmAdmin.status === "Blocked" ? "btn-success" : "btn-error"
                }`}
              >
                {blockConfirmAdmin.status === "Blocked" ? "Yes, Unblock Admin" : "Yes, Block Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Details Info Modal */}
      {viewInfoAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button 
              onClick={() => setViewInfoAdmin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/60 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-base-200 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Administrator Audit File</span>
                <h3 className="text-lg font-bold font-mono truncate text-base-content/95">{viewInfoAdmin.handle}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Status</span>
                <span className={`badge badge-sm font-bold ${
                  viewInfoAdmin.status === "Blocked" ? "badge-error text-white" : "badge-success text-white"
                }`}>
                  {viewInfoAdmin.status || "Active"}
                </span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Assigned Role</span>
                <span className="font-bold text-base-content/90">{viewInfoAdmin.role || "Platform Administrator"}</span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Passcode</span>
                <span className="font-mono font-bold text-amber-400">{viewInfoAdmin.password}</span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Added By</span>
                <span className="font-semibold text-base-content/90 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> {viewInfoAdmin.addedBy || "admin@laga.tour"}
                </span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 col-span-2">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Added Timestamp</span>
                <span className="font-mono text-base-content/90 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-warning" /> {viewInfoAdmin.addedAt || "Aug 1, 2026 at 09:00 AM"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-base-200">
              <button 
                onClick={() => {
                  const target = viewInfoAdmin;
                  setViewInfoAdmin(null);
                  setBlockConfirmAdmin(target);
                }}
                className={`btn btn-sm flex-1 rounded-xl text-xs font-bold ${
                  viewInfoAdmin.status === "Blocked" ? "btn-success text-white" : "btn-outline btn-error"
                }`}
              >
                {viewInfoAdmin.status === "Blocked" ? "Unblock Administrator" : "Block Administrator"}
              </button>
              <button 
                onClick={() => setViewInfoAdmin(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold text-base-content/80"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
