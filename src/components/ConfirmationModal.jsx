import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  companyName,
  confirmText = "Yes, Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onClose,
  type = "primary" // "primary", "danger", "success"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Icon & Title */}
        <div className="p-5 pb-3 flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
            type === 'danger' 
              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            {type === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {title || "Confirm Action"}
            </h3>
            {companyName && (
              <p className="text-xs font-bold text-blue-700 truncate mt-0.5">
                {companyName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="px-5 py-2 text-xs text-slate-600 leading-relaxed">
          {message}
        </div>

        {/* Actions Buttons */}
        <div className="p-4 pt-3 mt-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs text-white shadow-sm active:scale-95 transition-all ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
