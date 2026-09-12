import React from "react";
import ExpeditionMap from "./ExpeditionMap";
import { 
  X, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  Radio, 
  Trophy, 
  Edit3, 
  Play, 
  Send, 
  Users, 
  Car, 
  Home as HomeIcon, 
  Sparkles, 
  CheckCircle, 
  Star, 
  Layers, 
  Navigation,
  Compass,
  RotateCcw
} from "lucide-react";

export default function ExpeditionDetailModal({
  isOpen,
  onClose,
  expedition,
  onEdit = null,
  onStart = null,
  onRestart = null,
  onTrack = null,
  onPublish = null
}) {
  if (!isOpen || !expedition) return null;

  const isOngoing = expedition.status === "ongoing";
  const isCompleted = expedition.status === "completed";
  const isPlanned = expedition.status === "planned";

  const stops = expedition.stops || [];
  const checkedStops = stops.filter(s => s.status === "checked_in");
  const spontaneousStops = stops.filter(s => s.isSpontaneous);
  const expenses = expedition.expenses || [];
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const budgetPercentage = Math.min(100, Math.round((totalSpent / (expedition.targetBudget || 1)) * 100));

  return (
    <div className="modal modal-open z-[999]">
      <div className="modal-box max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 md:p-8 border border-base-300 bg-base-100 shadow-2xl space-y-6">
        
        {/* Modal Top Nav */}
        <div className="flex justify-between items-center border-b border-base-300 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isOngoing ? (
                  <span className="badge badge-error text-white font-black text-xs gap-1 animate-pulse">
                    <Radio className="w-3 h-3" /> LIVE ONGOING
                  </span>
                ) : isCompleted ? (
                  <span className="badge badge-success text-white font-black text-xs gap-1">
                    <Trophy className="w-3 h-3" /> COMPLETED
                  </span>
                ) : (
                  <span className="badge badge-neutral font-bold text-xs gap-1">
                    <Calendar className="w-3 h-3" /> PLANNED
                  </span>
                )}
                <span className="badge badge-outline text-xs font-semibold">
                  {expedition.travelType} • {expedition.season} Season
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black m-0 tracking-tight text-base-content mt-1">
                {expedition.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cover Photo & Route Overview */}
        <div className="relative rounded-3xl overflow-hidden h-52 bg-base-300 border border-base-300 shadow-inner">
          <img 
            src={expedition.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
            alt={expedition.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <span>{expedition.startingLocation}</span>
                <ArrowRight className="w-3.5 h-3.5 inline" />
                <span>{expedition.destination}</span>
              </p>
              <p className="text-xs text-white/80 max-w-xl italic line-clamp-2 m-0">
                "{expedition.description}"
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
              <img src={expedition.author?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} alt="Author" className="w-7 h-7 rounded-full object-cover" />
              <div className="text-left text-xs leading-tight">
                <span className="font-bold text-white block">{expedition.author?.name || 'Author'}</span>
                <span className="text-[10px] text-amber-400 font-bold">{expedition.author?.league || 'Explorer'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Gamification Scorecard if completed */}
        {isCompleted && expedition.aiScore && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-primary/10 to-purple-600/15 border border-amber-500/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Gamification Scorecard & Rewards
              </span>
              <span className="badge badge-warning font-black text-xs px-3 py-1 text-slate-900 shadow">
                +{expedition.aiScore.totalPoints} Score Points
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-base-100/90 p-2.5 rounded-2xl border border-base-300">
                <span className="text-[10px] text-base-content/60 block">Budget Score</span>
                <span className="font-black text-emerald-500 text-sm">{expedition.aiScore.budgetDisciplineScore}%</span>
              </div>
              <div className="bg-base-100/90 p-2.5 rounded-2xl border border-base-300">
                <span className="text-[10px] text-base-content/60 block">Route Completed</span>
                <span className="font-black text-indigo-500 text-sm">{expedition.aiScore.explorationBonus}%</span>
              </div>
              <div className="bg-base-100/90 p-2.5 rounded-2xl border border-base-300">
                <span className="text-[10px] text-base-content/60 block">Spontaneous Detours</span>
                <span className="font-black text-amber-500 text-sm">{spontaneousStops.length} Found</span>
              </div>
              <div className="bg-base-100/90 p-2.5 rounded-2xl border border-base-300">
                <span className="text-[10px] text-base-content/60 block">Pace Efficiency</span>
                <span className="font-black text-purple-500 text-sm">{expedition.aiScore.paceEfficiency}%</span>
              </div>
            </div>

            {expedition.aiScore.badges && expedition.aiScore.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {expedition.aiScore.badges.map((b, i) => (
                  <span key={i} className="badge bg-base-100 border border-amber-400 text-amber-500 font-bold text-xs py-1.5 px-2.5 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-400" /> {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Budget Progress & Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-base-200/60 p-4 rounded-3xl border border-base-300">
            <span className="text-[10px] font-bold text-base-content/60 uppercase block">Target Budget</span>
            <span className="font-black text-base text-base-content">{Number(expedition.targetBudget).toLocaleString()} BDT</span>
          </div>

          <div className="bg-base-200/60 p-4 rounded-3xl border border-base-300">
            <span className="text-[10px] font-bold text-base-content/60 uppercase block">Total Spent</span>
            <span className={`font-black text-base ${totalSpent <= expedition.targetBudget ? 'text-emerald-500' : 'text-error'}`}>
              {Number(totalSpent).toLocaleString()} BDT
            </span>
          </div>

          <div className="bg-base-200/60 p-4 rounded-3xl border border-base-300">
            <span className="text-[10px] font-bold text-base-content/60 uppercase block">Stops Reached</span>
            <span className="font-black text-base text-primary">
              {checkedStops.length} / {stops.length} Stops
            </span>
          </div>
        </div>

        {/* Interactive Leaflet Route Map */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-primary" /> Expedition Map & Route
          </span>
          <ExpeditionMap 
            stops={stops} 
            currentGps={expedition.currentGps}
            height="320px"
          />
        </div>

        {/* Complete Itinerary List of Stops */}
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> Itinerary Stops & Accommodations ({stops.length})
          </span>

          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div 
                key={stop.id || idx} 
                className={`p-4 rounded-2xl border bg-base-100 ${
                  stop.isSpontaneous 
                    ? 'border-amber-500/40 bg-amber-500/5' 
                    : stop.status === 'checked_in' 
                    ? 'border-emerald-500/30' 
                    : 'border-base-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      stop.isSpontaneous 
                        ? 'bg-amber-500 text-white' 
                        : stop.status === 'checked_in' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-base-200 text-base-content/70'
                    }`}>
                      {stop.isSpontaneous ? '🌟' : stop.status === 'checked_in' ? '✓' : idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-base-content m-0">{stop.placeName}</h4>
                      <span className="text-[10px] text-base-content/50">{stop.location}</span>
                    </div>
                  </div>

                  {stop.isSpontaneous ? (
                    <span className="badge badge-warning badge-sm font-bold text-xs">🌟 Spontaneous Discovery</span>
                  ) : stop.status === 'checked_in' ? (
                    <span className="badge badge-success badge-sm text-white font-bold text-xs">Checked In</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm text-xs">Pending</span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2.5 text-xs bg-base-200/50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Transport:</span>
                    <span className="font-semibold">{stop.transportMode} ({stop.transportCost || 0} BDT)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Stay Type:</span>
                    <span className="font-semibold">{stop.accommodationType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Stay Details:</span>
                    <span className="font-semibold truncate block">{stop.accommodationDetails || 'Standard'} ({stop.accommodationCost || 0} BDT)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 block">Duration:</span>
                    <span className="font-semibold">{stop.stayDuration || '1 Day'}</span>
                  </div>
                </div>

                {/* Stop Photos if any */}
                {stop.photos && stop.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {stop.photos.map((ph, pIdx) => (
                      <img key={pIdx} src={ph} alt={`Stop photo ${pIdx + 1}`} className="w-24 h-20 object-cover rounded-xl border border-base-300" />
                    ))}
                  </div>
                )}

                {stop.checkInNote && (
                  <p className="text-xs italic text-base-content/85 bg-base-200/40 p-2 rounded-lg border border-base-200 m-0 mt-2">
                    "{stop.checkInNote}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Itemized Expenses List */}
        {expenses.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" /> Itemized Expenses ({expenses.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {expenses.map((exp, i) => (
                <div key={exp.id || i} className="flex justify-between items-center p-2.5 bg-base-200/40 rounded-xl border border-base-300 text-xs">
                  <div>
                    <span className="badge badge-xs badge-neutral font-bold mr-1.5">{exp.category}</span>
                    <span className="font-semibold text-base-content">{exp.note}</span>
                  </div>
                  <span className="font-black text-primary">{Number(exp.amount).toLocaleString()} BDT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invited Companions */}
        {expedition.companions && expedition.companions.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Travel Companions ({expedition.companions.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {expedition.companions.map((c, i) => (
                <div key={c.id || i} className="flex items-center gap-2 p-1.5 pr-3 bg-base-200/60 rounded-full border border-base-300 text-xs font-bold">
                  <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
                  <span>{c.name}</span>
                  <span className="badge badge-xs badge-neutral">{c.role || 'Companion'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-action border-t border-base-300 pt-4 flex flex-wrap justify-between items-center gap-2">
          <button onClick={onClose} className="btn btn-sm btn-ghost rounded-xl text-xs">
            Close
          </button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button 
                onClick={() => {
                  onClose();
                  onEdit(expedition);
                }}
                className="btn btn-sm btn-ghost border border-base-300 rounded-xl text-xs font-bold gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Modify Tour Plan
              </button>
            )}

            {isOngoing && onTrack && (
              <button 
                onClick={() => {
                  onClose();
                  onTrack(expedition);
                }}
                className="btn btn-sm btn-primary text-primary-content font-black rounded-xl text-xs gap-1.5 shadow"
              >
                <Radio className="w-3.5 h-3.5" /> Resume Live Cockpit
              </button>
            )}

            {isPlanned && onStart && (
              <button 
                onClick={() => {
                  onClose();
                  onStart(expedition.id);
                }}
                className="btn btn-sm btn-primary text-primary-content font-black rounded-xl text-xs gap-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Tour
              </button>
            )}

            {isCompleted && onRestart && (
              <button 
                onClick={() => {
                  onClose();
                  onRestart(expedition.id);
                }}
                className="btn btn-sm btn-primary text-primary-content font-black rounded-xl text-xs gap-1.5 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restart Tour
              </button>
            )}

            {onPublish && !expedition.isPublished && (
              <button 
                onClick={() => {
                  onPublish(expedition.id);
                  onClose();
                }}
                className="btn btn-sm btn-warning text-slate-900 font-bold rounded-xl text-xs gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Publish to Feed
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
