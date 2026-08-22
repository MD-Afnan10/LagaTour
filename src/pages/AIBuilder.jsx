import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MOCK_DESTINATIONS, MOCK_TOUR_PLANS } from "../data/mockData";
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
  FileCheck
} from "lucide-react";
import confetti from "canvas-confetti";

export default function AIBuilder() {
  const { currentUser, addPoints } = useAuth();

  // Inputs
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0].name);
  const [budget, setBudget] = useState(15000);
  const [duration, setDuration] = useState(3);
  const [style, setStyle] = useState("Adventure"); // Adventure, Budget, Luxury, Nature

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  // Simulate AI Package Gen
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    // Step 1: Initialize
    setStep(1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 2: Fetch and analyze local resources
    setStep(2);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 3: Compile optimal budget and itinerary
    setStep(3);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Compile beautiful mockup responses based on inputs
    const transportCost = Math.round(budget * 0.25);
    const accomCost = Math.round(budget * 0.40);
    const foodCost = Math.round(budget * 0.20);
    const miscCost = Math.round(budget * 0.15);

    const generatedItinerary = [];
    for(let i = 1; i <= duration; i++) {
      let planText = `Explore local spots and popular eateries. Enjoy sunset at the scenic helipads.`;
      if (i === 1) {
        planText = `Reach ${destination} via primary transport. Check in at the hotel. Rest and watch sunset, followed by a local dinner.`;
      } else if (i === duration) {
        planText = `Morning souvenir shopping at traditional local markets. Check out from the resort and return home with memories.`;
      } else {
        if (style === "Adventure") {
          planText = `Trekking to remote viewpoints, cycling tour around scenic trails, and barbecue dinner with team.`;
        } else if (style === "Luxury") {
          planText = `Spa relaxation, infinity pool swimming, followed by fine dining seafood dinner under the stars.`;
        } else {
          planText = `Sightseeing in eco-cabs, visiting state sanctuaries, forest walks, and traditional food sampling.`;
        }
      }
      generatedItinerary.push({ day: `Day ${i}`, plan: planText });
    }

    setResult({
      title: `Gemini AI: Optimized ${duration} Days ${style} Tour to ${destination}`,
      destinationName: destination,
      duration: duration,
      travelType: style === "Budget" ? "Friends" : "Couple",
      totalBudget: budget,
      transportation: style === "Luxury" ? "AC Sedan" : "Non-AC Bus",
      accommodation: style === "Luxury" ? "Ocean View Suite Resort" : "Budget Eco Cottage",
      placesVisited: [`Main ${destination} Spot`, "Geographic Viewpoint", "Sufi Market"],
      expenseBreakdown: [
        { category: "Transport", amount: transportCost },
        { category: "Accommodation", amount: accomCost },
        { category: "Food", amount: foodCost },
        { category: "Activities", amount: miscCost }
      ],
      itinerary: generatedItinerary,
      tips: `AI Travel Recommendation: Keep hydration high, carry cash for remote guides, and prioritize morning travels to skip traffic.`
    });

    setIsLoading(false);
    setStep(0);
    addPoints(40); // award points for utilizing AI tools!
  };

  const handleImportPlan = () => {
    if (!result) return;

    const newImportedPlan = {
      id: "plan_imported_" + Date.now(),
      title: result.title,
      destinationId: MOCK_DESTINATIONS.find(d => d.name === result.destinationName)?.id || "dest_1",
      destinationName: result.destinationName,
      startingLocation: "Dhaka",
      transportation: result.transportation,
      accommodation: result.accommodation,
      placesVisited: result.placesVisited,
      duration: result.duration,
      totalBudget: result.totalBudget,
      expenseBreakdown: result.expenseBreakdown,
      travelTips: result.tips,
      photos: ["https://images.unsplash.com/photo-1597843798940-02c349a5b3a4?w=500"],
      rating: 5.0,
      ratingsCount: 1,
      budgetAccuracy: 5.0,
      experienceRating: 5.0,
      author: currentUser,
      travelType: result.travelType,
      season: "Winter",
      likes: 0,
      comments: []
    };

    MOCK_TOUR_PLANS.unshift(newImportedPlan); // add to active global plan array
    
    addPoints(60);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    alert("🎉 Tour Plan imported and saved to directory successfully! Earned +60 Traveler Points.");
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-4xl space-y-6">
      
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-warning fill-warning" /> AI Package Builder
        </h1>
        <p className="text-sm text-base-content/60">Generate highly optimized day-by-day itineraries and budget splits compiled by Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side Inputs Form */}
        <div className="card bg-base-100 border border-base-200 p-5 h-fit shadow-sm space-y-4">
          <h3 className="font-bold text-sm border-b border-base-200 pb-2 m-0 flex items-center gap-1.5">
            <Compass className="w-4.5 h-4.5 text-primary" /> Specifications
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-xs font-semibold">Where to?</span></label>
              <select 
                className="select select-sm select-bordered w-full rounded-lg text-xs"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {MOCK_DESTINATIONS.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-xs font-semibold">Max Budget Limit</span></label>
              <input 
                type="number" 
                className="input input-sm input-bordered w-full rounded-lg text-xs" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-xs font-semibold">Duration (Days)</span></label>
              <input 
                type="number" 
                className="input input-sm input-bordered w-full rounded-lg text-xs" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-xs font-semibold">Preferred Vibe / Style</span></label>
              <select 
                className="select select-sm select-bordered w-full rounded-lg text-xs"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Adventure">Adventure Seeking</option>
                <option value="Budget">Backpacker/Budget</option>
                <option value="Luxury">Luxury Resort</option>
                <option value="Nature">Nature / Hiking</option>
              </select>
            </div>

            <button type="submit" className="btn btn-sm btn-primary text-slate-900 font-bold w-full rounded-lg text-xs" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Generate Custom Package"}
            </button>

          </form>
        </div>

        {/* Right Side Results Display */}
        <div className="md:col-span-2 space-y-4">
          
          {isLoading && (
            <div className="card bg-base-100 border border-base-200 p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div>
                <h4 className="font-bold text-md text-primary">Gemini Engine Compiling</h4>
                <p className="text-xs text-base-content/60 mt-1">
                  {step === 1 && "Connecting to tourist resource files..."}
                  {step === 2 && "Analyzing hotel rooms & seasonal transport tariffs..."}
                  {step === 3 && `Structuring optimal ${duration} days package for ${destination}...`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-base-300 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500" 
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="card bg-base-100 border border-base-200 p-8 shadow-sm text-center py-20">
              <Sparkles className="w-12 h-12 text-warning/40 mx-auto mb-2" />
              <p className="font-bold text-sm text-base-content/75">AI Tour Package Builder</p>
              <p className="text-xs text-base-content/50 mt-1">
                Input your specifications on the side panel and let Gemini analyze lodging databases to build your plan.
              </p>
            </div>
          )}

          {!isLoading && result && (
            <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-6">
              
              {/* Output Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-base-200">
                <div className="leading-tight">
                  <span className="text-[9px] bg-primary/20 text-primary font-black py-0.5 px-2 rounded-md uppercase">
                    AI Package Generated
                  </span>
                  <h2 className="text-lg font-black mt-2 mb-1">{result.title}</h2>
                  <p className="text-xs text-base-content/50 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {result.destinationName} &nbsp;•&nbsp; 
                    <Clock className="w-3.5 h-3.5" /> {result.duration} Days &nbsp;•&nbsp; 
                    <Layers className="w-3.5 h-3.5" /> {style} style
                  </p>
                </div>
                <button 
                  onClick={handleImportPlan}
                  className="btn btn-sm btn-primary text-slate-900 font-bold rounded-lg text-xs gap-1.5 capitalize"
                >
                  <FileCheck className="w-4 h-4" /> Import to My Plans
                </button>
              </div>

              {/* Expense Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-base-content/65 uppercase tracking-wider block">Cost Splits Recommendation</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {result.expenseBreakdown.map((exp, idx) => (
                    <div key={idx} className="bg-base-200 border border-base-300 p-2.5 rounded-xl flex flex-col text-center">
                      <span className="text-[10px] text-base-content/60 font-semibold">{exp.category}</span>
                      <span className="text-xs font-black text-primary mt-1">{exp.amount} BDT</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day-by-Day Itinerary */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-base-content/65 uppercase tracking-wider block">Itinerary Day Cards</span>
                <div className="space-y-3">
                  {result.itinerary.map((dayPlan, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="badge badge-primary py-2 px-3 text-[10px] font-black">{dayPlan.day}</div>
                      <div className="flex-1 bg-base-200 border border-base-300 p-3 rounded-xl text-xs">
                        <p className="leading-relaxed text-base-content/85">{dayPlan.plan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI travel tip */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-xl flex gap-2 items-start text-xs leading-relaxed">
                <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="italic">
                  <strong>Gemini Tip:</strong> "{result.tips}"
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
