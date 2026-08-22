import React, { useState } from "react";
import { MOCK_DESTINATIONS, MOCK_TOUR_PLANS } from "../data/mockData";
import MapComponent from "../components/MapComponent";
import { MapPin, Star, Eye, Calendar, Compass, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function MapExplorer() {
  const [destinations] = useState(MOCK_DESTINATIONS);
  const [selectedPin, setSelectedPin] = useState(null);
  
  // Track related tour plans based on clicked map pin or list item
  const [relatedPlans, setRelatedPlans] = useState([]);
  const [activeDestName, setActiveDestName] = useState("");

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    setActiveDestName(pin.name);
    
    // Find tour plans matching this destination ID
    const plans = MOCK_TOUR_PLANS.filter(p => p.destinationId === pin.id || p.destinationName.toLowerCase().includes(pin.name.toLowerCase()));
    setRelatedPlans(plans);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Sidebar - Destination List & Plans */}
      <div className="w-full lg:w-96 bg-base-100 border-r border-base-300 flex flex-col h-1/2 lg:h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-base-200 bg-base-200/50">
          <h2 className="text-lg font-black flex items-center gap-1.5 m-0">
            <Compass className="w-5 h-5 text-primary" />
            <span>Interactive Map</span>
          </h2>
          <p className="text-xs text-base-content/60 mt-0.5">Explore pins to unlock community-shared tour plans.</p>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Active destination details & plans */}
          {relatedPlans.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Related Tour Plans</span>
                <button 
                  onClick={() => {
                    setRelatedPlans([]);
                    setActiveDestName("");
                  }} 
                  className="text-xs hover:underline text-base-content/50"
                >
                  Clear filter
                </button>
              </div>
              <div className="alert alert-info py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Showing plans for: {activeDestName}</span>
              </div>
              
              <div className="space-y-2">
                {relatedPlans.map(plan => (
                  <div key={plan.id} className="card bg-base-200 border border-base-300 p-3 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs leading-snug flex-1">{plan.title}</h4>
                      <span className="badge badge-primary font-black text-[10px] py-2 px-2.5 rounded-lg shrink-0 whitespace-nowrap">
                        {Number(plan.totalBudget).toLocaleString()} BDT
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-base-content/60">
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {plan.rating}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {plan.duration} Days</span>
                    </div>
                    <p className="text-[10px] text-base-content/75 mt-1.5 italic">“{plan.travelTips.substring(0, 50)}...”</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-base-300">
                      <div className="flex items-center gap-1">
                        <img src={plan.author.avatar} alt="Author" className="w-4 h-4 rounded-full object-cover" />
                        <span className="text-[9px] font-bold text-base-content/60">@{plan.author.username}</span>
                      </div>
                      <Link to="/plans" className="btn btn-xs btn-ghost gap-0.5 text-primary font-bold p-0 min-h-0 h-auto">
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">Tourist Spots Directory</span>
              <div className="space-y-2">
                {destinations.map(dest => {
                  const isSelected = selectedPin?.id === dest.id;
                  const isUnsafe = dest.unsafeCount > 0;
                  return (
                    <div 
                      key={dest.id}
                      onClick={() => handlePinClick(dest)}
                      className={`flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-sm" 
                          : isUnsafe 
                            ? "border-error/50 bg-error/5 hover:bg-error/10" 
                            : "border-base-200 hover:bg-base-200"
                      }`}
                    >
                      <img src={dest.image} alt={dest.name} className="w-16 h-16 rounded-lg object-cover bg-base-300" />
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-bold text-xs text-base-content leading-snug m-0">{dest.name}</h3>
                            {isUnsafe && (
                              <span className="badge badge-error badge-xs text-[8px] font-bold text-white">⚠️ UNSAFE</span>
                            )}
                          </div>
                          <span className="text-[9px] uppercase font-bold text-primary/80 mt-0.5 inline-block">{dest.category}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[10px]">
                          <span className="text-yellow-600 font-bold flex items-center gap-0.5">★ {dest.rating}</span>
                          <span className="text-base-content/50">Visited {dest.visitedCount}+</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Map Explorer Area */}
      <div className="flex-1 h-1/2 lg:h-full relative">
        <MapComponent 
          pins={destinations} 
          selectedPin={selectedPin} 
          onPinClick={handlePinClick} 
        />
        
        {/* Floating guidance overlay */}
        <div className="absolute top-4 left-4 z-[400] bg-base-100/90 backdrop-blur border border-base-300 py-1.5 px-3 rounded-lg shadow-md hidden sm:block text-[10px] font-semibold text-base-content/85">
          📍 Click a map marker or explore list to show user-shared budgets & plans.
        </div>
      </div>

    </div>
  );
}
