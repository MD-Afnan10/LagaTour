import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldAlert, 
  ShieldOff, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Bell, 
  User, 
  Flag 
} from "lucide-react";
import { getLeagueBadgeClass } from "../../utils/leagueHelper";

export default function AdminReportActionModal({
  isOpen,
  onClose,
  report,
  onConfirmAction
}) {
  const [actionType, setActionType] = useState("suspend"); // 'suspend' | 'warn' | 'dismiss'
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (report) {
      const username = report.targetUser?.username || "traveler";
      const reason = report.reason || "Violating community conduct standards";
      if (actionType === "suspend") {
        setCustomMessage(
          `Your LagaTour account (@${username}) has been SUSPENDED by administration following a community report regarding: "${reason}". Access to posting, tour creation, and group participation is disabled.`
        );
      } else if (actionType === "warn") {
        setCustomMessage(
          `Official Community Warning: Your account (@${username}) received a guidelines infraction regarding: "${reason}". Continued violations will result in immediate suspension.`
        );
      } else {
        setCustomMessage("Report marked as dismissed. No penalty applied.");
      }
    }
  }, [report, actionType]);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmAction(report.id, actionType, customMessage);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0 border border-error/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-base-content leading-tight">
                  Moderate User Report
                </h3>
                <span className="badge badge-error badge-sm text-white font-bold">Admin Action</span>
              </div>
              <p className="text-xs text-base-content/70 mt-0.5">
                Resolve user violation report and dispatch automated activity notice to traveler.
              </p>
            </div>
          </div>

          {/* Reported User & Report Details Card */}
          <div className="mt-4 p-3 bg-base-100 rounded-2xl border border-base-200 space-y-2">
            <div className="flex items-center gap-3">
              <img
                src={report.targetUser?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${report.targetUser?.username || 'user'}`}
                alt={report.targetUser?.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-base-300 bg-base-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-base-content truncate">{report.targetUser?.name || "Traveler"}</h4>
                  <span className={`badge badge-xs ${getLeagueBadgeClass(report.targetUser?.league)}`}>
                    {report.targetUser?.league || "Explorer"}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 font-mono">@{report.targetUser?.username || "traveler"}</p>
              </div>
              <span className="badge badge-error badge-sm font-bold text-white shrink-0">
                {report.category || "Violation"}
              </span>
            </div>

            <div className="p-2.5 bg-error/10 border border-error/20 rounded-xl text-xs text-error leading-relaxed">
              <span className="font-bold">Reported Reason: </span>
              <span className="text-base-content font-medium">{report.reason}</span>
            </div>

            <div className="text-[10px] text-base-content/60 flex justify-between px-1">
              <span>Flagged by: <strong className="text-base-content">{report.reporter?.name || "Community Member"}</strong></span>
              <span className="font-mono">{report.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="text-xs font-black uppercase text-base-content/80 tracking-wider block mb-2">
              Select Resolution Decision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              <button
                type="button"
                onClick={() => setActionType("suspend")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  actionType === "suspend"
                    ? "bg-error/15 border-error text-error font-bold shadow-sm"
                    : "bg-base-200/40 border-base-200 hover:bg-base-200 text-base-content/75"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldOff className="w-4 h-4 text-error" /> Accept & Suspend
                </div>
                <span className="text-[10px] text-base-content/60 font-normal mt-1 leading-tight">
                  Ban account & notify user of suspension
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("warn")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  actionType === "warn"
                    ? "bg-warning/15 border-warning text-warning-content font-bold shadow-sm"
                    : "bg-base-200/40 border-base-200 hover:bg-base-200 text-base-content/75"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-warning">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Accept & Warn
                </div>
                <span className="text-[10px] text-base-content/60 font-normal mt-1 leading-tight">
                  Keep active but send disciplinary warning
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("dismiss")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  actionType === "dismiss"
                    ? "bg-base-300 border-base-content/40 font-bold shadow-sm"
                    : "bg-base-200/40 border-base-200 hover:bg-base-200 text-base-content/75"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <X className="w-4 h-4" /> Reject Report
                </div>
                <span className="text-[10px] text-base-content/60 font-normal mt-1 leading-tight">
                  Dismiss report without penalty
                </span>
              </button>

            </div>
          </div>

          {actionType !== "dismiss" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black uppercase text-base-content/80 tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-info" /> Activity Notification Sent to User
                </label>
                <span className="text-[10px] text-base-content/50">Auto-dispatched to user inbox</span>
              </div>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="textarea textarea-bordered w-full text-xs rounded-2xl bg-base-100"
                required
              />
              <p className="text-[10px] text-base-content/60 mt-1">
                This message will immediately appear in the user's notification bell with an official administrator alert banner.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md gap-1.5 ${
                actionType === "suspend" ? "btn-error" : actionType === "warn" ? "btn-warning text-slate-900" : "btn-neutral"
              }`}
            >
              {actionType === "suspend" ? (
                <>
                  <ShieldOff className="w-4 h-4" /> Confirm & Suspend Account
                </>
              ) : actionType === "warn" ? (
                <>
                  <AlertTriangle className="w-4 h-4" /> Dispatch Warning Notice
                </>
              ) : (
                <>
                  <X className="w-4 h-4" /> Dismiss Report
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
