import React from "react";
import { Link } from "react-router-dom";
import { 
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
  Share2,
  Trash2
} from "lucide-react";

export default function ExpeditionCard({
  expedition,
  onStart,
  onTrack,
  onEdit,
  onViewDetail,
  onViewSummary,
  onDelete,
  onPublish
}) {
  const isOngoing = expedition.status === "ongoing";
  const isCompleted = expedition.status === "completed";
  const isPlanned = expedition.status === "planned";

  const stops = expedition.stops || [];
  const checkedStops = stops.filter(s => s.status === "checked_in");
  const spontaneousStops = stops.filter(s => s.isSpontaneous);
  const expenses = expedition.expenses || [];
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const budgetPercentage = Math.min(100, Math.round((totalSpent / (expedition.targetBudget || 1)) * 100));

  const uniqueAccommodations = stops
    .map(s => s.accommodationType)
    .filter((v, i, a) => v && v !== "None" && v !== "None (Day Visit)" && a.indexOf(v) === i);

  const uniqueTransports = stops
    .map(s => s.transportMode)
    .filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div className={`card bg-base-100 border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md rounded-3xl ${
      isOngoing 
        ? 'border-primary shadow-primary/10 ring-1 ring-primary/20' 
        : isCompleted 
        ? 'border-purple-500/30' 
        : 'border-base-300'
    }`}>
      
      {/* Cover Image & Status Header */}
      <div className="relative h-44 w-full overflow-hidden bg-base-300">
        <img 
          src={expedition.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"} 
          alt={expedition.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2">
          {isOngoing ? (
            <span className="badge badge-error text-white font-black text-xs gap-1.5 py-2 px-3 shadow-md animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE ONGOING
            </span>
          ) : isCompleted ? (
            <span className="badge badge-success text-white font-black text-xs gap-1 py-2 px-3 shadow-md">
              <Trophy className="w-3.5 h-3.5" /> COMPLETED ({expedition.aiScore?.totalPoints || 300} pts)
            </span>
          ) : (
            <span className="badge badge-neutral font-bold text-xs gap-1 py-2 px-3 shadow-md">
              <Calendar className="w-3.5 h-3.5" /> PLANNED
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="badge badge-primary font-black text-xs text-primary-content py-2 px-3 shadow-md">
              {Number(expedition.targetBudget).toLocaleString()} BDT
            </span>
          </div>
        </div>

        {/* Bottom overlay text */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <span>{expedition.startingLocation}</span>
            <ArrowRight className="w-3 h-3 inline" />
            <span>{expedition.destination}</span>
            <span className="opacity-60">• {stops.length} Stops</span>
          </p>
          <h3 className="font-black text-base md:text-lg leading-tight truncate text-white m-0 drop-shadow">
            {expedition.title}
          </h3>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 md:p-5 space-y-4">
        
        {/* Description snippet */}
        <p className="text-xs text-base-content/75 line-clamp-2 leading-relaxed m-0">
          {expedition.description}
        </p>

        {/* Multi-Destination Circuit Strip */}
        <div className="bg-base-200/50 p-3 rounded-2xl border border-base-300 space-y-2">
          <span className="text-[10px] font-black uppercase text-base-content/50 block">Itinerary Route Stops:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {stops.map((s, idx) => (
              <React.Fragment key={s.id || idx}>
                <span className={`badge badge-sm text-[11px] py-2 px-2.5 whitespace-nowrap font-bold shrink-0 ${
                  s.isSpontaneous 
                    ? 'badge-warning text-slate-900 shadow-sm' 
                    : s.status === 'checked_in'
                    ? 'badge-success text-white'
                    : 'badge-ghost border-base-300'
                }`}>
                  {s.isSpontaneous ? '🌟 ' : ''}{s.placeName}
                </span>
                {idx < stops.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-base-content/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Accommodation & Transport Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {uniqueAccommodations.map((acc, idx) => (
            <span key={idx} className="badge badge-sm badge-neutral gap-1 text-[10px] py-1.5 px-2">
              <HomeIcon className="w-3 h-3 text-purple-400" /> {acc}
            </span>
          ))}
          {uniqueTransports.map((tr, idx) => (
            <span key={idx} className="badge badge-sm badge-outline gap-1 text-[10px] py-1.5 px-2">
              <Car className="w-3 h-3 text-primary" /> {tr}
            </span>
          ))}
          {spontaneousStops.length > 0 && (
            <span className="badge badge-sm badge-warning text-slate-900 font-bold gap-1 text-[10px] py-1.5 px-2">
              🌟 {spontaneousStops.length} Discoveries
            </span>
          )}
        </div>

        {/* Budget Meter Bar if ongoing or completed */}
        {(isOngoing || isCompleted) && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-base-content/70">
                Expense: <b className="text-base-content">{Number(totalSpent).toLocaleString()} BDT</b>
              </span>
              <span className="text-base-content/60">
                {budgetPercentage}% of {Number(expedition.targetBudget).toLocaleString()} BDT
              </span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden border border-base-300">
              <div 
                className={`h-full rounded-full transition-all ${
                  budgetPercentage > 95 ? 'bg-error' : budgetPercentage > 75 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Companions & Action Buttons */}
        <div className="pt-3 border-t border-base-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Companion Avatars */}
          <div className="flex items-center gap-1.5">
            <div className="avatar-group -space-x-3">
              {(expedition.companions || []).slice(0, 4).map((c, i) => (
                <div key={c.id || i} className="avatar border border-base-100">
                  <div className="w-7 h-7 rounded-full">
                    <img src={c.avatar} alt={c.name} title={c.name} />
                  </div>
                </div>
              ))}
            </div>
            <span className="text-[11px] text-base-content/50 font-semibold">
              {(expedition.companions || []).length} buddies
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
            
            {/* View Detail Button */}
            {onViewDetail && (
              <button 
                onClick={() => onViewDetail(expedition)}
                className="btn btn-xs btn-ghost border border-base-300 rounded-lg text-xs font-bold hover:border-primary/50"
                title="View Full Tour Details & Itinerary"
              >
                View Detail
              </button>
            )}

            {/* Edit Button (Author can always modify) */}
            {onEdit && (
              <button 
                onClick={() => onEdit(expedition)}
                className="btn btn-xs btn-ghost border border-base-300 rounded-lg text-xs font-bold"
                title="Modify Every Component of Tour"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}

            {/* Primary Action according to status */}
            {isOngoing && onTrack && (
              <button 
                onClick={() => onTrack(expedition)}
                className="btn btn-xs btn-primary text-primary-content font-black rounded-lg gap-1 shadow-md animate-pulse"
              >
                <Radio className="w-3 h-3" /> Live Tracking
              </button>
            )}

            {isPlanned && onStart && (
              <button 
                onClick={() => onStart(expedition.id)}
                className="btn btn-xs btn-primary text-primary-content font-black rounded-lg gap-1 shadow-md"
              >
                <Play className="w-3 h-3 fill-current" /> Start Tour
              </button>
            )}

            {isCompleted && onViewSummary && (
              <button 
                onClick={() => onViewSummary(expedition)}
                className="btn btn-xs btn-warning text-slate-900 font-black rounded-lg gap-1 shadow-md"
              >
                <Trophy className="w-3 h-3" /> AI Summary
              </button>
            )}

            {onPublish && !expedition.isPublished && (
              <button 
                onClick={() => onPublish(expedition.id)}
                className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-lg p-1"
                title="Publish Story to Social Feed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button 
                onClick={() => onDelete(expedition.id)}
                className="btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-lg p-1"
                title="Delete Tour"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
