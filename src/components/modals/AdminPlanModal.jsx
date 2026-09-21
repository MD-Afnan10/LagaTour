import React, { useState, useEffect } from "react";
import { X, Map, Calendar, DollarSign, Tag, Check, Sparkles } from "lucide-react";

export default function AdminPlanModal({
  isOpen,
  onClose,
  plan,
  onSave
}) {
  const isEditing = Boolean(plan && plan.id);

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startingLocation, setStartingLocation] = useState("Dhaka");
  const [targetBudget, setTargetBudget] = useState(25000);
  const [spentBudget, setSpentBudget] = useState(12000);
  const [status, setStatus] = useState("planned");
  const [travelType, setTravelType] = useState("Friends");
  const [season, setSeason] = useState("Winter");
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || "");
      setDestination(plan.destination || plan.destinationName || "");
      setStartingLocation(plan.startingLocation || "Dhaka");
      setTargetBudget(plan.targetBudget || plan.totalBudget || 25000);
      setSpentBudget(plan.spentBudget || Math.round((plan.targetBudget || 25000) * 0.5));
      setStatus(plan.status || "planned");
      setTravelType(plan.travelType || "Friends");
      setSeason(plan.season || "Winter");
      setCoverImage(plan.coverImage || (plan.photos && plan.photos[0]) || "");
      setDescription(plan.description || plan.travelTips || "");
    } else {
      setTitle("");
      setDestination("");
      setStartingLocation("Dhaka");
      setTargetBudget(20000);
      setSpentBudget(0);
      setStatus("planned");
      setTravelType("Friends");
      setSeason("Winter");
      setCoverImage("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800");
      setDescription("");
    }
    setErrorMsg("");
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide tour plan title.");
      return;
    }
    if (!destination.trim()) {
      setErrorMsg("Please specify destination.");
      return;
    }

    const payload = {
      title: title.trim(),
      destination: destination.trim(),
      destinationName: destination.trim(),
      startingLocation: startingLocation.trim() || "Dhaka",
      targetBudget: parseInt(targetBudget || 0, 10),
      totalBudget: parseInt(targetBudget || 0, 10),
      spentBudget: parseInt(spentBudget || 0, 10),
      status,
      travelType,
      season,
      coverImage: coverImage.trim() || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      description: description.trim(),
      travelTips: description.trim(),
      author: plan?.author || {
        id: "admin_root",
        name: "LagaTour Official Guides",
        username: "lagatour_admin",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=admin",
        league: "Legend"
      },
      stops: plan?.stops || [
        {
          id: "stop_1",
          order: 1,
          placeName: `${destination.trim()} Basecamp`,
          location: destination.trim(),
          transportMode: "Bus / AC Coach",
          transportCost: 1500,
          accommodationType: "Eco Resort",
          notes: "Official recommended traveler itinerary"
        }
      ]
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-base-content leading-tight">
                {isEditing ? `Edit Plan: ${plan.title}` : "Create Curated Tour Plan / Expedition"}
              </h3>
              <p className="text-xs text-base-content/70 mt-0.5">
                {isEditing ? "Update tour budget, destination, season, or status." : "Add a certified travel plan to the community directory."}
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
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Plan Title *</label>
            <input
              type="text"
              placeholder="e.g. Sajek Valley Cloud Trek & Remote Waterfall Expedition"
              className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Destination *</label>
              <input
                type="text"
                placeholder="e.g. Sajek Valley / Bandarban"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Starting Hub</label>
              <input
                type="text"
                placeholder="Dhaka"
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={startingLocation}
                onChange={(e) => setStartingLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Estimated Budget (৳)</label>
              <input
                type="number"
                min="500"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                value={targetBudget}
                onChange={(e) => setTargetBudget(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Travel Type</label>
              <select
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={travelType}
                onChange={(e) => setTravelType(e.target.value)}
              >
                <option value="Solo">Solo</option>
                <option value="Friends">Friends</option>
                <option value="Family">Family</option>
                <option value="Couple">Couple</option>
                <option value="Group">Group</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Ideal Season</label>
              <select
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="Winter">Winter</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Summer">Summer</option>
                <option value="Autumn">Autumn</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Plan Status</label>
              <select
                className="select select-sm select-bordered w-full rounded-xl text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="planned">Planned (Upcoming)</option>
                <option value="ongoing">Ongoing (Active)</option>
                <option value="completed">Completed (Archived)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Cover Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="input input-sm input-bordered w-full rounded-xl text-xs"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-base-content/75 uppercase block mb-1">Plan Overview & Practical Guidance</label>
            <textarea
              rows={3}
              placeholder="Describe key highlights, recommended lodging, and budget tips..."
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
              className="btn btn-warning btn-sm flex-1 rounded-xl text-xs font-bold text-slate-950 shadow-md gap-1"
            >
              <Check className="w-4 h-4" /> {isEditing ? "Save Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
