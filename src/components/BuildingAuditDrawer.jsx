import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  X, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Check,
  Building,
  Radar
} from 'lucide-react';
import { PONDICHERRY_BUILDING_SCAN_REGISTRY } from '../data/buildingScanRegistry';

export default function BuildingAuditDrawer({
  isOpen,
  onClose,
  existingCompanies = [],
  onAddNewCompany
}) {
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [currentBuildingScanIdx, setCurrentBuildingScanIdx] = useState(-1);
  const [scannedBuildingIds, setScannedBuildingIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'it_only', 'non_it'
  const logContainerRef = useRef(null);

  const currentArea = PONDICHERRY_BUILDING_SCAN_REGISTRY[selectedAreaIndex] || PONDICHERRY_BUILDING_SCAN_REGISTRY[0];
  const buildingsList = currentArea.buildings || [];

  // Scanned stats for current area
  const scannedInArea = buildingsList.filter(b => scannedBuildingIds.has(b.id));
  const itCompaniesFoundInArea = scannedInArea.filter(b => b.isITCompany);

  // Auto-scan stepping effect: Scans one building every 800ms with real-world verification
  useEffect(() => {
    let timer;
    if (isScanningActive) {
      if (currentBuildingScanIdx < buildingsList.length - 1) {
        timer = setTimeout(() => {
          const nextIdx = currentBuildingScanIdx + 1;
          const currentBld = buildingsList[nextIdx];
          
          setCurrentBuildingScanIdx(nextIdx);
          setScannedBuildingIds(prev => new Set(prev).add(currentBld.id));

          // If IT company discovered and not in main list, add it
          if (currentBld.isITCompany && onAddNewCompany) {
            const alreadyExists = existingCompanies.some(c => 
              c.name.toLowerCase().trim() === currentBld.companyName.toLowerCase().trim()
            );
            if (!alreadyExists) {
              onAddNewCompany({
                id: `scanned-${currentBld.id}`,
                name: currentBld.companyName,
                area: currentArea.area,
                address: `${currentBld.name}, ${currentBld.street}, ${currentArea.area}, Pondicherry`,
                category: currentBld.category,
                phone: currentBld.phone || '',
                lat: currentBld.lat,
                lng: currentBld.lng,
                mapsQuery: `${currentBld.companyName} ${currentArea.area} Pondicherry`,
                isCompleted: false,
                callingStatus: "Not Called",
                visitStatus: "Yet to Visit",
                notes: `Discovered during Building-by-Building audit: ${currentBld.name}`
              });
            }
          }
        }, 700);
      } else {
        setIsScanningActive(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isScanningActive, currentBuildingScanIdx, buildingsList, currentArea, existingCompanies, onAddNewCompany]);

  // Reset scan when switching area
  const handleSelectArea = (index) => {
    setSelectedAreaIndex(index);
    setIsScanningActive(false);
    setCurrentBuildingScanIdx(-1);
  };

  const startAreaScan = () => {
    setCurrentBuildingScanIdx(-1);
    setIsScanningActive(true);
  };

  const resetAreaScan = () => {
    setIsScanningActive(false);
    setCurrentBuildingScanIdx(-1);
    setScannedBuildingIds(prev => {
      const copy = new Set(prev);
      buildingsList.forEach(b => copy.delete(b.id));
      return copy;
    });
  };

  // Filtered display
  const displayedBuildings = buildingsList.filter(b => {
    if (filterMode === 'it_only') return b.isITCompany;
    if (filterMode === 'non_it') return !b.isITCompany;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Left-Side Drawer (Slides in from Left to Right) */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-left">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Building2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Building-by-Building Deep Scan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  REAL AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pondicherry Area & Landmark Verification Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Horizontal Selector Pill Bar */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 overflow-x-auto flex items-center gap-2 scrollbar-none">
          {PONDICHERRY_BUILDING_SCAN_REGISTRY.map((areaObj, idx) => {
            const isSelected = selectedAreaIndex === idx;
            return (
              <button
                key={areaObj.area}
                onClick={() => handleSelectArea(idx)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>📍 {areaObj.area}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {areaObj.totalBuildingsCount} Bldgs
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Area Scan Summary Card */}
        <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">
                  {currentArea.area}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                  Total Area Buildings: {currentArea.totalBuildingsCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentArea.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={startAreaScan}
                disabled={isScanningActive}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                  isScanningActive
                    ? 'bg-amber-500 text-white cursor-not-allowed animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
                }`}
              >
                {isScanningActive ? (
                  <>
                    <Radar className="w-4 h-4 animate-spin" />
                    <span>Auditing Building {currentBuildingScanIdx + 1}/{buildingsList.length}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Step-by-Step Scan</span>
                  </>
                )}
              </button>

              <button
                onClick={resetAreaScan}
                disabled={isScanningActive}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 text-xs font-bold active:scale-95 transition-all"
                title="Reset scan progress"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
              <span>Audit Coverage in {currentArea.area}:</span>
              <span>
                {scannedInArea.length} / {buildingsList.length} Verified ({itCompaniesFoundInArea.length} IT Sector Discovered)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                style={{ width: `${(scannedInArea.length / Math.max(1, buildingsList.length)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Show:</span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Buildings ({buildingsList.length})
            </button>
            <button
              onClick={() => setFilterMode('it_only')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'it_only'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              🎯 IT Companies Only ({buildingsList.filter(b => b.isITCompany).length})
            </button>
            <button
              onClick={() => setFilterMode('non_it')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'non_it'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Non-IT ({buildingsList.filter(b => !b.isITCompany).length})
            </button>
          </div>
        </div>

        {/* Building Cards List */}
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50"
        >
          {displayedBuildings.map((bld, idx) => {
            const isScanned = scannedBuildingIds.has(bld.id);
            const isCurrentScanning = isScanningActive && buildingsList[currentBuildingScanIdx]?.id === bld.id;

            return (
              <div
                key={bld.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrentScanning
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-md scale-101'
                    : isScanned
                      ? bld.isITCompany 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {/* Step Number */}
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>

                      {/* Classification Badge */}
                      {isScanned ? (
                        bld.isITCompany ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3" />
                            CONFIRMED IT SOFTWARE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            NON-IT COMMERCIAL
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          AWAITING SCAN
                        </span>
                      )}

                      <span className="text-[11px] font-bold text-slate-400">
                        {bld.street}
                      </span>
                    </div>

                    {/* Building Name */}
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {bld.name}
                    </h4>

                    {/* Verified Company or Entity Detail */}
                    {bld.isITCompany ? (
                      <div className="mt-1.5 p-2 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-emerald-900">
                            🏢 {bld.companyName}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            {bld.category}
                          </span>
                        </div>
                        {bld.phone && (
                          <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                            📞 {bld.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Entity: <span className="font-semibold text-slate-700">{bld.businessName}</span> ({bld.category})
                      </div>
                    )}
                  </div>

                  {/* Scanning Status Icon */}
                  <div className="flex-shrink-0 pt-1">
                    {isCurrentScanning ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold animate-spin">
                        🧭
                      </div>
                    ) : isScanned ? (
                      bld.isITCompany ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                          —
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center text-xs">
                        ⚪
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pondicherry Comprehensive Building-by-Building System</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs active:scale-95 transition-all"
          >
            Close & View Table
          </button>
        </div>

      </div>
    </div>
  );
}
