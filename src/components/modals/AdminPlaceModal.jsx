import React, { useState, useEffect } from "react";
import { X, MapPin, Globe, Check, ShieldCheck } from "lucide-react";

export default function AdminPlaceModal({
  isOpen,
  onClose,
  place,
  onSave
}) {
  const isEditing = Boolean(place && (place.id || place.place_id));

  const [name, setName] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [division, setDivision] = useState("Dhaka");
  const [category, setCategory] = useState("Historic & Heritage");
  const [lat, setLat] = useState(23.8103);
  const [lng, setLng] = useState(90.4125);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const DIVISIONS = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh"];
  const CATEGORIES = [
    "Historic & Heritage",
    "Hill Tracts & Waterfalls",
    "Sea Beach & Islands",
    "Eco Sanctuary & Wildlife",
    "Swamp Forest & Wetlands",
    "River & Valleys",
    "City Landmark"
  ];

  useEffect(() => {
    if (place) {
      setName(place.name || "");
      setDistrict(place.district || "Dhaka");
      setDivision(place.division || "Dhaka");
      setCategory(place.category || "Historic & Heritage");
      setLat(place.lat || 23.8103);
      setLng(place.lng || 90.4125);
      setImage(place.image || (place.images && place.images[0]) || "");
      setDescription(place.description || "");
    } else {
      setName("");
      setDistrict("Dhaka");
      setDivision("Dhaka");
      setCategory("Historic & Heritage");
      setLat(23.8103);
      setLng(90.4125);
      setImage("https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600");
      setDescription("");
    }
    setErrorMsg("");
  }, [place, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter destination place name.");
      return;
    }

    const payload = {
      name: name.trim(),
      district: district.trim(),
      division: division.trim(),
      category,
      lat: parseFloat(lat) || 23.8103,
      lng: parseFloat(lng) || 90.4125,
      image: image.trim() || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600",
      description: description.trim()
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
            <div className="w-10 h-10 rounded-2xl bg-success/15 text-success flex items-center justify-center shrink-0 border border-success/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-base-content leading-tight">
                {isEditing ? `Edit Place: ${place.name}` : "Add Verified Tourist Destination"}
              </h3>
              <p className="text-xs text-base-content/70 mt-0.5">
                {isEditing ? "Update destination information and coordinates." : "Add a new geographic destination to the LagaTour map explorer."}
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

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Place / Landmark Name *</label>
            <input
              type="text"
              placeholder="e.g. Tanguar Haor Watchtower"
              className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Division</label>
              <select
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              >
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">District</label>
              <input
                type="text"
                placeholder="Sunamganj"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Category</label>
              <select
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              className="input input-sm input-bordered w-full rounded-xl text-xs"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Place Description</label>
            <textarea
              rows={3}
              placeholder="Provide background, accessibility notes, and local attractions..."
              className="textarea textarea-bordered w-full text-xs rounded-2xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success text-white btn-sm flex-1 rounded-xl text-xs font-bold shadow-md gap-1"
            >
              <Check className="w-4 h-4" /> {isEditing ? "Save Place" : "Add Place"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
