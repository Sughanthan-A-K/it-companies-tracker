import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  RotateCcw, 
  FileSpreadsheet, 
  Check, 
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { VERIFIED_PONDICHERRY_IT_COMPANIES } from './data/verifiedPondyCompanies';
import { exportToExcel } from './utils/exportUtils';
import RouteMapModal from './components/RouteMapModal';
import VisitedHistoryModal from './components/VisitedHistoryModal';

const STORAGE_KEY = 'pondy_it_field_tracker_v3';

// Clean Color Badges for Calling Status
export const CALLING_STATUS_STYLES = {
  'Not Called': 'bg-slate-100 text-slate-700 border-slate-300',
  'Called - Follow Up': 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
  'Positive / Interview': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
  'Not Hiring / Rejected': 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
  'No Answer / Switch Off': 'bg-purple-100 text-purple-800 border-purple-300'
};

// Clean Color Badges for Visit Status
export const VISIT_STATUS_STYLES = {
  'Yet to Visit': 'bg-slate-100 text-slate-700 border-slate-300',
  'Visited (Met HR)': 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs',
  'Office Verified': 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
  'Office Shifted': 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
};

export default function App() {
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return VERIFIED_PONDICHERRY_IT_COMPANIES;
  });

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [hideVisited, setHideVisited] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [focusTargetForMap, setFocusTargetForMap] = useState(null);
  const [activeCompanyForDetails, setActiveCompanyForDetails] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  // Persist state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch (e) {
      console.error(e);
    }
  }, [companies]);

  // Extract unique areas for the clean filter dropdown
  const uniqueAreas = useMemo(() => {
    const set = new Set();
    VERIFIED_PONDICHERRY_IT_COMPANIES.forEach(c => {
      if (c.area) set.add(c.area.trim());
    });
    return ['All Areas', ...Array.from(set).sort()];
  }, []);

  // Update Status directly
  const handleUpdateStatus = (id, field, value) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        if (field === 'visitStatus' && value === 'Visited (Met HR)') {
          updated.isCompleted = true;
        } else if (field === 'visitStatus' && value === 'Yet to Visit') {
          updated.isCompleted = false;
        }
        return updated;
      }
      return c;
    }));

    if (activeCompanyForDetails && activeCompanyForDetails.id === id) {
      setActiveCompanyForDetails(prev => ({ ...prev, [field]: value }));
    }
  };

  // Toggle visited complete
  const handleToggleVisited = (id) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.isCompleted;
        return {
          ...c,
          isCompleted: nextState,
          visitStatus: nextState ? 'Visited (Met HR)' : 'Yet to Visit'
        };
      }
      return c;
    }));

    if (activeCompanyForDetails && activeCompanyForDetails.id === id) {
      setActiveCompanyForDetails(prev => ({
        ...prev,
        isCompleted: !prev.isCompleted,
        visitStatus: !prev.isCompleted ? 'Visited (Met HR)' : 'Yet to Visit'
      }));
    }
  };

  // Save Notes
  const handleSaveNotes = (id) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, notes: tempNotes } : c));
    if (activeCompanyForDetails && activeCompanyForDetails.id === id) {
      setActiveCompanyForDetails(prev => ({ ...prev, notes: tempNotes }));
    }
  };

  // Reset database back to verified Pondicherry IT list
  const handleResetData = () => {
    if (window.confirm("Pondicherry IT Company list-ah verified fresh data-ku reset panna venduma?")) {
      setCompanies(VERIFIED_PONDICHERRY_IT_COMPANIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(VERIFIED_PONDICHERRY_IT_COMPANIES));
    }
  };

  // Clean filtered list
  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (hideVisited && c.isCompleted) return false;

      const q = search.toLowerCase().trim();
      if (q) {
        const matchName = c.name?.toLowerCase().includes(q);
        const matchArea = c.area?.toLowerCase().includes(q);
        const matchCat = c.category?.toLowerCase().includes(q);
        const matchPhone = c.phone?.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        if (!matchName && !matchArea && !matchCat && !matchPhone) return false;
      }

      if (selectedArea !== 'All Areas' && !c.area.toLowerCase().includes(selectedArea.toLowerCase())) {
        return false;
      }

      if (selectedStatusFilter !== 'All Status') {
        if (c.callingStatus !== selectedStatusFilter && c.visitStatus !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [companies, search, selectedArea, selectedStatusFilter, hideVisited]);

  const visitedCount = companies.filter(c => c.isCompleted).length;
  const pendingCount = companies.length - visitedCount;

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden">
      
      {/* 1. CLEAN TOP HEADER */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
            IT
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
              Pondicherry IT Companies
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold truncate flex items-center gap-1.5">
              <span>Verified IT & Software Developers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 font-bold">{companies.length} Total</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* MAP BUTTON */}
          <button
            onClick={() => {
              setFocusTargetForMap(null);
              setIsMapModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            title="Open Road Route Map"
          >
            <span>🗺️ MAP</span>
            <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-black">
              {pendingCount}
            </span>
          </button>

          {/* VISITED HISTORY BUTTON */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
            title="View Visited Companies"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Visited</span>
            <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-black">
              {visitedCount}
            </span>
          </button>

          {/* EXCEL EXPORT */}
          <button
            onClick={() => exportToExcel(companies)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs active:scale-95 transition-all"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          {/* RESET */}
          <button
            onClick={handleResetData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 text-xs active:scale-95 transition-all"
            title="Reset to fresh verified data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. SIMPLE FILTER & SEARCH BAR (Zero clutter) */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search IT company name, phone, or tech..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold py-1.5 px-2.5 rounded-xl outline-none cursor-pointer"
          >
            {uniqueAreas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Status Highlight Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold py-1.5 px-2.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="All Status">All Status</option>
            <option value="Positive / Interview">⭐ Positive / Interview</option>
            <option value="Called - Follow Up">⏳ Follow Up Needed</option>
            <option value="Visited (Met HR)">✅ Visited (Met HR)</option>
            <option value="No Answer / Switch Off">📞 No Answer / Switch Off</option>
            <option value="Not Hiring / Rejected">❌ Not Hiring / Rejected</option>
          </select>

          {/* Hide Visited Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold">
            <input
              type="checkbox"
              checked={hideVisited}
              onChange={e => setHideVisited(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
            />
            <span>Hide Visited ({visitedCount})</span>
          </label>
        </div>
      </div>

      {/* 3. CLEAN DIRECTORY TABLE */}
      <main className="flex-1 overflow-hidden p-2 sm:p-5 max-w-7xl w-full mx-auto flex flex-col">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                <tr className="text-slate-700 font-black uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-2 w-10 text-center">Done</th>
                  <th className="py-2.5 px-1.5 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Company & Area</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Phone Number</th>
                  <th className="py-2.5 px-3 min-w-[140px] hidden md:table-cell">Calling Status</th>
                  <th className="py-2.5 px-3 min-w-[140px] hidden md:table-cell">Visit Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Google Map / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, idx) => {
                  const isDone = !!c.isCompleted;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    c.mapsQuery || `${c.name} ${c.area} Pondicherry`
                  )}`;

                  return (
                    <tr 
                      key={c.id}
                      className={`transition-colors ${
                        isDone 
                          ? 'bg-slate-50/70 opacity-50 grayscale select-none' 
                          : 'hover:bg-blue-50/40 cursor-pointer'
                      }`}
                      onClick={() => {
                        setActiveCompanyForDetails(c);
                        setTempNotes(c.notes || '');
                      }}
                    >
                      {/* Done Checkbox */}
                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleVisited(c.id)}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          title="Toggle Visited status"
                        />
                      </td>

                      {/* Number */}
                      <td className="py-2.5 px-1.5 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Company Name, Area & Category */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-between">
                          <span className={`font-extrabold text-sm ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}>
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            📍 {c.area}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[200px]">
                            {c.category}
                          </span>
                        </div>
                      </td>

                      {/* Phone Number (Verified, direct dial) */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                            className="font-extrabold text-xs inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800"
                            title="Click to dial"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-mono tracking-tight">{c.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No phone</span>
                        )}
                      </td>

                      {/* Calling Status Selector with HIGHLIGHT BADGE */}
                      <td className="py-2.5 px-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.callingStatus || 'Not Called'}
                          onChange={e => handleUpdateStatus(c.id, 'callingStatus', e.target.value)}
                          className={`w-full py-1.5 px-2 rounded-xl text-xs border outline-none font-bold cursor-pointer transition-all ${
                            CALLING_STATUS_STYLES[c.callingStatus] || 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          <option value="Not Called">Not Called</option>
                          <option value="Called - Follow Up">⏳ Follow Up Needed</option>
                          <option value="Positive / Interview">⭐ Positive / Interview</option>
                          <option value="Not Hiring / Rejected">❌ Not Hiring / Rejected</option>
                          <option value="No Answer / Switch Off">📞 No Answer / Switch Off</option>
                        </select>
                      </td>

                      {/* Visit Status Selector with HIGHLIGHT BADGE */}
                      <td className="py-2.5 px-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.visitStatus || 'Yet to Visit'}
                          onChange={e => handleUpdateStatus(c.id, 'visitStatus', e.target.value)}
                          className={`w-full py-1.5 px-2 rounded-xl text-xs border outline-none font-bold cursor-pointer transition-all ${
                            VISIT_STATUS_STYLES[c.visitStatus] || 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          <option value="Yet to Visit">Yet to Visit</option>
                          <option value="Visited (Met HR)">✅ Visited (Met HR)</option>
                          <option value="Office Verified">🏢 Office Verified</option>
                          <option value="Office Shifted">⚠️ Office Shifted</option>
                        </select>
                      </td>

                      {/* Direct Google Maps & Action */}
                      <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs"
                            title="Open Google Maps direction"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Map</span>
                          </a>

                          <button
                            onClick={() => {
                              setActiveCompanyForDetails(c);
                              setTempNotes(c.notes || '');
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="View details & edit notes"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. CLEAN COMPANY DETAILS & STATUS POPUP */}
      {activeCompanyForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/20 text-white inline-block mb-1">
                  📍 {activeCompanyForDetails.area}
                </span>
                <h3 className="font-extrabold text-base leading-snug">
                  {activeCompanyForDetails.name}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {activeCompanyForDetails.category}
                </p>
              </div>
              <button
                onClick={() => setActiveCompanyForDetails(null)}
                className="p-1 rounded-xl bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Address with Google Maps Button */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Full Verified Address:
                </span>
                <p className="font-bold text-slate-800 text-xs">
                  {activeCompanyForDetails.address}
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activeCompanyForDetails.mapsQuery || `${activeCompanyForDetails.name} ${activeCompanyForDetails.area} Pondicherry`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-center flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                  </a>

                  {activeCompanyForDetails.phone && (
                    <a
                      href={`tel:${activeCompanyForDetails.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-center flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status Selectors with Immediate Visual Feedback */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase block mb-1">
                    Calling Status:
                  </label>
                  <select
                    value={activeCompanyForDetails.callingStatus || 'Not Called'}
                    onChange={e => handleUpdateStatus(activeCompanyForDetails.id, 'callingStatus', e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs border font-extrabold outline-none cursor-pointer ${
                      CALLING_STATUS_STYLES[activeCompanyForDetails.callingStatus] || 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Not Called">Not Called</option>
                    <option value="Called - Follow Up">⏳ Follow Up Needed</option>
                    <option value="Positive / Interview">⭐ Positive / Interview</option>
                    <option value="Not Hiring / Rejected">❌ Not Hiring / Rejected</option>
                    <option value="No Answer / Switch Off">📞 No Answer / Switch Off</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase block mb-1">
                    Physical Visit Status:
                  </label>
                  <select
                    value={activeCompanyForDetails.visitStatus || 'Yet to Visit'}
                    onChange={e => handleUpdateStatus(activeCompanyForDetails.id, 'visitStatus', e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs border font-extrabold outline-none cursor-pointer ${
                      VISIT_STATUS_STYLES[activeCompanyForDetails.visitStatus] || 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Yet to Visit">Yet to Visit</option>
                    <option value="Visited (Met HR)">✅ Visited (Met HR)</option>
                    <option value="Office Verified">🏢 Office Verified</option>
                    <option value="Office Shifted">⚠️ Office Shifted</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block mb-1">
                  Field Notes / HR Details:
                </label>
                <textarea
                  rows={2}
                  value={tempNotes}
                  onChange={e => setTempNotes(e.target.value)}
                  placeholder="Enter HR name or interview details here..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    handleSaveNotes(activeCompanyForDetails.id);
                    alert("Notes saved!");
                  }}
                  className="mt-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 ml-auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>

              {/* Mark Visited Toggle Button */}
              <button
                onClick={() => handleToggleVisited(activeCompanyForDetails.id)}
                className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                  activeCompanyForDetails.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{activeCompanyForDetails.isCompleted ? 'Visited ✓ (Click to Unmark)' : 'Mark as Visited'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Road Route Map Modal */}
      <RouteMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setFocusTargetForMap(null);
        }}
        companies={companies}
        focusCompany={focusTargetForMap}
        activeCity="Pondicherry"
        cityAreas={uniqueAreas}
        onToggleComplete={handleToggleVisited}
      />

      {/* Visited History Modal */}
      <VisitedHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        companies={companies}
        onUndoVisited={(comp) => handleToggleVisited(comp.id)}
        onOpenMapForCompany={(comp) => {
          setFocusTargetForMap(comp);
          setIsMapModalOpen(true);
        }}
      />

    </div>
  );
}
