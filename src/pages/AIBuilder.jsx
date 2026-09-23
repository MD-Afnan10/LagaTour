import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useExpeditions } from "../context/ExpeditionContext";
import api from "../services/api";
import ExpeditionMap from "../components/expedition/ExpeditionMap";
import { 
  Sparkles, 
  MapPin, 
  DollarSign, 
  Clock, 
  Compass, 
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  Heart,
  FileCheck,
  Users,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Coffee,
  BedDouble,
  Car,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";
import confetti from "canvas-confetti";

const POPULAR_DESTINATIONS = [
  // 8 Divisions
  "Dhaka (Division)",
  "Chattogram (Division)",
  "Sylhet (Division)",
  "Rangpur (Division)",
  "Barishal (Division)",
  "Rajshahi (Division)",
  "Khulna (Division)",
  "Mymensingh (Division)",
  // Districts
  "Tangail",
  "Panchagarh",
  "Dinajpur",
  "Netrokona",
  "Cox's Bazar",
  "Bandarban",
  "Rangamati",
  "Kushtia",
  "Cumilla",
  "Kishoreganj",
  "Bogura",
  "Patuakhali",
  "Moulvibazar",
  "Sunamganj",
  // Specific Tour Places
  "Sajek Valley",
  "Kantaji Mandir",
  "Mohamaya Lake",
  "Nikli Haor",
  "Susang Durgapur",
  "Mohera Zamindar Bari",
  "Tanguar Haor",
  "Saint Martin's Island",
  "Nilgiri Cloud Resort",
  "Kuakata Sunset Beach",
  "Inani Coral Beach",
  "Bhimruli Floating Guava Market",
  "Sundarbans Mangrove",
  "Jaflong Zero Point",
  "Ratargul Swamp Forest",
  "Lalbagh Mughal Fort",
  "Patenga Sea Beach",
  "Somapura Mahavihara (Paharpur)"
];

export default function AIBuilder() {
  const navigate = useNavigate();
  const { currentUser, addPoints } = useAuth();
  const { createExpedition } = useExpeditions();

  // Mode Selection: "destination" (Plan 1) or "nearby" (Plan 2)
  const [mode, setMode] = useState("destination"); // 'destination' | 'nearby'

  // Input States
  const [destination, setDestination] = useState("Sajek Valley");
  const [startingLocation, setStartingLocation] = useState("Dhaka");
  const [endingLocation, setEndingLocation] = useState("Dhaka");
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [userGps, setUserGps] = useState(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsDetectedName, setGpsDetectedName] = useState("");
  const [budget, setBudget] = useState(18000);
  const [duration, setDuration] = useState(3);
  const [members, setMembers] = useState(2);
  const [style, setStyle] = useState("Adventure"); // Adventure, Budget, Luxury, Nature

  // Processing & Results
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [stepMessage, setStepMessage] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessModal, setSavedSuccessModal] = useState(null);

  // Auto-detect browser GPS coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserGps(coords);
        setGpsDetectedName(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        setStartingLocation("My Current GPS Location");
        if (isRoundTrip) setEndingLocation("My Current GPS Location");
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn("GPS detection warning:", err.message);
        // Fallback to Dhaka coordinates if denied
        setUserGps({ lat: 23.8103, lng: 90.4125 });
        setGpsDetectedName("Dhaka Central (Auto-set)");
        setStartingLocation("Dhaka");
        if (isRoundTrip) setEndingLocation("Dhaka");
        setIsDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  // Generate Plans via AI Service
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedResult(null);
    setSelectedPlanIndex(0);

    // Step 1: Query GIS & Community Tour Plans
    setStep(1);
    setStepMessage(mode === "destination" 
      ? `Scanning attractions & top-rated community tour plans for ${destination}...`
      : "Identifying top attractions & community routes near your current location...");
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Traveling Salesperson Sequencing & Community Tips
    setStep(2);
    setStepMessage("Synthesizing community traveler advice & spatial nearest-neighbor routing...");
    await new Promise(r => setTimeout(r, 600));

    // Step 3: Tariff & Room Optimizer
    setStep(3);
    setStepMessage(`Calculating connected circuit transit costs and budget splits for ${members} traveler(s)...`);

    try {
      const response = await api.generateAITourPlans({
        mode,
        destination: mode === "destination" ? destination : "Scenic Surroundings",
        startingLocation,
        endingLocation: isRoundTrip ? startingLocation : (endingLocation || startingLocation),
        userGps,
        duration: Number(duration),
        budget: Number(budget),
        members: Number(members),
        style
      });

      if (response && response.plans && response.plans.length > 0) {
        setGeneratedResult(response);
        if (addPoints) addPoints(40); // Reward for using AI Builder
      } else {
        throw new Error("No plans generated");
      }
    } catch (err) {
      console.error("AI Plan Generation failed:", err);
      alert("Failed to connect to AI engine. Please verify the server is running.");
    } finally {
      setIsLoading(false);
      setStep(0);
    }
  };

  // 1-Click Save Plan into MySQL Database & Local State
  const handleSaveAndManage = async () => {
    if (!generatedResult || !generatedResult.plans) return;
    const planToSave = generatedResult.plans[selectedPlanIndex];
    if (!planToSave) return;

    setIsSaving(true);
    try {
      const formattedStops = (planToSave.stops || []).map((s, idx) => ({
        id: `stop_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        placeId: s.placeId || s.place_id || null,
        placeName: s.placeName || s.place_name || s.name || s.location || `Stop ${idx + 1}`,
        location: s.location || s.placeName || s.place_name || planToSave.destination,
        lat: Number(s.lat ?? s.latitude ?? 23.8103),
        lng: Number(s.lng ?? s.longitude ?? 90.4125),
        transportMode: s.transportMode || "Bus",
        transportDetails: s.transportDetails || "",
        transportCost: Number(s.transportCost || 0),
        hasAccommodation: Boolean(s.hasAccommodation),
        accommodationType: s.accommodationType || "Hotel",
        accommodationName: s.accommodationName || "",
        accommodationCost: Number(s.accommodationCost || 0),
        accommodationDetails: s.accommodationDetails || "",
        stayDuration: s.stayDuration || "1 Night",
        notes: s.notes || "",
        status: "pending",
        photos: s.photos || [],
        expense: Number(s.expense || (Number(s.transportCost || 0) + Number(s.accommodationCost || 0)))
      }));

      const newTourData = {
        title: planToSave.title,
        description: planToSave.summary,
        startingLocation: planToSave.startingLocation || startingLocation,
        destination: planToSave.destination || destination,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + Number(duration) * 86400000).toISOString().split("T")[0],
        durationDays: Number(duration),
        targetBudget: Number(planToSave.targetBudget),
        spentBudget: Number(planToSave.totalCost || planToSave.targetBudget || 0),
        totalCost: Number(planToSave.totalCost || planToSave.targetBudget || 0),
        travelType: planToSave.travelType || "Friends",
        season: "Winter",
        transportation: planToSave.transportation || "Bus",
        coverImage: planToSave.stops?.[0]?.photos?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        status: "planned",
        stops: formattedStops
      };

      const created = await createExpedition(newTourData);

      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 }
      });

      if (addPoints) addPoints(100);

      setSavedSuccessModal(created || newTourData);
    } catch (err) {
      console.error("Error saving AI plan:", err);
      alert("Error saving tour plan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPlan = generatedResult?.plans?.[selectedPlanIndex] || null;
  const roomsNeeded = Math.ceil(members / 2);
  const budgetPerPerson = Math.round(budget / Math.max(1, members));

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-warning/10 text-warning rounded-xl">
              <Sparkles className="w-6 h-6 fill-warning" />
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">
              AI Tour Plan Builder
            </h1>
          </div>
          <p className="text-sm text-base-content/60 mt-1">
            Build optimal day-by-day sequenced itineraries with budget splits and live map routes.
          </p>
        </div>

        {/* Dual Mode Selector Tabs */}
        <div className="bg-base-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner border border-base-300 w-fit">
          <button
            type="button"
            onClick={() => setMode("destination")}
            className={`btn btn-sm rounded-xl font-bold gap-2 transition-all ${
              mode === "destination"
                ? "btn-primary text-slate-900 shadow-md"
                : "btn-ghost text-base-content/70 hover:text-base-content"
            }`}
          >
            <Compass className="w-4 h-4" />
            1. Target Destination
          </button>
          <button
            type="button"
            onClick={() => setMode("nearby")}
            className={`btn btn-sm rounded-xl font-bold gap-2 transition-all ${
              mode === "nearby"
                ? "btn-primary text-slate-900 shadow-md"
                : "btn-ghost text-base-content/70 hover:text-base-content"
            }`}
          >
            <Navigation className="w-4 h-4" />
            2. Explore Nearby (GPS)
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls Form & Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Input Form (4 cols) */}
        <div className="lg:col-span-4 card bg-base-100 border border-base-200 p-5 shadow-sm space-y-5 rounded-2xl">
          
          <div className="border-b border-base-200 pb-3">
            <h3 className="font-bold text-sm m-0 flex items-center gap-2 text-base-content/90">
              {mode === "destination" ? (
                <>
                  <Compass className="w-4 h-4 text-primary" />
                  Destination Specifications
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-secondary" />
                  Nearby Route Specifications
                </>
              )}
            </h3>
            <p className="text-[11px] text-base-content/50 mt-0.5">
              {mode === "destination"
                ? "AI maximizes the number of spots within this destination."
                : "AI builds a sequenced chain of spots starting from your location."}
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Mode 1: Destination input */}
            {mode === "destination" ? (
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Final Destination (Spot or City)
                  </span>
                </label>
                <input 
                  type="text" 
                  list="popular-destinations-list"
                  placeholder="e.g. Sajek Valley, Inani Beach, Tanguar..." 
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
                <datalist id="popular-destinations-list">
                  {POPULAR_DESTINATIONS.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </datalist>
                
                {/* Quick Selection Pills */}
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {["Dhaka", "Chattogram", "Sylhet", "Cox's Bazar", "Sajek Valley"].map((quickDest) => (
                    <button
                      key={quickDest}
                      type="button"
                      onClick={() => setDestination(quickDest)}
                      className={`btn btn-xs rounded-lg text-[10px] h-6 px-2 font-bold transition-all ${
                        destination.toLowerCase().includes(quickDest.toLowerCase())
                          ? "btn-primary text-slate-900 shadow-sm"
                          : "btn-ghost bg-base-200 text-base-content/70 hover:bg-base-300"
                      }`}
                    >
                      📍 {quickDest}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] text-base-content/50 mt-1">
                  Tip: Accepts any major division, district, scenic spot, or landmark.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-secondary flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> Spontaneous Exploration
                </span>
                <p className="text-[11px] text-base-content/70">
                  No fixed destination required. The AI scans regional attractions around your starting location and chains them in a logical loop.
                </p>
              </div>
            )}

            {/* Starting Location + GPS Detect */}
            <div className="form-control">
              <div className="flex justify-between items-center py-1">
                <label className="label-text text-xs font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-info" /> Starting From
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingGps}
                  className="btn btn-ghost btn-xs text-primary font-bold gap-1 text-[10px] px-1 h-auto py-0.5"
                >
                  {isDetectingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  Use My GPS
                </button>
              </div>
              <input 
                type="text" 
                placeholder="e.g. Dhaka, Sylhet, Chattogram..." 
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={startingLocation}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartingLocation(val);
                  if (isRoundTrip) setEndingLocation(val);
                  setUserGps(null);
                }}
                required
              />
              {gpsDetectedName && (
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> GPS locked: {gpsDetectedName}
                </span>
              )}
            </div>

            {/* Ending Destination / Return Point */}
            <div className="form-control space-y-1.5 p-2.5 bg-base-200/50 rounded-xl border border-base-200">
              <div className="flex items-center justify-between">
                <label className="label-text text-xs font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-secondary rotate-180" /> Ending Destination
                </label>
                <label className="label cursor-pointer p-0 gap-1.5">
                  <span className="label-text text-[10px] font-semibold text-base-content/70">Round Trip</span>
                  <input 
                    type="checkbox" 
                    checked={isRoundTrip} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsRoundTrip(checked);
                      if (checked) setEndingLocation(startingLocation);
                    }}
                    className="checkbox checkbox-primary checkbox-xs rounded"
                  />
                </label>
              </div>

              {isRoundTrip ? (
                <div className="flex items-center gap-1.5 text-[11px] text-base-content/70 bg-base-100 p-2 rounded-lg border border-base-300">
                  <span className="badge badge-xs badge-success text-[9px] font-bold">CONNECTED</span>
                  <span>Returns to origin: <strong className="text-base-content">{startingLocation || 'Dhaka'}</strong></span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input 
                    type="text" 
                    list="popular-destinations-list"
                    placeholder="e.g. Chattogram, Sylhet, Cox's Bazar..." 
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                    value={endingLocation}
                    onChange={(e) => setEndingLocation(e.target.value)}
                    required
                  />
                  <div className="flex flex-wrap gap-1">
                    {["Dhaka", "Chattogram", "Sylhet", "Cox's Bazar"].map((quickEnd) => (
                      <button
                        key={quickEnd}
                        type="button"
                        onClick={() => setEndingLocation(quickEnd)}
                        className={`btn btn-xs rounded-lg text-[10px] h-5 px-1.5 font-bold transition-all ${
                          endingLocation.toLowerCase().includes(quickEnd.toLowerCase())
                            ? "btn-secondary text-white shadow-sm"
                            : "btn-ghost bg-base-100 text-base-content/70 hover:bg-base-200"
                        }`}
                      >
                        🏁 {quickEnd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Duration (Days) & Members (People) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-warning" /> Duration
                  </span>
                </label>
                <div className="join w-full">
                  <input 
                    type="number" 
                    min="1" 
                    max="14"
                    className="input input-sm input-bordered join-item w-full rounded-l-xl text-xs text-center font-bold" 
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <span className="btn btn-sm btn-disabled join-item rounded-r-xl text-xs px-2 text-base-content/60">
                    Days
                  </span>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" /> Members
                  </span>
                </label>
                <div className="join w-full">
                  <input 
                    type="number" 
                    min="1" 
                    max="30"
                    className="input input-sm input-bordered join-item w-full rounded-l-xl text-xs text-center font-bold" 
                    value={members}
                    onChange={(e) => setMembers(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <span className="btn btn-sm btn-disabled join-item rounded-r-xl text-xs px-2 text-base-content/60">
                    People
                  </span>
                </div>
              </div>
            </div>

            {/* Room requirement badge helper */}
            <div className="flex items-center justify-between text-[11px] bg-base-200/70 px-3 py-1.5 rounded-lg border border-base-300">
              <span className="text-base-content/70 flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-secondary" /> Lodging Estimate:
              </span>
              <span className="font-bold text-base-content">
                {roomsNeeded} {roomsNeeded === 1 ? "Room" : "Rooms"} needed
              </span>
            </div>

            {/* Max Budget Limit */}
            <div className="form-control">
              <div className="flex justify-between items-center py-1">
                <label className="label-text text-xs font-bold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-success" /> Total Budget Limit
                </label>
                <span className="text-[10px] text-base-content/60 font-semibold">
                  ~{budgetPerPerson.toLocaleString()} BDT / person
                </span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  step="500"
                  min="2000"
                  className="input input-sm input-bordered w-full rounded-xl text-xs pr-12 font-bold" 
                  value={budget}
                  onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 1000))}
                  required
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-base-content/40 pointer-events-none">
                  BDT
                </span>
              </div>
            </div>

            {/* Travel Vibe / Style */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> Travel Vibe / Style
                </span>
              </label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs font-medium"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Adventure">⚡ Adventure & Mountain Trekking</option>
                <option value="Budget">🎒 Backpacker & Pocket Saver</option>
                <option value="Nature">🌿 Nature & River Sanctuary</option>
                <option value="Luxury">✨ Luxury Resort & Beach Leisure</option>
              </select>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-black w-full rounded-xl gap-2 shadow-md hover:shadow-lg transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Compiling Plans...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-900" />
                  Generate Multi-Plan Options
                </>
              )}
            </button>

          </form>

        </div>

        {/* Right Side: Results Display & Interactive Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Loading Animation Card */}
          {isLoading && (
            <div className="card bg-base-100 border border-base-200 p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-5 py-20 rounded-2xl">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-7 h-7 text-primary absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-black text-lg text-primary">LagaTour AI Routing Engine</h4>
                <p className="text-xs text-base-content/70 leading-relaxed min-h-[36px]">
                  {stepMessage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-base-300 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-700 ease-out" 
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Empty State before Generation */}
          {!isLoading && !generatedResult && (
            <div className="card bg-base-100 border border-base-200 p-8 shadow-sm text-center py-24 rounded-2xl space-y-3">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 fill-primary" />
              </div>
              <h3 className="font-black text-lg text-base-content/90">
                Ready to Build Your Tour Plan
              </h3>
              <p className="text-xs text-base-content/60 max-w-md mx-auto leading-relaxed">
                Choose between <strong>Target Destination</strong> (packing maximum scenic spots within your budget) or <strong>Explore Nearby</strong> (generating a sequenced road trip from your location).
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="badge badge-outline text-[11px] py-2 px-3 font-semibold">📍 Max Spots Optimizer</span>
                <span className="badge badge-outline text-[11px] py-2 px-3 font-semibold">🗺️ Sequenced Route</span>
                <span className="badge badge-outline text-[11px] py-2 px-3 font-semibold">👥 Room & Budget Splits</span>
                <span className="badge badge-outline text-[11px] py-2 px-3 font-semibold">💾 1-Click MySQL Sync</span>
              </div>
            </div>
          )}

          {/* Result Card: Display Plans & Interactive Route Map */}
          {!isLoading && generatedResult && selectedPlan && (
            <div className="space-y-4">
              
              {/* Plan Comparison Tabs (Option A vs Option B) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedResult.plans.map((p, idx) => {
                  const isSelected = selectedPlanIndex === idx;
                  return (
                    <div
                      key={p.planId}
                      onClick={() => setSelectedPlanIndex(idx)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-base-100 border-primary shadow-md ring-2 ring-primary/20"
                          : "bg-base-100/60 border-base-200 hover:border-base-300 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-black uppercase py-0.5 px-2.5 rounded-lg ${
                          p.badgeColor === "primary" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                        }`}>
                          {p.badgeTitle}
                        </span>
                        {isSelected && (
                          <span className="badge badge-sm badge-primary text-[10px] font-bold">Selected</span>
                        )}
                      </div>
                      <h4 className="font-black text-sm mt-2 mb-1 line-clamp-1">{p.title}</h4>
                      <p className="text-[11px] text-base-content/65 line-clamp-2 leading-relaxed mb-3">
                        {p.summary}
                      </p>
                      
                      <div className="flex items-center justify-between text-[11px] border-t border-base-200/80 pt-2 font-bold text-base-content/80">
                        <span className="flex items-center gap-1 text-primary">
                          <MapPin className="w-3.5 h-3.5" /> {p.spotsCount} Spots
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 text-success font-black">
                            <DollarSign className="w-3.5 h-3.5" /> {(p.totalCost || p.targetBudget).toLocaleString()} BDT
                          </span>
                          <span className="text-[9px] text-base-content/50 font-normal">
                            incl. ৳{Number(p.totalTransportCost || 0).toLocaleString()} transit
                          </span>
                        </div>
                        <span className="text-[10px] text-base-content/50 font-normal">
                          {p.pace}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Plan Details Container */}
              <div className="card bg-base-100 border border-base-200 p-6 shadow-sm rounded-2xl space-y-6">
                
                {/* Header & Save Action */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-base-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary text-slate-900 font-black text-[10px]">
                        {selectedPlan.badgeTitle}
                      </span>
                      <span className="badge badge-outline text-[10px] font-bold">
                        {selectedPlan.durationDays} Days Circuit
                      </span>
                    </div>
                    <h2 className="text-xl font-black">{selectedPlan.title}</h2>
                    <p className="text-xs text-base-content/60 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {selectedPlan.destination}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-info" /> {selectedPlan.memberCount} Travelers
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-secondary" /> {selectedPlan.accommodationType}
                      </span>
                    </p>

                    {/* Connected Circuit Route Bar */}
                    <div className="bg-base-200/80 p-2.5 rounded-xl border border-base-300/80 flex flex-wrap items-center justify-between gap-2 text-xs mt-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-600 flex items-center gap-1">🚩 {selectedPlan.startingLocation}</span>
                        <span className="text-base-content/40">➔</span>
                        <span className="text-primary flex items-center gap-1">📍 {selectedPlan.destination}</span>
                        <span className="text-base-content/40">➔</span>
                        <span className="text-purple-600 flex items-center gap-1">🏁 {selectedPlan.endingLocation || selectedPlan.startingLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-sm badge-success text-[10px] font-bold">Connected Circuit</span>
                        <span className="font-extrabold text-emerald-600 text-xs">
                          🚌 Transit: ৳{Number(selectedPlan.totalTransportCost || 0).toLocaleString()} BDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Save Plan Button */}
                  <button
                    onClick={handleSaveAndManage}
                    disabled={isSaving}
                    className="btn btn-primary text-slate-900 font-black rounded-xl text-xs gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4" />
                    )}
                    Save & Manage Plan
                  </button>
                </div>

                {/* Community Tour Plan Ideas Showcase */}
                {selectedPlan.communityInspirations && selectedPlan.communityInspirations.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                          💡
                        </span>
                        <div>
                          <h4 className="font-black text-xs uppercase tracking-wide text-amber-800 dark:text-amber-400 m-0">
                            Ideas Integrated From Community Tour Plans
                          </h4>
                          <span className="text-[10px] text-base-content/65">
                            Synthesized real traveler routes & local advice from LagaTour database
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-sm badge-warning font-bold text-[10px] text-slate-900 shrink-0 self-start sm:self-auto">
                        ✨ {selectedPlan.communityInspirations.length} Community Plan(s) Consulted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedPlan.communityInspirations.map((comm) => (
                        <div 
                          key={comm.id} 
                          className="bg-base-100/90 border border-amber-500/20 rounded-xl p-2.5 space-y-1.5 shadow-2xs hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-xs truncate text-base-content" title={comm.title}>
                              {comm.title}
                            </span>
                            <span className="badge badge-xs badge-ghost font-extrabold text-amber-600 text-[10px] shrink-0">
                              ⭐ {comm.rating}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-base-content/60">
                            <img 
                              src={comm.authorAvatar} 
                              alt={comm.authorName} 
                              className="w-4 h-4 rounded-full border border-base-300"
                            />
                            <span className="font-semibold truncate">{comm.authorName}</span>
                            <span>•</span>
                            <span>{comm.durationDays}D</span>
                            {comm.likes > 0 && <span>• ❤️ {comm.likes}</span>}
                          </div>

                          {comm.tips && (
                            <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40 p-1.5 rounded-lg text-[10px] text-amber-900 dark:text-amber-300 italic line-clamp-2">
                              "{comm.tips}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Leaflet Route Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-primary" /> Connected Route Trail ({selectedPlan.stops.length} Stops)
                    </span>
                    <span className="text-[11px] text-base-content/50">
                      Unbroken loop from Start to End
                    </span>
                  </div>
                  <ExpeditionMap 
                    stops={selectedPlan.stops} 
                    height="320px" 
                  />
                </div>

                {/* Dynamic Budget & Expense Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-success" /> Complete Budget Splits ({selectedPlan.memberCount} Persons)
                    </span>
                    <span className="text-xs font-black text-success">
                      Total: {(selectedPlan.totalCost || selectedPlan.targetBudget).toLocaleString()} BDT
                    </span>
                  </div>

                  {/* Grand Total Tour Cost Banner with explicit Transit inclusion */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success badge-sm font-black text-[10px] text-slate-900">
                          ALL TRANSIT COSTS INCLUDED
                        </span>
                        <span className="text-[11px] text-base-content/70 font-bold">
                          Departure + Sightseeing + Return Circuit
                        </span>
                      </div>
                      <p className="text-xs text-base-content/75 leading-relaxed m-0">
                        Total comprehensive trip estimate covering all <strong className="text-primary">{selectedPlan.stops.length} travel legs</strong> (৳{Number(selectedPlan.totalTransportCost || 0).toLocaleString()} BDT transit) plus lodging, meals, and entry tickets.
                      </p>
                    </div>
                    <div className="text-left sm:text-right sm:border-l sm:border-emerald-500/20 sm:pl-4 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-base-content/60 block">Grand Total Tour Cost</span>
                      <span className="text-lg font-black text-emerald-600 block">
                        ৳{(selectedPlan.totalCost || selectedPlan.targetBudget).toLocaleString()} <span className="text-xs font-bold">BDT</span>
                      </span>
                      <span className="text-[10px] text-base-content/60 font-semibold block">
                        (~৳{Math.round((selectedPlan.totalCost || selectedPlan.targetBudget) / (selectedPlan.memberCount || 1)).toLocaleString()} / person)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedPlan.expenseBreakdown.map((exp, idx) => (
                      <div key={idx} className="bg-base-200/70 border border-base-300/80 p-3 rounded-xl flex flex-col text-center">
                        <span className="text-[10px] text-base-content/60 font-semibold line-clamp-1">
                          {exp.category}
                        </span>
                        <span className="text-sm font-black text-primary mt-1">
                          {exp.amount.toLocaleString()} BDT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-by-Day Sequenced Stops Cards */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                    Day-by-Day Connected Itinerary
                  </span>
                  <div className="space-y-3">
                    {selectedPlan.itinerary.map((dayItem, dIdx) => {
                      const dayNumber = dIdx + 1;
                      const dayStops = selectedPlan.stops.filter(s => s.day === dayNumber);

                      return (
                        <div key={dIdx} className="bg-base-200/50 border border-base-300/70 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="badge badge-primary text-slate-900 font-black text-xs px-2.5 py-2">
                                {dayItem.day}
                              </span>
                              <h5 className="font-bold text-sm m-0">{dayItem.title}</h5>
                            </div>
                            <span className="text-[11px] text-base-content/50 font-semibold">
                              {dayStops.length} Leg(s) / Spot(s)
                            </span>
                          </div>

                          <p className="text-xs text-base-content/75 leading-relaxed bg-base-100 p-2.5 rounded-xl border border-base-200">
                            {dayItem.plan}
                          </p>

                          {/* Sequenced Spot Badges */}
                          {dayStops.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                                Travel Legs & Attractions:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dayStops.map((stop) => (
                                  <div key={stop.id} className={`flex items-center gap-2.5 p-2.5 bg-base-100 border rounded-xl text-xs transition-all ${
                                    stop.isDeparture ? 'border-emerald-300 ring-1 ring-emerald-200/50' : (stop.isReturn ? 'border-purple-300 ring-1 ring-purple-200/50' : 'border-base-200')
                                  }`}>
                                    <span className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                                      stop.isDeparture ? 'bg-emerald-100 text-emerald-700' : (stop.isReturn ? 'bg-purple-100 text-purple-700' : 'bg-primary/20 text-primary')
                                    }`}>
                                      {stop.isDeparture ? '🚩' : (stop.isReturn ? '🏁' : stop.order)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <p className="font-bold truncate text-[11px] m-0">{stop.placeName}</p>
                                        {stop.isDeparture && <span className="badge badge-xs badge-success text-[9px] font-bold">Start</span>}
                                        {stop.isReturn && <span className="badge badge-xs badge-secondary text-[9px] font-bold">End</span>}
                                        {Boolean(stop.isCommunityRecommended || stop.discoveryBadge === "Community Pick") && (
                                          <span className="badge badge-xs badge-warning text-[9px] font-bold text-slate-900 shrink-0" title={`Community recommendation by ${stop.communityAuthor || 'traveler'}`}>
                                            👥 Community Pick
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-base-content/60 truncate m-0">
                                        🚗 {stop.transportMode} {Number(stop.transportCost) > 0 ? `• ৳${Number(stop.transportCost).toLocaleString()} BDT` : ''}
                                      </p>
                                      {stop.transportDetails && (
                                        <p className="text-[9px] text-base-content/40 truncate m-0 italic">
                                          {stop.transportDetails}
                                        </p>
                                      )}
                                    </div>
                                    {stop.hasAccommodation && (
                                      <span className="badge badge-xs badge-secondary font-bold shrink-0">
                                        Stay
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Tip Alert */}
                <div className="p-3.5 bg-warning/10 border border-warning/20 text-warning-content rounded-2xl flex gap-3 items-start text-xs leading-relaxed">
                  <Sparkles className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black text-warning">AI Travel Advice:</strong>
                    <p className="text-base-content/80 mt-0.5">{selectedPlan.tips}</p>
                  </div>
                </div>

                {/* Action Bar Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-base-200">
                  <span className="text-xs text-base-content/50">
                    Plan is fully customizable once saved to your Tour Plans directory.
                  </span>
                  <button
                    onClick={handleSaveAndManage}
                    disabled={isSaving}
                    className="btn btn-primary text-slate-900 font-black rounded-xl text-xs gap-2 shadow-md w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4" />
                    )}
                    Save & Manage Plan (+100 Pts)
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* Success Modal after Saving Plan */}
      {savedSuccessModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-md p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-lg">Tour Plan Saved to Database!</h3>
              <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                Your AI plan <strong>"{savedSuccessModal.title}"</strong> has been saved into MySQL and is ready for live tracking, stop check-ins, and companion management.
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-xl text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-base-content/60">Destination:</span>
                <span className="font-bold">{savedSuccessModal.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Budget:</span>
                <span className="font-bold">{savedSuccessModal.targetBudget?.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Stops:</span>
                <span className="font-bold">{savedSuccessModal.stops?.length || 0} Sequenced Stops</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  setSavedSuccessModal(null);
                  navigate("/tour-plans");
                }}
                className="btn btn-primary text-slate-900 font-bold rounded-xl text-xs gap-1.5 flex-1"
              >
                <Compass className="w-4 h-4" /> Go to Tour Plans
              </button>
              <button
                onClick={() => setSavedSuccessModal(null)}
                className="btn btn-ghost rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
