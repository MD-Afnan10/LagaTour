import React from "react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Trophy, 
  Compass, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Edit, 
  Trash2,
  Share2,
  Copy,
  Check
} from "lucide-react";

export default function AdminUserDetailsModal({
  isOpen,
  onClose,
  user,
  onToggleStatus,
  onEdit,
  onDelete
}) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !user) return null;

  const isSuspended = user.status === "suspended" || user.status === "Blocked";
  const userId = user.id || user.user_id;

  const handleCopyId = () => {
    if (userId) {
      navigator.clipboard?.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Profile Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 text-white relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username || "user"}`} 
                alt={user.name || user.username}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg bg-slate-800"
              />
              <span className={`absolute -bottom-1 -right-1 badge badge-xs font-bold px-2 py-1 ${
                isSuspended ? "badge-error text-white" : "badge-success text-white"
              }`}>
                {isSuspended ? "Suspended" : "Active"}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white truncate">
                  {user.name || user.username}
                </h3>
                <span className="badge badge-warning text-slate-900 font-bold text-xs uppercase">
                  {user.role || "User"}
                </span>
                {user.isVerified ? (
                  <span className="badge badge-info text-white font-bold text-xs">Verified</span>
                ) : null}
              </div>

              <p className="text-slate-300 text-xs font-mono">@{user.username}</p>

              {/* User ID Pill with Copy */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold">User ID:</span>
                <code className="text-xs font-mono bg-slate-800/90 text-amber-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {userId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="btn btn-ghost btn-xs text-slate-300 hover:text-white p-1"
                  title="Copy User ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body / User Data Attributes */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Bio Box */}
          {user.bio ? (
            <div className="p-3 bg-base-200/50 rounded-2xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block mb-1">Biography / About</span>
              <p className="text-xs text-base-content/90 italic leading-relaxed">"{user.bio}"</p>
            </div>
          ) : null}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 text-center">
              <span className="text-[10px] text-base-content/70 uppercase font-bold block">League</span>
              <span className="text-sm font-black text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                <Trophy className="w-3.5 h-3.5" /> {user.league || "Explorer"}
              </span>
            </div>

            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 text-center">
              <span className="text-[10px] text-base-content/70 uppercase font-bold block">League Points</span>
              <span className="text-sm font-black text-primary mt-0.5 block font-mono">
                {user.points || 0} pts
              </span>
            </div>

            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 text-center">
              <span className="text-[10px] text-base-content/70 uppercase font-bold block">Trips Shared</span>
              <span className="text-sm font-black text-secondary mt-0.5 block font-mono">
                {user.totalTripsShared || 0}
              </span>
            </div>

            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 text-center">
              <span className="text-[10px] text-base-content/70 uppercase font-bold block">Followers / Following</span>
              <span className="text-xs font-black text-base-content/90 mt-0.5 block font-mono">
                {user.followersCount || 0} / {user.followingCount || 0}
              </span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Email Address</span>
                <span className="font-semibold text-base-content/90 truncate block">{user.email || "No email"}</span>
              </div>
            </div>

            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-secondary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Phone Number</span>
                <span className="font-mono font-semibold text-base-content/90 truncate block">{user.phone || "Not provided"}</span>
              </div>
            </div>

            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-error shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Location</span>
                <span className="font-semibold text-base-content/90 truncate block">
                  {[user.city, user.country].filter(Boolean).join(", ") || "Bangladesh"}
                </span>
              </div>
            </div>

            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-success shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Preferred Travel Style</span>
                <span className="font-semibold text-base-content/90 truncate block">{user.preferredTravelType || "Solo"}</span>
              </div>
            </div>

            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-warning shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Member Since</span>
                <span className="font-mono text-base-content/80 text-[11px] truncate block">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active Member"}
                </span>
              </div>
            </div>

            <div className="bg-base-200/40 p-3 rounded-2xl border border-base-200 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-info shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-base-content/60 block">Last Active / Login</span>
                <span className="font-mono text-base-content/80 text-[11px] truncate block">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Recent"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Status Notice */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isSuspended ? "bg-error/10 border-error/30 text-error" : "bg-success/10 border-success/30 text-success"
          }`}>
            <div className="flex items-center gap-2.5">
              {isSuspended ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <ShieldCheck className="w-5 h-5 shrink-0" />}
              <div>
                <span className="text-xs font-black block">
                  Account Status: {isSuspended ? "SUSPENDED / BANNED" : "ACTIVE & GOOD STANDING"}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isSuspended 
                    ? "This user is barred from logging in and sharing posts." 
                    : "This user has full access to create posts, join groups, and chat."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onToggleStatus(user);
              }}
              className={`btn btn-sm rounded-xl font-bold text-xs gap-1.5 shadow-sm ${
                isSuspended ? "btn-success text-white" : "btn-error text-white"
              }`}
            >
              {isSuspended ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Unban Account
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" /> Ban / Suspend
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 bg-base-200/40 border-t border-base-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(user);
                  onClose();
                }}
                className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl text-xs font-bold gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete User
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
                className="btn btn-sm btn-primary rounded-xl text-xs font-bold text-slate-900 gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost rounded-xl text-xs font-bold text-base-content/70"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
