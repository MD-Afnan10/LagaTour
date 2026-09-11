import React, { useState, useEffect, useMemo, useCallback } from "react";
import MapComponent from "../components/MapComponent";
import { 
  MapPin, 
  Star, 
  Calendar, 
  Compass, 
  ArrowRight, 
  Search, 
  Navigation, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Map as MapIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MapExplorer() {
  const { currentUser } = useAuth();

  // Real Database Places & Plans State
  const [places, setPlaces] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Map Selection State
  const [selectedPin, setSelectedPin] = useState(null);
  const [relatedPlans, setRelatedPlans] = useState([]);
  const [activePlaceName, setActivePlaceName] = useState("");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");

  // User Live Location State
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  /**
   * 1. Fetch Real Places from MySQL Backend
   */
  const loadRealData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      // Fetch public community places from database
      const publicPlacesPromise = api.fetchPublicPlaces();
      // Fetch ranked community tour plans
      const rankedPlansPromise = api.fetchRankedPlans().catch(() => ({ plans: [] }));
      // Fetch user's personal saved places if logged in
      const myPlacesPromise = (currentUser?.id || currentUser?.user_id) 
        ? api.fetchUserMyPlaces(currentUser.id || currentUser.user_id).catch(() => [])
        : Promise.resolve([]);

      const [publicPlaces, plansRes, myPlaces] = await Promise.all([
        publicPlacesPromise,
        rankedPlansPromise,
        myPlacesPromise
      ]);

      // Normalize and merge unique places by place_id
      const placesMap = new Map();

      // Add public places
      (publicPlaces || []).forEach(p => {
        const id = p.id || p.place_id;
        const lat = parseFloat(p.latitude || p.lat);
        const lng = parseFloat(p.longitude || p.lng);

        if (id && !isNaN(lat) && !isNaN(lng)) {
          placesMap.set(id, {
            ...p,
            id,
            name: p.name || p.place_name || p.placeName || "Scenic Spot",
            latitude: lat,
            longitude: lng,
            district: p.district_name || p.district || "Bangladesh",
            division: p.division_name || p.division || "",
            safetyRating: Number(p.safetyRating || p.safety_rating || 5.0),
            images: p.images || (p.image ? [p.image] : []),
            description: p.description || "Community travel place in Bangladesh."
          });
        }
      });

      // Add user's personal places if not already present
      (myPlaces || []).forEach(p => {
        const id = p.id || p.place_id;
        const lat = parseFloat(p.latitude || p.lat);
        const lng = parseFloat(p.longitude || p.lng);

        if (id && !isNaN(lat) && !isNaN(lng) && !placesMap.has(id)) {
          placesMap.set(id, {
            ...p,
            id,
            name: p.name || p.place_name || p.placeName || "My Saved Spot",
            latitude: lat,
            longitude: lng,
            district: p.districtName || p.district_name || p.district || "Bangladesh",
            division: p.divisionName || p.division_name || p.division || "",
            safetyRating: Number(p.safetyRating || p.safety_rating || 5.0),
            images: p.images || [],
            description: p.description || "Personal spot saved in 'My Places'."
          });
        }
      });

      const allPlaces = Array.from(placesMap.values());
      setPlaces(allPlaces);
      setPlans(plansRes?.plans || []);

      // Auto-select first place if none selected
      if (allPlaces.length > 0 && !selectedPin) {
        // Just pre-cache plans for first place
        const first = allPlaces[0];
        filterPlansForPlace(first, plansRes?.plans || []);
      }
    } catch (err) {
      console.error("Failed to load real map places:", err);
      setLoadError("Unable to connect to database. Please make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  /**
   * 2. Live Hardware GPS Capture
   */
  const locateUser = useCallback((shouldFly = false) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { lat: latitude, lng: longitude, accuracy };
        setUserLocation(newLocation);
        setIsLocating(false);

        // If explicitly triggered by user click, focus on user location
        if (shouldFly) {
          setSelectedPin({
            id: "user_live_location",
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            name: "Your Current Location"
          });
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not get your location.";
        if (err.code === 1) msg = "Location permission was denied.";
        else if (err.code === 2) msg = "Location unavailable.";
        else if (err.code === 3) msg = "Location request timed out.";
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, []);

  // Initial Data Load & Initial Geolocation
  useEffect(() => {
    loadRealData();
    locateUser(false);
  }, [loadRealData, locateUser]);

  /**
   * Filter related tour plans when a place is clicked
   */
  const filterPlansForPlace = (place, planList = plans) => {
    const pName = (place.name || "").toLowerCase();
    const pDistrict = (place.district || "").toLowerCase();

    const matched = (planList || []).filter(plan => {
      const dest = (plan.destination || "").toLowerCase();
      const title = (plan.title || "").toLowerCase();
      return (
        (pName && (dest.includes(pName) || title.includes(pName))) ||
        (pDistrict && (dest.includes(pDistrict) || title.includes(pDistrict)))
      );
    });

    setRelatedPlans(matched);
  };

  /**
   * Handle Pin / Card Click
   */
  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    setActivePlaceName(pin.name);
    filterPlansForPlace(pin);
  };

  // Filter places based on search query and division
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesSearch = 
        !searchQuery ||
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.division.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDivision = 
        selectedDivision === "All" ||
        place.division.toLowerCase().includes(selectedDivision.toLowerCase());

      return matchesSearch && matchesDivision;
    });
  }, [places, searchQuery, selectedDivision]);

  // Extract unique divisions for filter tabs
  const availableDivisions = useMemo(() => {
    const divs = new Set();
    places.forEach(p => {
      if (p.division) divs.add(p.division);
    });
    return ["All", ...Array.from(divs).sort()];
  }, [places]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-base-100">
      
      {/* ===================== SIDEBAR ===================== */}
      <div className="w-full lg:w-[420px] bg-base-100 border-r border-base-300 flex flex-col h-1/2 lg:h-full overflow-hidden shadow-sm z-10">
        
        {/* Header */}
        <div className="p-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2 m-0 text-base-content">
              <Compass className="w-5 h-5 text-primary" />
              <span>Real Tour Map Explorer</span>
            </h2>
            <button
              onClick={loadRealData}
              className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-primary"
              title="Refresh database places"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">
            Discover community-saved GPS spots & live travel coordinates.
          </p>

          {/* Search Box */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search spots by name or district..."
              className="input input-sm input-bordered w-full pl-9 text-xs rounded-xl bg-base-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>

          {/* Division Filter Pills */}
          {availableDivisions.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
              {availableDivisions.map(divName => (
                <button
                  key={divName}
                  onClick={() => setSelectedDivision(divName)}
                  className={`btn btn-xs rounded-lg px-2.5 text-[11px] font-bold shrink-0 transition-all ${
                    selectedDivision === divName 
                      ? "btn-primary text-slate-900 shadow-sm" 
                      : "btn-ghost bg-base-300/60 hover:bg-base-300 text-base-content/75"
                  }`}
                >
                  {divName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Active destination details & plans */}
          {selectedPin && (
            <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-primary">Focused Destination</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedPin(null);
                    setActivePlaceName("");
                    setRelatedPlans([]);
                  }} 
                  className="text-[11px] hover:underline text-base-content/50 font-bold"
                >
                  Clear focus
                </button>
              </div>

              <div className="flex gap-3">
                {selectedPin.images && selectedPin.images.length > 0 ? (
                  <img 
                    src={selectedPin.images[0]} 
                    alt={selectedPin.name} 
                    className="w-20 h-20 rounded-xl object-cover border border-base-300 shrink-0" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-base-300/70 border border-base-300 flex flex-col items-center justify-center text-base-content/40 shrink-0">
                    <MapIcon className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">No Image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-base-content leading-tight truncate m-0">
                    {selectedPin.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedPin.district}{selectedPin.division ? `, ${selectedPin.division}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="badge badge-warning badge-sm font-extrabold gap-0.5 text-slate-900">
                      ★ {Number(selectedPin.safetyRating || 5.0).toFixed(1)}
                    </span>
                    <span className="font-mono text-base-content/50 text-[10px]">
                      {selectedPin.latitude?.toFixed(3)}, {selectedPin.longitude?.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-base-content/75 line-clamp-2 leading-relaxed">
                {selectedPin.description}
              </p>

              {/* Related Tour Plans */}
              {relatedPlans.length > 0 && (
                <div className="pt-2 border-t border-primary/20 space-y-2">
                  <span className="text-[11px] font-black uppercase text-base-content/70 block">
                    Matching Itineraries ({relatedPlans.length})
                  </span>
                  {relatedPlans.map(plan => (
                    <div key={plan.id} className="card bg-base-100 border border-base-300 p-2.5 rounded-xl shadow-xs">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-xs leading-snug flex-1">{plan.title}</h4>
                        <span className="badge badge-primary font-black text-[10px] py-1 px-2 rounded-md shrink-0">
                          {Number(plan.totalBudget).toLocaleString()} BDT
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-base-content/60">
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {plan.rating || 5.0}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {plan.duration} Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Directory Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-base-content/50">
              Verified Spots Directory ({filteredPlaces.length})
            </span>
            {userLocation && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                GPS Active
              </span>
            )}
          </div>

          {/* Loading & Error States */}
          {isLoading && (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl border border-base-200 animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-base-300"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-base-300 rounded w-3/4"></div>
                    <div className="h-3 bg-base-300 rounded w-1/2"></div>
                    <div className="h-3 bg-base-300 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadError && (
            <div className="alert alert-error text-xs rounded-2xl py-3 shadow-sm">
              <span>{loadError}</span>
              <button onClick={loadRealData} className="btn btn-xs btn-outline">Retry</button>
            </div>
          )}

          {/* Places List */}
          {!isLoading && filteredPlaces.length === 0 && (
            <div className="card bg-base-200/50 border border-dashed border-base-300 p-8 text-center rounded-3xl space-y-2">
              <Compass className="w-8 h-8 mx-auto text-base-content/30" />
              <h4 className="font-bold text-xs text-base-content m-0">No places match your search</h4>
              <p className="text-[11px] text-base-content/60 m-0">Try searching a different district or reset filters.</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedDivision("All"); }}
                className="btn btn-xs btn-primary font-bold rounded-lg mt-2"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!isLoading && filteredPlaces.length > 0 && (
            <div className="space-y-2.5">
              {filteredPlaces.map(place => {
                const isSelected = (selectedPin?.id || selectedPin?.place_id) === (place.id || place.place_id);
                const photo = (place.images && place.images.length > 0) ? place.images[0] : null;

                return (
                  <div 
                    key={place.id || place.place_id}
                    onClick={() => handlePinClick(place)}
                    className={`flex gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30" 
                        : "border-base-200 hover:border-base-300 hover:bg-base-200/50 bg-base-100"
                    }`}
                  >
                    {/* Place Photo or Clean Map Badge */}
                    {photo ? (
                      <img 
                        src={photo} 
                        alt={place.name} 
                        className="w-16 h-16 rounded-xl object-cover bg-base-300 shrink-0 border border-base-300" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-base-200 to-base-300 border border-base-300 flex flex-col items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[8px] font-bold text-base-content/50 mt-0.5">Spot</span>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-base-content leading-snug truncate m-0">
                            {place.name}
                          </h4>
                          <span className="font-extrabold text-[11px] text-amber-500 shrink-0 flex items-center gap-0.5">
                            ★ {place.safetyRating?.toFixed(1) || "5.0"}
                          </span>
                        </div>

                        <div className="text-[10px] font-bold text-primary/80 mt-0.5 flex items-center gap-1 truncate">
                          <span>📍 {place.district}</span>
                          {place.division && <span className="text-base-content/40">• {place.division}</span>}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-1 text-[10px] text-base-content/50">
                        <span className="font-mono text-[9px]">
                          ({place.latitude?.toFixed(2)}, {place.longitude?.toFixed(2)})
                        </span>
                        <span className="text-primary font-bold text-[10px] flex items-center gap-0.5 hover:underline">
                          View Map <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ===================== MAP AREA ===================== */}
      <div className="flex-1 h-1/2 lg:h-full relative">
        <MapComponent 
          pins={filteredPlaces} 
          selectedPin={selectedPin} 
          onPinClick={handlePinClick} 
          userLocation={userLocation}
          onLocateMe={() => locateUser(true)}
          isLocating={isLocating}
        />
        
        {/* Floating guidance overlay */}
        <div className="absolute top-4 right-16 z-[400] bg-base-100/90 backdrop-blur border border-base-300 py-1.5 px-3 rounded-xl shadow-md hidden sm:flex items-center gap-2 text-[10px] font-bold text-base-content/85">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Real Database Spots & Live GPS Position</span>
        </div>

        {/* Location Error Toast */}
        {locationError && (
          <div className="absolute top-16 left-4 z-[400] alert alert-warning py-1.5 px-3 rounded-xl shadow-md text-xs font-semibold flex items-center gap-2">
            <span>⚠️ {locationError}</span>
            <button onClick={() => setLocationError("")} className="btn btn-ghost btn-xs">✕</button>
          </div>
        )}
      </div>

    </div>
  );
}
