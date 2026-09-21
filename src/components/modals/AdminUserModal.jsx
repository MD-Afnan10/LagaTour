import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Trophy, Tag, ShieldCheck, Check, Globe } from "lucide-react";

export default function AdminUserModal({
  isOpen,
  onClose,
  user,
  onSave
}) {
  const isEditing = Boolean(user && (user.id || user.user_id));

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [league, setLeague] = useState("Explorer");
  const [points, setPoints] = useState(350);
  const [status, setStatus] = useState("Active");
  const [role, setRole] = useState("Traveler");
  const [preferredTravelType, setPreferredTravelType] = useState("Solo");
  const [country, setCountry] = useState("Bangladesh");
  const [city, setCity] = useState("Dhaka");
  const [avatar, setAvatar] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setLeague(user.league || "Explorer");
      setPoints(user.points !== undefined ? user.points : 350);
      setStatus(user.status || "Active");
      setRole(user.role || "Traveler");
      setPreferredTravelType(user.preferredTravelType || "Solo");
      setCountry(user.country || "Bangladesh");
      setCity(user.city || "Dhaka");
      setAvatar(user.avatar || "");
    } else {
      setName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setLeague("Explorer");
      setPoints(100);
      setStatus("Active");
      setRole("Traveler");
      setPreferredTravelType("Solo");
      setCountry("Bangladesh");
      setCity("Dhaka");
      setAvatar("");
    }
    setErrorMsg("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please provide the traveler's full name.");
      return;
    }
    if (!username.trim()) {
      setErrorMsg("Please provide a unique username.");
      return;
    }

    const payload = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim() || `${username.trim().toLowerCase()}@laga.tour`,
      phone: phone.trim(),
      league,
      points: parseInt(points || 0, 10),
      status,
      role,
      preferredTravelType,
      country: country.trim() || "Bangladesh",
      city: city.trim() || "Dhaka",
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username.trim() || 'user'}`
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-base-content leading-tight">
                {isEditing ? `Edit User: ${user.name || user.username}` : "Create New Traveler Account"}
              </h3>
              <p className="text-xs text-base-content/70 mt-0.5">
                {isEditing ? "Update member profile, points, status, and permissions." : "Register and configure a new traveler profile."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-error/15 border border-error/30 text-error rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Tanvir Hossain"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Username *</label>
              <input
                type="text"
                placeholder="e.g. tanvir_wanderer"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="tanvir@laga.tour"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+88017XXXXXXXX"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">League</label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
              >
                <option value="Explorer">Explorer</option>
                <option value="Adventurer">Adventurer</option>
                <option value="Traveler">Traveler</option>
                <option value="Expert">Expert</option>
                <option value="Legend">Legend</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">League Points</label>
              <input
                type="number"
                min="0"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Account Status</label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">System Role</label>
              <input
                type="text"
                placeholder="Traveler / Guide"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Travel Style</label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={preferredTravelType}
                onChange={(e) => setPreferredTravelType(e.target.value)}
              >
                <option value="Solo">Solo</option>
                <option value="Friends">Friends</option>
                <option value="Family">Family</option>
                <option value="Couple">Couple</option>
                <option value="Group">Group</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">City</label>
              <input
                type="text"
                placeholder="Dhaka"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Avatar Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or leave blank for dicebear"
              className="input input-sm input-bordered w-full rounded-xl text-xs"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm flex-1 rounded-xl text-xs font-bold text-slate-900 shadow-md gap-1"
            >
              <Check className="w-4 h-4" /> {isEditing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
