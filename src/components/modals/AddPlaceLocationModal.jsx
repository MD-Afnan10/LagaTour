import React, { useState } from "react";
import api from "../../services/api";
import { 
  MapPin, 
  Compass, 
  Navigation, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Loader2, 
  PlusCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Star
} from "lucide-react";
import confetti from "canvas-confetti";

export default function AddPlaceLocationModal({ isOpen, onClose, currentUser, onPlaceAdded }) {
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [locationError, setLocationError] = useState("");
  
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [customName, setCustomName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  // 1. Get Live GPS Location
  const handleGetLocation = () => {
    setLocationError("");
    setSuccessMessage("");
    setNearbyPlaces([]);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setCoords({ lat, lng, accuracy });
        setIsLocating(false);

        // Search nearby places in database
        setIsSearchingNearby(true);
        try {
          const nearby = await api.fetchNearbyPlaces(lat, lng, 20); // 20km radius
          setNearbyPlaces(nearby || []);
        } catch (err) {
          console.warn("Could not fetch nearby places:", err.message);
        } finally {
          setIsSearchingNearby(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // 2. Option A: Quick Save Own Place (Instant 1-Click)
  const handleQuickSave = async () => {
    if (!coords) return;
    setIsSaving(true);
    setLocationError("");

    try {
      const res = await api.quickSavePlace({
        user: currentUser,
        latitude: coords.lat,
        longitude: coords.lng,
        customName: customName.trim() || undefined
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessMessage(res.message || "📍 Spot recorded to 'My Places'!");
      if (onPlaceAdded) onPlaceAdded(res.place);

      setTimeout(() => {
        onClose();
        setSuccessMessage("");
        setCoords(null);
        setCustomName("");
      }, 1500);
    } catch (err) {
      setLocationError(err.message || "Failed to save place.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Option B: Link Existing Nearby Place
  const handleLinkExisting = async (place) => {
    setIsSaving(true);
    setLocationError("");

    try {
      const res = await api.linkExistingPlace(currentUser, place.id || place.place_id);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessMessage(res.message || `Linked "${place.name || place.place_name}"! (+50 Points)`);
      if (onPlaceAdded) onPlaceAdded(place);

      setTimeout(() => {
        onClose();
        setSuccessMessage("");
        setCoords(null);
      }, 1500);
    } catch (err) {
      setLocationError(err.message || "Failed to link existing place.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="card w-full max-w-lg bg-base-100 border border-base-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-base-200 flex items-center justify-between bg-base-200/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight m-0">Record Place Location</h3>
              <p className="text-xs text-base-content/60 m-0">Capture your current GPS spot & save for later</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Alerts */}
          {locationError && (
            <div className="alert alert-error text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm text-white">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm text-white animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Step 1: GPS Capture Button */}
          {!coords ? (
            <div className="text-center py-6 px-4 bg-base-200/50 rounded-2xl border border-dashed border-base-300 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base">Where are you right now?</h4>
                <p className="text-xs text-base-content/60 max-w-xs mx-auto">
                  Click the button below to get your exact GPS coordinates and discover nearby places.
                </p>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="btn btn-primary text-slate-900 font-black rounded-xl shadow-lg gap-2 px-6 hover:scale-105 transition-transform"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>📍 Get My Current Location</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Coordinates Badge Bar */}
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary font-mono text-[11px] font-bold">GPS LOCKED</span>
                  <span className="font-mono text-base-content/80 font-semibold">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
                <button 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="btn btn-xs btn-ghost text-[10px] text-primary font-bold hover:bg-primary/20"
                >
                  Refresh GPS
                </button>
              </div>

              {/* Option 1: Quick Save Own Place */}
              <div className="card bg-base-200/60 border border-base-300 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Option 1: Save This Spot (+25 Pts)
                  </span>
                  <span className="badge badge-xs badge-neutral">Quick Save</span>
                </div>
                <p className="text-xs text-base-content/70">
                  Save your spot immediately with an auto-generated title. You can add photos, description, and safety rating later from <strong>My Places</strong>.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Optional Place Name (or leave blank to auto-generate)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input input-sm input-bordered rounded-xl flex-1 text-xs"
                  />
                  <button
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="btn btn-sm btn-primary text-slate-900 font-bold rounded-xl gap-1 shrink-0"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save Place</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Choose Existing Nearby Place */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-base-content/70">
                    Option 2: Existing Nearby Places ({nearbyPlaces.length})
                  </span>
                  <span className="badge badge-sm badge-warning text-slate-900 font-black text-[10px]">
                    +50 Bonus Pts on Link
                  </span>
                </div>

                {isSearchingNearby ? (
                  <div className="text-center py-4 text-xs text-base-content/50 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Searching places within 20km...</span>
                  </div>
                ) : nearbyPlaces.length === 0 ? (
                  <div className="text-center py-4 text-xs text-base-content/50 bg-base-200/30 rounded-xl border border-dashed border-base-300">
                    No verified places nearby. You are the first to discover this spot!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {nearbyPlaces.map((place) => (
                      <div 
                        key={place.id || place.place_id}
                        className="flex items-center justify-between p-3 bg-base-200/80 hover:bg-base-200 border border-base-300 rounded-xl transition-all gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {place.images && Array.isArray(place.images) && place.images.length > 0 && place.images[0] ? (
                            <img
                              src={place.images[0]}
                              alt={place.place_name || place.name}
                              className="w-10 h-10 rounded-lg object-cover bg-black/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center text-primary shrink-0">
                              <MapPin className="w-5 h-5 opacity-60" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs truncate leading-tight">
                              {place.place_name || place.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-base-content/60 mt-0.5">
                              <span>📍 {place.distanceKm || "Nearby"} km away</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {place.safetyRating || place.safety_rating || 5.0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLinkExisting(place)}
                          disabled={isSaving}
                          className="btn btn-xs btn-outline btn-primary font-bold rounded-lg shrink-0 gap-1"
                        >
                          <span>Link Place</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 flex justify-end bg-base-200/30">
          <button onClick={onClose} className="btn btn-sm btn-ghost rounded-xl font-bold">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
