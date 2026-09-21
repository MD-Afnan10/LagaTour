import React, { useState } from "react";
import { 
  X, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Loader2, 
  User, 
  Check 
} from "lucide-react";
import { getLeagueBadgeClass } from "../../utils/leagueHelper";

const REPORT_CATEGORIES = [
  { id: "harassment", label: "Harassment or Bullying", desc: "Threatening, abusive, or harmful behavior" },
  { id: "spam", label: "Spam or Advertising", desc: "Unsolicited promotion, repetitive messaging, or bots" },
  { id: "impersonation", label: "Impersonation / Fake Profile", desc: "Pretending to be someone else or deceptive profile" },
  { id: "inappropriate", label: "Inappropriate Bio or Content", desc: "Adult content, offensive language, or gore" },
  { id: "fraud", label: "Scam / Financial Fraud", desc: "Phishing, suspicious payment requests, or fake tours" },
  { id: "safety", label: "Hate Speech or Safety Threat", desc: "Promoting violence, hate speech, or real-world harm" },
  { id: "other", label: "Other Violation", desc: "Any other behavior violating community rules" }
];

export default function ReportUserModal({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onSubmitReport
}) {
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].label);
  const [reason, setReason] = useState("");
  const [reporterName, setReporterName] = useState(
    currentUser?.name || currentUser?.username || ""
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!reason.trim()) {
      setErrorMsg("Please provide a reason explaining why you are reporting this user.");
      return;
    }

    if (reason.trim().length < 10) {
      setErrorMsg("Please provide a bit more detail (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmitReport) {
        await onSubmitReport({
          targetUser,
          category,
          reason: reason.trim(),
          reporterName: isAnonymous ? "Anonymous User" : (reporterName.trim() || "Anonymous Traveler"),
          isAnonymous
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setReason("");
        setErrorMsg("");
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setErrorMsg("");
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0 shadow-sm border border-error/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-base-content leading-tight">
                  Report User to Admins
                </h3>
                <span className="badge badge-error badge-sm text-white font-bold">Admin Review</span>
              </div>
              <p className="text-xs text-base-content/70 mt-0.5">
                Submit this report to platform administrators for investigation and disciplinary action.
              </p>
            </div>
          </div>

          {/* Target User Summary Card */}
          <div className="mt-4 p-3 bg-base-100 rounded-2xl border border-base-200 flex items-center gap-3 shadow-inner">
            <img
              src={targetUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetUser.username || 'user'}`}
              alt={targetUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-base-300 bg-base-200 shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetUser.username || 'traveler'}`;
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-base-content truncate">{targetUser.name}</span>
                {targetUser.league && (
                  <span className={`badge badge-xs ${getLeagueBadgeClass(targetUser.league)}`}>
                    {targetUser.league}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 font-semibold font-mono">@{targetUser.username || "traveler"}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-error/80 block">Reporting Target</span>
              <span className="text-[10px] text-base-content/50 font-mono">ID: {(targetUser.id || targetUser.user_id || "").toString().slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-base-content">Report Submitted to Admins!</h4>
              <p className="text-xs text-base-content/70 max-w-sm mx-auto leading-relaxed">
                Thank you for helping keep the LagaTour community safe. Our administration team has logged your report in the admin portal queue and will review it promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-black uppercase text-base-content/80 tracking-wider mb-2">
                  1. Select Violation Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-error/10 border-error text-error font-bold shadow-sm"
                            : "bg-base-200/40 border-base-200 hover:bg-base-200 hover:border-base-300 text-base-content/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{cat.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-error shrink-0" />}
                        </div>
                        <span className="text-[10px] font-normal text-base-content/60 mt-0.5 line-clamp-1">
                          {cat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-black uppercase text-base-content/80 tracking-wider">
                    2. Reason for Reporting <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-base-content/50">
                    {reason.length} / 500
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Provide specific details about why you are reporting this user. Include any relevant actions, messages, dates, or offensive conduct..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="textarea textarea-bordered w-full text-xs rounded-2xl bg-base-100 focus:border-error focus:ring-1 focus:ring-error transition-all"
                  required
                />
              </div>

              {/* Reporter Info & Anonymous Toggle */}
              <div className="p-3.5 bg-base-200/40 rounded-2xl border border-base-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-base-content/70" />
                    <span className="text-xs font-bold text-base-content">
                      {isAnonymous ? "Reporting Anonymously" : `Reporting as: ${reporterName || "Anonymous"}`}
                    </span>
                  </div>
                  <label className="label cursor-pointer py-0 gap-2">
                    <span className="label-text text-xs text-base-content/70">Stay Anonymous</span>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="checkbox checkbox-xs checkbox-error rounded-md"
                    />
                  </label>
                </div>

                {!isAnonymous && (
                  <input
                    type="text"
                    placeholder="Your name or handle (defaults to your profile)"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="input input-xs input-bordered w-full rounded-xl text-xs bg-base-100"
                  />
                )}
              </div>

              {/* Admin Note Box */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">
                  Admins will see this report inside the Administration Portal and may issue a formal warning, restrict features, or permanently suspend this account.
                </span>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-error/15 border border-error/30 text-error rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold text-base-content/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-lg shadow-error/20 gap-2 hover:scale-[1.02] transition-transform"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" /> Submit Report to Admins
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
