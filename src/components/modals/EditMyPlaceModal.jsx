import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  Star, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Loader2,
  Globe,
  Lock
} from "lucide-react";
import confetti from "canvas-confetti";

export default function EditMyPlaceModal({ isOpen, onClose, place, currentUser, onSaved }) {
  const [locations, setLocations] = useState({ divisions: [], districts: [] });
  const [placeName, setPlaceName] = useState("");
  const [description, setDescription] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [safetyRating, setSafetyRating] = useState(5);
  const [isPublic, setIsPublic] = useState(false);
  const [images, setImages] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load locations on mount
  useEffect(() => {
    api.fetchLocations().then(res => {
      if (res && res.divisions) {
        setLocations(res);
      }
    }).catch(() => {});
  }, []);

  // Pre-fill form when place changes
  useEffect(() => {
    if (place) {
      setPlaceName(place.placeName || place.name || place.place_name || "");
      setDescription(place.description || "");
      setDivisionId(place.divisionId || place.division_id || "div_dhaka");
      setDistrictId(place.districtId || place.district_id || "dis_dhaka");
      setSafetyRating(place.safetyRating || place.safety_rating || 5);
      setIsPublic(Boolean(place.isPublic || place.is_public));
      setImages(place.images || (place.image ? [place.image] : []));
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [place]);

  if (!isOpen || !place) return null;

  // Filter districts for selected division
  const availableDistricts = locations.districts.filter(d => d.division_id === divisionId);

  // Handle Division Change
  const handleDivisionChange = (e) => {
    const newDivId = e.target.value;
    setDivisionId(newDivId);
    const firstMatchingDistrict = locations.districts.find(d => d.division_id === newDivId);
    if (firstMatchingDistrict) {
      setDistrictId(firstMatchingDistrict.district_id);
    }
  };

  // Compress image file to base64
  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      const compressedList = await Promise.all(files.map(f => compressImageFile(f)));
      setImages(prev => [...prev, ...compressedList].slice(0, 5)); // max 5 photos
    } catch (err) {
      console.error("Image upload failed:", err);
      setErrorMsg("Failed to process uploaded image.");
    }
  };

  // Remove Image
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!placeName.trim()) {
      setErrorMsg("Place name cannot be empty.");
      return;
    }

    // Strict validation before allowing a place to be published publicly
    if (isPublic) {
      const cleanName = placeName.trim();
      if (!cleanName || cleanName.startsWith("📍 Discovered Spot #") || cleanName.startsWith("Recorded Spot #") || cleanName.startsWith("Saved Spot #")) {
        setErrorMsg("Please provide a custom, specific place name before sharing publicly.");
        return;
      }
      if (!description.trim()) {
        setErrorMsg("Please provide a short description before sharing publicly.");
        return;
      }
      if (!divisionId || !districtId) {
        setErrorMsg("Please select both a division and district before sharing publicly.");
        return;
      }
      if (!images || images.length === 0) {
        setErrorMsg("Please upload at least one photo of the place before sharing publicly.");
        return;
      }
      if (!safetyRating || Number(safetyRating) < 1) {
        setErrorMsg("Please set a safety rating before sharing publicly.");
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg("");

    const selectedDivObj = locations.divisions.find(d => d.division_id === divisionId);
    const selectedDisObj = locations.districts.find(d => d.district_id === districtId);

    const payload = {
      user: currentUser,
      placeName: placeName.trim(),
      description: description.trim(),
      divisionId: divisionId,
      districtId: districtId,
      divisionName: selectedDivObj ? selectedDivObj.division_name : "Bangladesh",
      districtName: selectedDisObj ? selectedDisObj.district_name : "General",
      safetyRating: Number(safetyRating),
      isPublic: isPublic,
      images: images
    };

    try {
      const res = await api.updatePlace(place.id || place.place_id, payload);

      if (isPublic && (!place.isPublic && !place.is_public)) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      setSuccessMsg(res.message || "Place details updated successfully!");

      if (onSaved) {
        onSaved({
          ...place,
          ...payload,
          images: payload.images,
          isPublic: payload.isPublic
        });
      }

      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || "Could not update place details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="card w-full max-w-2xl bg-base-100 border border-base-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-base-200 flex items-center justify-between bg-base-200/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight m-0">Edit Place Details</h3>
              <p className="text-xs text-base-content/60 m-0">
                Coordinates: ({place.latitude?.toFixed(4)}, {place.longitude?.toFixed(4)})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {errorMsg && (
            <div className="alert alert-error text-xs font-bold rounded-2xl text-white shadow-sm">
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success text-xs font-bold rounded-2xl text-white shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Place Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/80">Place Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sreemangal Lawachara Tea Garden"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              className="input input-bordered w-full rounded-2xl text-sm font-semibold"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/80">Short Description & Travel Tips</label>
            <textarea
              rows={3}
              placeholder="Describe the atmosphere, best time to visit, safety observations, or local attractions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full rounded-2xl text-xs"
            />
          </div>

          {/* Division & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-base-content/80">Division</label>
              <select
                value={divisionId}
                onChange={handleDivisionChange}
                className="select select-bordered w-full rounded-2xl text-xs font-bold"
              >
                {locations.divisions.map((div) => (
                  <option key={div.division_id} value={div.division_id}>
                    {div.division_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-base-content/80">District</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="select select-bordered w-full rounded-2xl text-xs font-bold"
              >
                {availableDistricts.map((dis) => (
                  <option key={dis.district_id} value={dis.district_id}>
                    {dis.district_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Safety Rating Selector */}
          <div className="card bg-base-200/50 border border-base-300 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Place Safety Rating
              </span>
              <span className={`badge font-bold text-xs ${
                safetyRating >= 4.5 ? "badge-success text-white" : safetyRating >= 3.5 ? "badge-warning text-slate-900" : "badge-error text-white"
              }`}>
                {safetyRating >= 4.5 ? "Very Safe (Tourist Friendly)" : safetyRating >= 3.5 ? "Moderate Safety" : "Exercise Caution"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setSafetyRating(star)}
                  className={`btn btn-sm btn-circle ${
                    safetyRating >= star ? "btn-warning" : "btn-ghost"
                  }`}
                >
                  <Star className={`w-4 h-4 ${safetyRating >= star ? "fill-current" : ""}`} />
                </button>
              ))}
              <span className="text-sm font-black text-amber-500 ml-2">{safetyRating}.0 / 5.0</span>
            </div>
          </div>

          {/* Photos Upload & Gallery Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-base-content/80 flex items-center gap-1">
                <Camera className="w-4 h-4 text-primary" /> Photos ({images.length}/5)
              </label>
              <label className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-base-300">
                    <img src={imgUrl} alt="Place preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-base-300 rounded-2xl text-xs text-base-content/50">
                No photos uploaded yet. Add snapshots of this place.
              </div>
            )}
          </div>

          {/* Publish to Community Feed Switch */}
          <div className="card bg-base-200/70 border border-base-300 p-4 rounded-2xl flex flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-base-content">
                  Public Share to Places Feed
                </span>
                <span className="badge badge-xs badge-warning text-slate-900 font-black">+100 Pts</span>
              </div>
              <p className="text-[11px] text-base-content/60">
                Allow all LagaTour travelers to discover, like, and review safety for this place.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="toggle toggle-primary toggle-md"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-sm btn-ghost rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-sm btn-primary text-slate-900 font-black rounded-xl gap-2 shadow-md hover:scale-105 transition-transform"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isPublic ? "Save & Publish Place" : "Save Draft"}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
