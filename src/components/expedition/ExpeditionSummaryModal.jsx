import React, { useEffect } from "react";
import { useExpeditions } from "../../context/ExpeditionContext";
import { useAuth } from "../../context/AuthContext";
import confetti from "canvas-confetti";
import { 
  Trophy, 
  Award, 
  Sparkles, 
  DollarSign, 
  CheckCircle, 
  Star, 
  Send, 
  MapPin, 
  X, 
  Share2, 
  Compass, 
  Check, 
  Flame, 
  Layers
} from "lucide-react";

export default function ExpeditionSummaryModal({
  isOpen,
  onClose,
  expedition,
  aiScoreData,
  onPublished = null
}) {
  const { publishToSocialFeed } = useExpeditions();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    }
  }, [isOpen]);

  if (!isOpen || !expedition) return null;

  const score = aiScoreData || expedition.aiScore || {
    totalPoints: 350,
    budgetDisciplineScore: 92,
    explorationBonus: 88,
    paceEfficiency: 90,
    spontaneousBonus: 85,
    reviewSummary: "Exemplary expedition execution with sharp budget discipline and remarkable discoveries.",
    badges: ["Trailblazer", "Budget Maestro", "Haor Navigator"]
  };

  const stops = expedition.stops || [];
  const checkedStops = stops.filter(s => s.status === "checked_in");
  const spontaneousStops = stops.filter(s => s.isSpontaneous);
  const expenses = expedition.expenses || [];
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handlePublish = async () => {
    await publishToSocialFeed(expedition.id);
    if (onPublished) onPublished();
    onClose();
  };

  return (
    <div className="modal modal-open z-[999]">
      <div className="modal-box max-w-2xl rounded-3xl p-6 md:p-8 border border-base-300 bg-base-100 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header with Trophy */}
        <div className="text-center space-y-2 pb-4 border-b border-base-300 relative">
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute top-0 right-0">
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 rounded-3xl bg-warning/20 text-warning mx-auto flex items-center justify-center shadow-lg border border-warning/30 animate-bounce">
            <Trophy className="w-9 h-9" />
          </div>

          <h3 className="text-2xl font-black tracking-tight text-base-content m-0">
            Expedition Completed! 🏆
          </h3>
          <p className="text-xs text-base-content/60 max-w-md mx-auto">
            {expedition.title}
          </p>
        </div>

        {/* AI Gamification Scoring Scoreboard */}
        <div className="my-5 p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-primary/10 to-purple-600/15 border border-amber-500/30 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Gamification Score & Rewards
            </span>
            <span className="badge badge-warning font-black text-xs px-3 py-1 text-slate-900 shadow">
              +{score.totalPoints} Traveler Points
            </span>
          </div>

          {/* AI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center my-3">
            <div className="bg-base-100/90 p-3 rounded-2xl border border-base-300 shadow-sm">
              <span className="text-[10px] text-base-content/60 font-bold block">Budget Score</span>
              <span className="text-base font-black text-emerald-500">{score.budgetDisciplineScore}%</span>
            </div>
            <div className="bg-base-100/90 p-3 rounded-2xl border border-base-300 shadow-sm">
              <span className="text-[10px] text-base-content/60 font-bold block">Route Completion</span>
              <span className="text-base font-black text-indigo-500">{score.explorationBonus}%</span>
            </div>
            <div className="bg-base-100/90 p-3 rounded-2xl border border-base-300 shadow-sm">
              <span className="text-[10px] text-base-content/60 font-bold block">Spontaneous Detours</span>
              <span className="text-base font-black text-amber-500">{spontaneousStops.length} Found</span>
            </div>
            <div className="bg-base-100/90 p-3 rounded-2xl border border-base-300 shadow-sm">
              <span className="text-[10px] text-base-content/60 font-bold block">Pace Efficiency</span>
              <span className="text-base font-black text-purple-500">{score.paceEfficiency}%</span>
            </div>
          </div>

          {/* AI Review Summary */}
          <p className="text-xs text-base-content/80 italic leading-relaxed bg-base-100/60 p-3 rounded-xl border border-base-300/50 mt-3">
            🤖 <b className="text-primary not-italic">AI Evaluation:</b> "{score.reviewSummary}"
          </p>

          {/* Badges Unlocked */}
          {score.badges && score.badges.length > 0 && (
            <div className="mt-4 pt-3 border-t border-base-300/50">
              <span className="text-[10px] font-black uppercase text-base-content/60 block mb-2">
                🏅 Expedition Badges Unlocked:
              </span>
              <div className="flex flex-wrap gap-2">
                {score.badges.map((badge, idx) => (
                  <span 
                    key={idx} 
                    className="badge badge-lg bg-base-100 border-2 border-amber-400/80 text-amber-500 font-black text-xs py-2 px-3 shadow-md flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Itemized Trip Summary */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-base-content/60">
            📊 Final Expense & Route Overview
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-300">
              <span className="text-[10px] text-base-content/60 block">Stops Completed</span>
              <span className="font-black text-sm text-base-content">{checkedStops.length} of {stops.length}</span>
            </div>

            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-300">
              <span className="text-[10px] text-base-content/60 block">Target Budget</span>
              <span className="font-black text-sm text-base-content">{Number(expedition.targetBudget).toLocaleString()} BDT</span>
            </div>

            <div className="bg-base-200/60 p-3 rounded-2xl border border-base-300 col-span-2 md:col-span-1">
              <span className="text-[10px] text-base-content/60 block">Total Final Expense</span>
              <span className={`font-black text-sm ${totalSpent <= expedition.targetBudget ? 'text-emerald-500' : 'text-error'}`}>
                {Number(totalSpent).toLocaleString()} BDT
              </span>
            </div>
          </div>

          {/* Stays & Stops Chips */}
          <div className="bg-base-200/40 p-3 rounded-2xl border border-base-300 text-xs space-y-2">
            <span className="text-[10px] font-bold text-base-content/60 block">Key Places & Stays Encountered:</span>
            <div className="flex flex-wrap gap-1.5">
              {stops.map((s, idx) => (
                <span 
                  key={idx} 
                  className={`badge badge-sm py-2 px-2.5 text-[11px] font-semibold border ${
                    s.isSpontaneous ? 'badge-warning' : s.status === 'checked_in' ? 'badge-neutral' : 'badge-ghost opacity-60'
                  }`}
                >
                  {s.isSpontaneous ? '🌟 ' : ''}{s.placeName} ({s.accommodationType || 'Transit'})
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="modal-action border-t border-base-300 pt-5 flex flex-col sm:flex-row justify-between gap-3">
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-ghost rounded-xl text-xs order-2 sm:order-1"
          >
            Close Summary
          </button>

          <button 
            onClick={handlePublish}
            className="btn btn-sm btn-primary text-primary-content font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 order-1 sm:order-2"
          >
            <Send className="w-4 h-4" /> Publish Story to Social Feed
          </button>
        </div>

      </div>
    </div>
  );
}
