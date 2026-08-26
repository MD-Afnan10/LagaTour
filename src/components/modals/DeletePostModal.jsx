import React from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

export default function DeletePostModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 border border-base-300 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-base text-base-content">Delete Travel Post?</h3>
          <p className="text-xs text-base-content/60 mt-1">
            This action will permanently delete the post, comments, and media from the MySQL database.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete Forever</span>
          </button>
        </div>
      </div>
    </div>
  );
}
