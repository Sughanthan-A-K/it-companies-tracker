import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  MapPin, 
  Navigation, 
  Phone, 
  Search, 
  Building2, 
  ExternalLink,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function VisitedHistoryModal({
  isOpen,
  onClose,
  companies,
  onUndoVisited,
  onOpenMapForCompany
}) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const visitedList = companies.filter(c => c.isCompleted);
  const filtered = visitedList.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug flex items-center gap-2">
                <span>Visited Companies History</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black">
                  {visitedList.length}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100">
                Undo accidental visits or navigate straight to any visited office
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search visited company or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-500 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Body List */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No visited companies found</p>
              <p className="text-xs text-slate-400 mt-1">
                {visitedList.length === 0 
                  ? "You haven't marked any company as visited yet." 
                  : "No matches for your search keyword."}
              </p>
            </div>
          ) : (
            filtered.map(comp => (
              <div
                key={comp.id}
                className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 transition-all shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Visited
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      📍 {comp.area}
                    </span>
                    {comp.notes && (
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                        📝 {comp.notes}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {comp.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {comp.address}
                  </p>
                </div>

                {/* Quick Action Buttons for Visited item */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* UNDO BUTTON */}
                  <button
                    onClick={() => onUndoVisited(comp)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                    title="Undo accidental visited status"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Undo Visit</span>
                  </button>

                  {/* MAP ROUTE TO THIS LOCATION FROM CURRENT GPS */}
                  <button
                    onClick={() => {
                      onOpenMapForCompany(comp);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                    title="Map route from current location to this office"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Map Route</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Total Visited: <span className="font-bold text-emerald-700">{visitedList.length}</span> • Clicking "Map Route" calculates road driving route from your live GPS!
        </div>
      </div>
    </div>
  );
}
