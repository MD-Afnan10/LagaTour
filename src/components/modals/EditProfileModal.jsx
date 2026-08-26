import React, { useState, useRef } from "react";
import { 
  X, 
  Edit3, 
  Camera, 
  Upload, 
  RefreshCw, 
  Save, 
  Loader2 
} from "lucide-react";
import { compressImageFile } from "../../utils/imageCompressor";

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onSave 
}) {
  if (!isOpen || !currentUser) return null;

  const [firstName, setFirstName] = useState(currentUser.firstName || currentUser.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(currentUser.lastName || currentUser.name?.split(" ").slice(1).join(" ") || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [country, setCountry] = useState(currentUser.country || "Bangladesh");
  const [city, setCity] = useState(currentUser.city || "Dhaka");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [preferredTravelType, setPreferredTravelType] = useState(currentUser.preferredTravelType || "Solo");
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);

  const PRESET_AVATARS = [
    { name: "Adventurer", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer_${currentUser.username || 'user'}` },
    { name: "Nomad", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=nomad_${currentUser.username || 'user'}` },
    { name: "Explorer", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=explorer_${currentUser.username || 'user'}` },
    { name: "Hiker", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=hiker_${currentUser.username || 'user'}` },
    { name: "Wanderer", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=wanderer_${currentUser.username || 'user'}` },
    { name: "Pilot", url: `https://api.dicebear.com/7.x/adventurer/svg?seed=pilot_${currentUser.username || 'user'}` }
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      setAvatar(compressed);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to process image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        country: country.trim(),
        city: city.trim(),
        phone: phone.trim(),
        preferredTravelType,
        profilePictureUrl: avatar.trim() || undefined
      });

      setSuccessMsg("✅ Profile updated successfully in MySQL database!");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 border border-base-300 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/50 hover:bg-base-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-base-200 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-base-content">Edit Traveler Profile</h3>
            <p className="text-[11px] text-base-content/60">Update profile picture, personal bio, and contact information.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs p-3 rounded-2xl">
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success bg-success/10 border-success/20 text-success text-xs p-3 rounded-2xl">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar / Photo Picker */}
          <div className="p-4 bg-base-200/50 rounded-2xl border border-base-200 space-y-3">
            <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-400" /> Profile Picture Input
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img 
                  src={avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`} 
                  alt="Avatar Preview" 
                  className="w-20 h-20 rounded-2xl border-2 border-amber-400/50 object-cover bg-base-300 shadow-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`;
                  }}
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload from Computer
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      const randomSeed = "traveler_" + Math.random().toString(36).substr(2, 6);
                      setAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`);
                    }} 
                    className="btn btn-xs btn-ghost text-amber-400 font-bold rounded-xl gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Random Avatar
                  </button>
                </div>

                <p className="text-[10px] text-base-content/50">Supports PNG, JPG, WEBP, or paste custom URL below.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200">
              <span className="text-[10px] font-bold text-base-content/60 block mb-1.5">Choose Traveler Style:</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`p-1 rounded-xl border transition-all shrink-0 flex flex-col items-center gap-1 ${
                      avatar === preset.url ? "border-amber-400 bg-amber-500/10 scale-105" : "border-base-300 hover:border-amber-400/40"
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-lg" />
                    <span className="text-[9px] font-bold">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-control pt-1">
              <label className="label py-0.5"><span className="label-text text-[10px] font-semibold text-base-content/60">Or Paste Image URL</span></label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/photo-..." 
                className="input input-xs input-bordered w-full rounded-lg font-mono text-[11px]" 
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">First Name</span></label>
              <input 
                type="text" 
                placeholder="Aria" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Last Name</span></label>
              <input 
                type="text" 
                placeholder="Jahan" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-bold">Bio / About Me</span></label>
            <textarea 
              rows="3" 
              placeholder="Share a short bio about your travel experiences..." 
              className="textarea textarea-bordered w-full rounded-xl text-xs"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Country & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Country</span></label>
              <input 
                type="text" 
                placeholder="Bangladesh" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">City</span></label>
              <input 
                type="text" 
                placeholder="Dhaka" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & Travel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Phone Number</span></label>
              <input 
                type="tel" 
                placeholder="+8801700000000" 
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Preferred Travel Type</span></label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                value={preferredTravelType}
                onChange={(e) => setPreferredTravelType(e.target.value)}
              >
                <option value="Solo">Solo Traveler</option>
                <option value="Friends">Friends Group</option>
                <option value="Family">Family Trips</option>
                <option value="Couple">Couple Getaways</option>
                <option value="Group">Public Group Tour</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 btn-sm flex-1 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save to Database</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
