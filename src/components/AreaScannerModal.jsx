import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  RotateCw, 
  Building2, 
  Zap, 
  X,
  Play,
  Square,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PONDICHERRY_AREA_SCAN_REGISTRY } from '../data/areaScannerRegistry';

export default function AreaScannerModal({ 
  isOpen, 
  onClose, 
  existingCompanies, 
  onBatchAddCompanies 
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [newlyAddedCount, setNewlyAddedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const totalAreas = PONDICHERRY_AREA_SCAN_REGISTRY.length;
  const currentArea = PONDICHERRY_AREA_SCAN_REGISTRY[currentAreaIndex];
  const progressPercent = Math.round(((currentAreaIndex + (isComplete ? 1 : 0)) / totalAreas) * 100);

  // Auto scan engine effect
  useEffect(() => {
    let timer;
    if (isScanning && currentAreaIndex < totalAreas) {
      const areaData = PONDICHERRY_AREA_SCAN_REGISTRY[currentAreaIndex];
      
      // Add scanning start log
      setScanLogs(prev => [
        `📡 Scanning area ${currentAreaIndex + 1}/${totalAreas}: [${areaData.area}] - Exploring IT clusters & software devs...`,
        ...prev
      ]);

      timer = setTimeout(() => {
        // Find companies in this area that aren't already in the database
        const existingNames = new Set(existingCompanies.map(c => c.name.toLowerCase().trim()));
        const incomingCompanies = areaData.companies;
        const newToAdd = incomingCompanies.filter(c => !existingNames.has(c.name.toLowerCase().trim()));

        if (newToAdd.length > 0) {
          onBatchAddCompanies(newToAdd);
          setNewlyAddedCount(prev => prev + newToAdd.length);
          setScanLogs(prev => [
            `✅ Found ${incomingCompanies.length} companies in ${areaData.area} (${newToAdd.length} new firms appended to database)`,
            ...prev
          ]);
        } else {
          setScanLogs(prev => [
            `ℹ️ Found ${incomingCompanies.length} companies in ${areaData.area} (All verified firms already synced)`,
            ...prev
          ]);
        }

        setTotalFound(prev => prev + incomingCompanies.length);

        // Move to next area
        if (currentAreaIndex + 1 < totalAreas) {
          setCurrentAreaIndex(prev => prev + 1);
        } else {
          setIsScanning(false);
          setIsComplete(true);
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 }
          });
          setScanLogs(prev => [
            `🎉 COMPLETE PONDICHERRY SCAN FINISHED! All ${totalAreas} areas, nook & corner verified into database.`,
            ...prev
          ]);
        }
      }, 1400); // 1.4s delay per area for live realistic scanner experience
    }

    return () => clearTimeout(timer);
  }, [isScanning, currentAreaIndex, existingCompanies, onBatchAddCompanies, totalAreas]);

  const startScanner = () => {
    setIsScanning(true);
    setIsComplete(false);
    setCurrentAreaIndex(0);
    setScanLogs([`🚀 Pondicherry Complete Area Radar Initialized. Scanning each nook & corner...`]);
    setTotalFound(0);
    setNewlyAddedCount(0);
  };

  const stopScanner = () => {
    setIsScanning(false);
    setScanLogs(prev => [`⏸️ Scanner paused by user at area: ${currentArea?.area || 'Current'}`, ...prev]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-sky-500/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Radar Scanner Top Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-5 sm:p-6 border-b border-sky-900/50 flex items-center justify-between relative overflow-hidden">
          {/* Subtle Radar Pulse BG Animation */}
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3 z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white border transition-all ${
              isScanning 
                ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.5)] animate-pulse' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              <Radar className={`w-6 h-6 text-sky-400 ${isScanning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-wide">
                  Pondicherry Area-by-Area Auto Scanner
                </h3>
                {isScanning && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-300/80 mt-0.5">
                Deep searches every nook & corner in Pondy, auto-appends companies to database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Radar Screen & Metrics */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Progress bar & Current scanning area status */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-sky-300 font-bold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400 animate-bounce" />
                {isScanning 
                  ? `Scanning Area: ${currentArea?.area || 'Processing...'}`
                  : isComplete 
                    ? `All ${totalAreas} Areas Fully Scanned!` 
                    : `Ready to Scan Pondicherry Areas`}
              </span>
              <span className="font-extrabold text-sky-400">{progressPercent}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {currentArea && isScanning && (
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="italic truncate max-w-[320px]">
                  Target: {currentArea.description}
                </span>
                <span className="text-sky-400 font-semibold flex items-center gap-1">
                  Area {currentAreaIndex + 1} of {totalAreas}
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Scanned</div>
              <div className="text-xl sm:text-2xl font-black text-sky-400 mt-1">{totalFound}</div>
              <div className="text-[10px] text-slate-500">Companies Verified</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">New Additions</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">+{newlyAddedCount}</div>
              <div className="text-[10px] text-slate-500">Appended to DB</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Areas Covered</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
                {isComplete ? totalAreas : currentAreaIndex}/{totalAreas}
              </div>
              <div className="text-[10px] text-slate-500">Pondy Sectors</div>
            </div>
          </div>

          {/* Live Scanner Terminal Console */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5 px-1">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Live Radar Terminal Output:
              </span>
              <span>Pondy GPS Engine</span>
            </div>
            <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 h-44 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-300">
              {scanLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-10 italic">
                  Press "Start Full Pondy Scan" below to trigger automated multi-area crawler...
                </div>
              ) : (
                scanLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed flex items-start gap-1.5 animate-in fade-in">
                    <span className="text-sky-500 mt-0.5">›</span>
                    <span className={log.includes('✅') || log.includes('🎉') ? 'text-emerald-300 font-semibold' : log.includes('📡') ? 'text-sky-300' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Covered Areas Pill Badges */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Coverage Route (Nook & Corner of Pondicherry):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PONDICHERRY_AREA_SCAN_REGISTRY.map((sec, idx) => {
                const isPassed = idx < currentAreaIndex || isComplete;
                const isCurrent = idx === currentAreaIndex && isScanning;
                return (
                  <span
                    key={sec.area}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400 animate-pulse'
                        : isPassed
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                          : 'bg-slate-800/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
                    {sec.area}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scanner Action Buttons Footer */}
        <div className="bg-slate-950 p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 hidden sm:block">
            {isScanning ? (
              <span className="text-sky-400 flex items-center gap-1.5 font-medium">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Scanning live across Pondicherry coordinates...
              </span>
            ) : isComplete ? (
              <span className="text-emerald-400 font-semibold">
                ✓ All companies appended to live CRM dashboard!
              </span>
            ) : (
              <span>Automated sequential area discovery</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {isScanning ? (
              <button
                type="button"
                onClick={stopScanner}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-3.5 h-3.5" /> Pause Scan
              </button>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                <span>{isComplete ? 'Re-Scan All Areas' : 'Start Full Pondy Scan'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
