import React, { useState, useEffect, useRef } from "react";
import { useExpeditions } from "../../context/ExpeditionContext";
import { useAuth } from "../../context/AuthContext";
import { 
  X, 
  Map, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  Navigation, 
  Hotel, 
  Car, 
  ArrowRight, 
  Compass, 
  Sparkles,
  Info,
  Check,
  Search,
  UserCheck,
  UserPlus,
  ShieldCheck,
  UserX,
  Camera,
  Image as ImageIcon,
  Upload
} from "lucide-react";

const TRANSPORT_OPTIONS = [
  "Train",
  "Flight",
  "AC Bus",
  "Non-AC Bus",
  "Private Car / Sedan",
  "4x4 Jeep / Chander Gari",
  "Boat / Launch",
  "Speedboat",
  "CNG Auto",
  "Trekking / Walk"
];

const ACCOMMODATION_OPTIONS = [
  "Hotels",
  "Eco-Resorts",
  "Houseboats",
  "Camping",
  "Home Stay",
  "Overnight Transit",
  "Hostels",
  "None (Day Visit)"
];

const PRESET_COVER_IMAGES = [
  { label: "🌿 Sylhet Tea Gardens", url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800" },
  { label: "⛵ Tanguar Haor Houseboat", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
  { label: "⛰️ Bandarban & Nafakhum", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800" },
  { label: "☁️ Sajek Cloud Kingdom", url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800" },
  { label: "🏖️ Cox's Bazar Marine Drive", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
  { label: "🌴 Saint Martin's Island", url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800" }
];

export default function ExpeditionFormModal({
  isOpen,
  onClose,
  initialData = null, // null for create, expedition object for edit
  onSaved = null
}) {
  const { 
    createExpedition, 
    updateExpedition, 
    placesDatabase, 
    companionsDatabase, 
    existingTourGroups = [] 
  } = useExpeditions();
  const { currentUser } = useAuth();

  const isEditMode = !!initialData;
  const coverFileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingLocation, setStartingLocation] = useState("Dhaka");
  const [destination, setDestination] = useState("Sylhet");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetBudget, setTargetBudget] = useState(25000);
  const [travelType, setTravelType] = useState("Friends");
  const [season, setSeason] = useState("Monsoon");
  const [selectedCompanions, setSelectedCompanions] = useState([]);
  const [stops, setStops] = useState([]);
  const [coverImage, setCoverImage] = useState("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");

  // Place quick-selector state for adding a stop
  const [selectedDatabasePlaceId, setSelectedDatabasePlaceId] = useState("");

  // Companion Search & Tour Group Quick-Invite States
  const [companionSearchQuery, setCompanionSearchQuery] = useState("");
  const [selectedTourGroupId, setSelectedTourGroupId] = useState("");
  const [groupInviteFeedback, setGroupInviteFeedback] = useState("");

  // Load user's groups dynamically (merging context existing groups + localStorage ts_groups)
  const [userTourGroups, setUserTourGroups] = useState([]);

  useEffect(() => {
    const savedGroups = localStorage.getItem("ts_groups");
    let parsedSaved = [];
    if (savedGroups) {
      try {
        parsedSaved = JSON.parse(savedGroups);
      } catch (e) {
        console.warn("Could not parse ts_groups", e);
      }
    }

    const combined = [...existingTourGroups];
    parsedSaved.forEach(sg => {
      if (!combined.some(g => g.id === sg.id)) {
        combined.push(sg);
      }
    });

    setUserTourGroups(combined);
  }, [existingTourGroups]);

  // Populate state when opening in edit mode
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setStartingLocation(initialData.startingLocation || "Dhaka");
      setDestination(initialData.destination || "Sylhet");
      setStartDate(initialData.startDate || "");
      setEndDate(initialData.endDate || "");
      setTargetBudget(initialData.targetBudget || 25000);
      setTravelType(initialData.travelType || "Friends");
      setSeason(initialData.season || "Monsoon");
      setSelectedCompanions(initialData.companions || []);
      setStops(initialData.stops || []);
      setCoverImage(initialData.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");
    } else {
      const defaultStart = new Date().toISOString().split("T")[0];
      const defaultEnd = new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0];
      
      setTitle("Dhaka to Sylhet & Tanguar Haor Expedition");
      setDescription("A multi-stop journey across Sreemangal tea estates and Sunamganj houseboats.");
      setStartingLocation("Dhaka");
      setDestination("Sylhet");
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
      setTargetBudget(28000);
      setTravelType("Friends");
      setSeason("Monsoon");
      setSelectedCompanions([companionsDatabase[0], companionsDatabase[1]]);
      
      setStops([
        {
          id: "stop_init_1",
          order: 1,
          placeName: "Dhaka Kamalapur Station",
          location: "Kamalapur, Dhaka",
          lat: 23.7317,
          lng: 90.4253,
          transportMode: "Train",
          transportDetails: "Parabat Express AC Chair",
          transportCost: 1200,
          accommodationType: "None (Day Visit)",
          accommodationDetails: "Morning departure",
          accommodationCost: 0,
          stayDuration: "Departed",
          notes: "Assemble with companions and gear at station.",
          photos: ["https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=500"],
          status: "pending",
          isSpontaneous: false
        },
        {
          id: "stop_init_2",
          order: 2,
          placeName: "Sreemangal Lawachara Rainforest",
          location: "Moulvibazar, Sylhet",
          lat: 24.3065,
          lng: 91.7296,
          transportMode: "CNG Auto",
          transportDetails: "Reserved Local CNG",
          transportCost: 450,
          accommodationType: "Eco-Resorts",
          accommodationDetails: "Grand Sultan & Rain Forest Resort Eco Villa",
          accommodationCost: 6500,
          stayDuration: "1 Night",
          notes: "Trek through canopy trail and taste 7-layer tea.",
          photos: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500"],
          status: "pending",
          isSpontaneous: false
        },
        {
          id: "stop_init_3",
          order: 3,
          placeName: "Tanguar Haor & Tahirpur",
          location: "Sunamganj, Sylhet",
          lat: 25.1270,
          lng: 91.0740,
          transportMode: "Boat / Launch",
          transportDetails: "Traditional Wooden Houseboat",
          transportCost: 2200,
          accommodationType: "Houseboats",
          accommodationDetails: "Dual-deck Premium Houseboat",
          accommodationCost: 5500,
          stayDuration: "1 Night",
          notes: "Houseboat cruise across watch tower and Niladri lake.",
          photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"],
          status: "pending",
          isSpontaneous: false
        }
      ]);
    }
  }, [initialData, isOpen, companionsDatabase]);

  if (!isOpen) return null;

  // RULE: The user can ONLY add users that are either a Follower of the author OR being Followed by the author!
  const eligibleConnectedCompanions = companionsDatabase.filter(c => {
    return c.isFollower === true || c.isFollowing === true || (c.connectionType && c.connectionType !== "Not Connected");
  });

  // Filtered by Search Query
  const filteredCompanions = eligibleConnectedCompanions.filter(c => {
    if (!companionSearchQuery.trim()) return true;
    const q = companionSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || 
           c.username.toLowerCase().includes(q) || 
           (c.role && c.role.toLowerCase().includes(q));
  });

  // Companion toggle
  const toggleCompanion = (companion) => {
    setSelectedCompanions(prev => {
      const exists = prev.some(c => c.id === companion.id);
      if (exists) {
        return prev.filter(c => c.id !== companion.id);
      } else {
        return [...prev, companion];
      }
    });
  };

  // Quick Invite ALL persons from an existing tour group
  const handleInviteAllFromGroup = () => {
    if (!selectedTourGroupId) {
      alert("Please select an existing tour group from the dropdown.");
      return;
    }

    const targetGroup = userTourGroups.find(g => g.id === selectedTourGroupId);
    if (!targetGroup || !targetGroup.members || targetGroup.members.length === 0) {
      alert("No members found in the selected tour group.");
      return;
    }

    const currentUserId = currentUser?.id || currentUser?.user_id;
    const newMembersToAdd = targetGroup.members.filter(m => {
      if (!m) return false;
      const isSelf = (m.id && m.id === currentUserId) || (m.username && m.username === currentUser?.username);
      return !isSelf;
    });

    setSelectedCompanions(prev => {
      const merged = [...prev];
      newMembersToAdd.forEach(member => {
        const existingInDb = companionsDatabase.find(c => c.id === member.id || c.username === member.username);
        const companionObj = existingInDb || {
          id: member.id || "user_" + Date.now() + Math.random(),
          name: member.name || member.username || "Group Member",
          username: member.username || "traveler",
          avatar: member.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.username || 'member'}`,
          league: member.league || "Adventurer",
          role: member.role || "Tour Group Comrade",
          connectionType: "Group Member",
          isFollower: true,
          isFollowing: true
        };

        if (!merged.some(c => c.id === companionObj.id || c.username === companionObj.username)) {
          merged.push(companionObj);
        }
      });
      return merged;
    });

    setGroupInviteFeedback(`✅ Added ${newMembersToAdd.length} members from "${targetGroup.title || targetGroup.name}"!`);
    setTimeout(() => setGroupInviteFeedback(""), 3500);
  };

  // Cover Image File Upload Handler
  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setCoverImage(uploadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Stop Photo File Upload Handler
  const handleStopPhotoUpload = (stopIndex, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const updated = [...stops];
          const existingPhotos = updated[stopIndex].photos || [];
          updated[stopIndex].photos = [...existingPhotos, uploadEvent.target.result];
          setStops(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add stop photo by URL
  const handleAddStopPhotoUrl = (stopIndex) => {
    const url = prompt("Enter image URL for this stop:");
    if (url && url.trim()) {
      const updated = [...stops];
      const existingPhotos = updated[stopIndex].photos || [];
      updated[stopIndex].photos = [...existingPhotos, url.trim()];
      setStops(updated);
    }
  };

  // Remove photo from stop
  const handleRemoveStopPhoto = (stopIndex, photoIndex) => {
    const updated = [...stops];
    if (updated[stopIndex].photos) {
      updated[stopIndex].photos = updated[stopIndex].photos.filter((_, idx) => idx !== photoIndex);
      setStops(updated);
    }
  };

  // Add Stop handler
  const handleAddStop = () => {
    let newStopPlace = null;
    if (selectedDatabasePlaceId) {
      newStopPlace = placesDatabase.find(p => p.id === selectedDatabasePlaceId);
    }

    const newStop = {
      id: "stop_" + Date.now(),
      order: stops.length + 1,
      placeName: newStopPlace ? newStopPlace.name : "New Stop Location",
      location: newStopPlace ? `${newStopPlace.district}, ${newStopPlace.division}` : "Custom Place",
      lat: newStopPlace ? newStopPlace.lat : 24.0000 + Math.random() * 0.5,
      lng: newStopPlace ? newStopPlace.lng : 90.5000 + Math.random() * 0.8,
      transportMode: "AC Bus",
      transportDetails: "Highway bus route",
      transportCost: 1000,
      accommodationType: "Hotels",
      accommodationDetails: "Standard Hotel Room",
      accommodationCost: 3000,
      stayDuration: "1 Night",
      notes: "Sightseeing and food exploration.",
      photos: newStopPlace ? [newStopPlace.image] : [],
      status: "pending",
      isSpontaneous: false
    };

    setStops([...stops, newStop]);
    setSelectedDatabasePlaceId("");
  };

  // Update specific stop field
  const handleUpdateStop = (index, field, value) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  // Remove stop
  const handleRemoveStop = (index) => {
    if (stops.length <= 1) {
      alert("An expedition must have at least one stop.");
      return;
    }
    const updated = stops.filter((_, idx) => idx !== index).map((s, i) => ({ ...s, order: i + 1 }));
    setStops(updated);
  };

  // Calculate estimated total from stops
  const calculatedEstimatedCosts = stops.reduce((sum, s) => {
    return sum + Number(s.transportCost || 0) + Number(s.accommodationCost || 0);
  }, 0);

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || stops.length === 0) {
      alert("Please provide a title and at least one stop.");
      return;
    }

    const payload = {
      title,
      description,
      startingLocation,
      destination,
      startDate,
      endDate,
      targetBudget: Number(targetBudget),
      travelType,
      season,
      coverImage,
      companions: selectedCompanions,
      stops: stops
    };

    let result;
    if (isEditMode) {
      result = updateExpedition(initialData.id, payload);
    } else {
      result = createExpedition(payload);
    }

    if (onSaved) onSaved(result);
    onClose();
  };

  return (
    <div className="modal modal-open z-[999]">
      <div className="modal-box max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 md:p-8 border border-base-300 bg-base-100 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-base-300 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black m-0 tracking-tight text-base-content">
                {isEditMode ? "Modify Tour Plan & Expedition" : "Plan New Tour Expedition"}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                {isEditMode 
                  ? "Update stops, budget, photos, transport, stays, or companions at any time." 
                  : "Assemble your multi-stop route, upload pictures, and invite companions."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Overview & Cover Photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text text-xs font-bold">Expedition Title</span></label>
              <input 
                type="text" 
                placeholder="e.g. Dhaka to Sylhet & Tanguar Haor Houseboat Expedition" 
                className="input input-sm md:input-md input-bordered w-full rounded-xl text-sm" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Cover Photo Selector & Upload */}
            <div className="form-control md:col-span-2 p-4 bg-base-200/50 rounded-2xl border border-base-300 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> Tour Cover Photo
                </span>
                <input 
                  type="file" 
                  ref={coverFileInputRef} 
                  onChange={handleCoverFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => coverFileInputRef.current?.click()}
                  className="btn btn-xs btn-primary text-primary-content font-bold rounded-lg gap-1"
                >
                  <Upload className="w-3 h-3" /> Upload from Device
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-48 h-28 rounded-2xl overflow-hidden border-2 border-base-300 shrink-0 bg-base-300">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">Preview</span>
                </div>

                <div className="flex-1 space-y-2 w-full text-xs">
                  <div className="form-control">
                    <input 
                      type="text" 
                      placeholder="Or paste cover image URL..." 
                      className="input input-xs input-bordered w-full rounded-lg" 
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                    />
                  </div>

                  {/* Preset photo tags */}
                  <div>
                    <span className="text-[10px] text-base-content/60 font-bold block mb-1">Quick Select Scenic Cover:</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COVER_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCoverImage(preset.url)}
                          className="btn btn-xs btn-ghost border border-base-300 rounded-lg text-[10px] py-0 px-2"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Starting Point (Origin)</span></label>
              <input 
                type="text" 
                placeholder="e.g. Dhaka" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={startingLocation}
                onChange={(e) => setStartingLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Main Final Destination</span></label>
              <select 
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {placesDatabase.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.division})</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">Start Date</span></label>
              <input 
                type="date" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text text-xs font-bold">End Date</span></label>
              <input 
                type="date" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <div className="flex justify-between items-center py-1">
                <span className="label-text text-xs font-bold">Target Budget (BDT)</span>
                <span className="text-xs font-black text-primary">{Number(targetBudget).toLocaleString()} BDT</span>
              </div>
              <input 
                type="number" 
                className="input input-sm input-bordered w-full rounded-xl text-xs" 
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold">Style</span></label>
                <select 
                  className="select select-sm select-bordered w-full rounded-xl text-xs"
                  value={travelType}
                  onChange={(e) => setTravelType(e.target.value)}
                >
                  <option value="Friends">Friends</option>
                  <option value="Solo">Solo</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family</option>
                  <option value="Group">Group</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold">Season</span></label>
                <select 
                  className="select select-sm select-bordered w-full rounded-xl text-xs"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                >
                  <option value="Monsoon">Monsoon</option>
                  <option value="Winter">Winter</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text text-xs font-bold">Expedition Description & Travel Notes</span></label>
              <textarea 
                rows="2"
                placeholder="Share your goals, safety gear requirements, or route highlights..." 
                className="textarea textarea-bordered w-full rounded-xl text-xs" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

          </div>

          {/* Section 2: Invited Travel Companions with Tour Group Import & Follower Search */}
          <div className="border border-base-300 p-4 md:p-6 rounded-3xl bg-base-200/40 space-y-4">
            
            {/* Companion Section Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-base-300 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Invited Travel Companions
                </span>
                <span className="text-[11px] text-base-content/60">
                  🔒 Only connected travelers (followers & users you follow) or your existing tour group members can be invited.
                </span>
              </div>
              <span className="badge badge-primary font-bold text-xs py-2 px-3 self-start sm:self-auto">
                {selectedCompanions.length} Selected
              </span>
            </div>

            {/* Quick-Invite All from Existing Tour Group Feature */}
            <div className="p-3.5 bg-base-100 rounded-2xl border border-base-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Invite from My Existing Tour Group:
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select 
                  className="select select-sm select-bordered rounded-xl text-xs flex-1"
                  value={selectedTourGroupId}
                  onChange={(e) => setSelectedTourGroupId(e.target.value)}
                >
                  <option value="">Select a tour group you are part of...</option>
                  {userTourGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title || g.name} ({g.members?.length || 0} members)
                    </option>
                  ))}
                </select>

                <button 
                  type="button" 
                  onClick={handleInviteAllFromGroup}
                  disabled={!selectedTourGroupId}
                  className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl text-xs gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Invite All Group Members
                </button>
              </div>

              {groupInviteFeedback && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4" /> {groupInviteFeedback}
                </div>
              )}
            </div>

            {/* Search Input for Connected Followers & Following */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search connected followers & following by name, @username, or role..." 
                className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs bg-base-100" 
                value={companionSearchQuery}
                onChange={(e) => setCompanionSearchQuery(e.target.value)}
              />
              {companionSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => setCompanionSearchQuery("")}
                  className="btn btn-xs btn-ghost btn-circle absolute right-2 top-1.5 text-base-content/50"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Currently Selected Companions Chips */}
            {selectedCompanions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-base-content/50 block">Invited Roster:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCompanions.map(c => (
                    <div 
                      key={c.id || c.username} 
                      className="flex items-center gap-2 bg-primary text-primary-content px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
                    >
                      <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-full object-cover border border-white/40" />
                      <span>{c.name}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleCompanion(c)}
                        className="hover:text-red-200 transition-colors p-0.5"
                        title="Remove Companion"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Followers / Following Selectable Cards */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase text-base-content/50 block">
                Available Followers & Following ({filteredCompanions.length} eligible):
              </span>

              {filteredCompanions.length === 0 ? (
                <div className="p-4 bg-base-100 rounded-2xl border border-base-300 text-center text-xs text-base-content/50">
                  <UserX className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  No connected followers matching "{companionSearchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredCompanions.map(c => {
                    const isSelected = selectedCompanions.some(item => item.id === c.id || item.username === c.username);
                    
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCompanion(c)}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-sm' 
                            : 'bg-base-100 border-base-300 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-base-300" />
                            {isSelected && (
                              <span className="w-3.5 h-3.5 bg-primary text-primary-content rounded-full flex items-center justify-center absolute -top-1 -right-1 text-[9px]">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate text-base-content m-0 leading-tight">{c.name}</p>
                            <p className="text-[10px] text-base-content/50 truncate m-0">@{c.username}</p>
                          </div>
                        </div>

                        {/* Connection status badge */}
                        <div className="flex flex-col items-end shrink-0 pl-1">
                          <span className={`badge badge-xs text-[9px] font-bold ${
                            c.connectionType === "Mutual Connection" 
                              ? "badge-success text-white" 
                              : c.connectionType === "Following" 
                              ? "badge-info text-white" 
                              : "badge-neutral"
                          }`}>
                            {c.connectionType || (c.isFollower && c.isFollowing ? "Mutual" : c.isFollower ? "Follower" : "Following")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Section 3: Multi-Stop Itinerary Builder & Stop Pictures */}
          <div className="border border-base-300 p-4 md:p-5 rounded-2xl bg-base-200/40 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-base-300 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Map className="w-4 h-4" /> Multi-Destination Stops, Accommodations & Photos
                </span>
                <span className="text-[11px] text-base-content/60">Configure transport mode, stays (Hotels, Eco-resorts, Houseboats, Camping), costs, and attach stop pictures.</span>
              </div>

              {/* Add Stop Quick Selector */}
              <div className="flex items-center gap-2">
                <select 
                  className="select select-xs select-bordered rounded-lg text-xs max-w-[170px]"
                  value={selectedDatabasePlaceId}
                  onChange={(e) => setSelectedDatabasePlaceId(e.target.value)}
                >
                  <option value="">Database Place...</option>
                  {placesDatabase.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={handleAddStop}
                  className="btn btn-xs btn-primary text-primary-content font-bold rounded-lg gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stop
                </button>
              </div>
            </div>

            {/* Stops List */}
            <div className="space-y-4">
              {stops.map((stop, idx) => (
                <div key={stop.id || idx} className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-sm space-y-3 relative group">
                  
                  {/* Stop Header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        stop.isSpontaneous ? 'bg-amber-500 text-white' : 'bg-primary/20 text-primary'
                      }`}>
                        {stop.isSpontaneous ? '🌟' : idx + 1}
                      </span>
                      <span className="font-black text-sm text-base-content">
                        Stop #{idx + 1}: {stop.placeName || 'Unnamed Stop'}
                      </span>
                      {stop.isSpontaneous && (
                        <span className="badge badge-warning badge-xs font-bold">Spontaneous Gem</span>
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveStop(idx)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg p-1"
                      title="Delete Stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stop Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    
                    {/* Place Name */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Stop / Destination Name</label>
                      <input 
                        type="text" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.placeName}
                        onChange={(e) => handleUpdateStop(idx, "placeName", e.target.value)}
                        placeholder="e.g. Sreemangal Lawachara"
                        required
                      />
                    </div>

                    {/* Location Details */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">District / Region</label>
                      <input 
                        type="text" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.location || ''}
                        onChange={(e) => handleUpdateStop(idx, "location", e.target.value)}
                        placeholder="e.g. Moulvibazar, Sylhet"
                      />
                    </div>

                    {/* Transport Mode */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Transport Mode</label>
                      <select 
                        className="select select-xs select-bordered w-full rounded-lg"
                        value={stop.transportMode}
                        onChange={(e) => handleUpdateStop(idx, "transportMode", e.target.value)}
                      >
                        {TRANSPORT_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Transport Cost */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Transport Cost (BDT)</label>
                      <input 
                        type="number" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.transportCost || 0}
                        onChange={(e) => handleUpdateStop(idx, "transportCost", Number(e.target.value))}
                      />
                    </div>

                    {/* Accommodation Type */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Accommodation Type</label>
                      <select 
                        className="select select-xs select-bordered w-full rounded-lg"
                        value={stop.accommodationType}
                        onChange={(e) => handleUpdateStop(idx, "accommodationType", e.target.value)}
                      >
                        {ACCOMMODATION_OPTIONS.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Accommodation Details */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Stay Name / Details</label>
                      <input 
                        type="text" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.accommodationDetails || ''}
                        onChange={(e) => handleUpdateStop(idx, "accommodationDetails", e.target.value)}
                        placeholder="e.g. Eco Villa or Wooden Houseboat"
                      />
                    </div>

                    {/* Accommodation Cost */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Stay Cost (BDT)</label>
                      <input 
                        type="number" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.accommodationCost || 0}
                        onChange={(e) => handleUpdateStop(idx, "accommodationCost", Number(e.target.value))}
                      />
                    </div>

                    {/* Stay Duration */}
                    <div className="form-control">
                      <label className="text-[10px] font-bold text-base-content/60 mb-0.5">Duration</label>
                      <input 
                        type="text" 
                        className="input input-xs input-bordered w-full rounded-lg" 
                        value={stop.stayDuration || '1 Day'}
                        onChange={(e) => handleUpdateStop(idx, "stayDuration", e.target.value)}
                        placeholder="e.g. 1 Night or Half Day"
                      />
                    </div>

                  </div>

                  {/* Stop Notes */}
                  <div className="form-control">
                    <input 
                      type="text" 
                      className="input input-xs input-bordered w-full rounded-lg text-xs" 
                      value={stop.notes || ''}
                      onChange={(e) => handleUpdateStop(idx, "notes", e.target.value)}
                      placeholder="Activities or key spots to visit at this stop..."
                    />
                  </div>

                  {/* Stop Photos Management Section */}
                  <div className="pt-2 border-t border-base-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-base-content/70 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-primary" /> Stop Photos ({stop.photos?.length || 0}):
                      </span>

                      <div className="flex items-center gap-1.5">
                        <label className="btn btn-xs btn-ghost border border-base-300 rounded-lg text-[10px] cursor-pointer">
                          <Upload className="w-2.5 h-2.5" /> Upload Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleStopPhotoUpload(idx, e)} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => handleAddStopPhotoUrl(idx)}
                          className="btn btn-xs btn-ghost border border-base-300 rounded-lg text-[10px]"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>

                    {/* Photo Thumbnails */}
                    {stop.photos && stop.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {stop.photos.map((photoUrl, pIdx) => (
                          <div key={pIdx} className="relative w-16 h-14 rounded-xl overflow-hidden border border-base-300 group shrink-0">
                            <img src={photoUrl} alt="Stop Photo" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveStopPhoto(idx, pIdx)}
                              className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-error text-white rounded-full p-0.5"
                              title="Delete Photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Calculated summary footer */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-3 border-t border-base-300 text-xs">
              <span className="text-base-content/70 font-semibold">
                Itemized Sum of Stops: <b className="text-primary">{Number(calculatedEstimatedCosts).toLocaleString()} BDT</b>
              </span>
              <span className="text-[11px] text-base-content/50">
                Target Budget: <b className="text-base-content">{Number(targetBudget).toLocaleString()} BDT</b>
              </span>
            </div>

          </div>

          {/* Modal Action Buttons */}
          <div className="modal-action border-t border-base-300 pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-sm btn-ghost rounded-xl text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-sm btn-primary text-primary-content font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> {isEditMode ? "Save Tour Modifications" : "Assemble & Publish Tour Plan"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
