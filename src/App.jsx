import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  MapPin, 
  Phone, 
  Navigation, 
  ExternalLink, 
  Download, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Building2,
  FileSpreadsheet,
  Map as MapIcon,
  ChevronRight,
  UserCheck,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { PONDICHERRY_AREA_SCAN_REGISTRY } from './data/areaScannerRegistry';
import { 
  CITIES_CONFIG, 
  CUDDALORE_AREA_SCAN_REGISTRY, 
  COIMBATORE_AREA_SCAN_REGISTRY, 
  CHENNAI_AREA_SCAN_REGISTRY,
  MADURAI_AREA_SCAN_REGISTRY,
  TRICHY_AREA_SCAN_REGISTRY,
  SALEM_AREA_SCAN_REGISTRY,
  BANGALORE_AREA_SCAN_REGISTRY
} from './data/multiCityRegistry';
import { exportToExcel } from './utils/exportUtils';
import RouteMapModal from './components/RouteMapModal';
import ConfirmationModal from './components/ConfirmationModal';
import VisitedHistoryModal from './components/VisitedHistoryModal';
import AddCityModal from './components/AddCityModal';

const CITY_STORAGE_PREFIX = 'multi_city_it_crm_';
const INITIAL_CITIES = ["Pondicherry", "Cuddalore", "Coimbatore", "Chennai", "Madurai", "Trichy", "Salem", "Bangalore"];

const getCityRegistry = (cityName, customCityConfigs = {}) => {
  switch (cityName) {
    case 'Cuddalore':
      return CUDDALORE_AREA_SCAN_REGISTRY;
    case 'Coimbatore':
      return COIMBATORE_AREA_SCAN_REGISTRY;
    case 'Chennai':
      return CHENNAI_AREA_SCAN_REGISTRY;
    case 'Madurai':
      return MADURAI_AREA_SCAN_REGISTRY;
    case 'Trichy':
      return TRICHY_AREA_SCAN_REGISTRY;
    case 'Salem':
      return SALEM_AREA_SCAN_REGISTRY;
    case 'Bangalore':
      return BANGALORE_AREA_SCAN_REGISTRY;
    case 'Pondicherry':
      return PONDICHERRY_AREA_SCAN_REGISTRY;
    default:
      // Return custom configured registry or synthetic area scanner
      if (customCityConfigs[cityName]?.scanRegistry) {
        return customCityConfigs[cityName].scanRegistry;
      }
      return [
        {
          area: `${cityName} Tech Corridor`,
          description: `IT & Software Companies in ${cityName}`,
          coordinates: customCityConfigs[cityName]?.centerCoordinates || [11.9360, 79.8290],
          companies: [
            {
              id: `comp-${cityName.toLowerCase().slice(0,3)}-1`,
              name: `${cityName} Infotech Solutions`,
              city: cityName,
              area: `${cityName} Central`,
              category: "Software Development & Cloud Services",
              building: "City Center Commercial Tech Complex",
              address: `Main Road, ${cityName} City Center`,
              phone: "+91 9840012345",
              email: `info@${cityName.toLowerCase()}infotech.com`,
              website: `https://${cityName.toLowerCase()}infotech.com`,
              mapsQuery: `IT companies ${cityName}`,
              lat: (customCityConfigs[cityName]?.centerCoordinates?.[0] || 11.9360) + 0.002,
              lng: (customCityConfigs[cityName]?.centerCoordinates?.[1] || 79.8290) + 0.002,
              techStack: ["React", "Python", "Full Stack", "Cloud"],
              callingStatus: "Not Called",
              visitStatus: "Yet to Visit",
              contactPerson: "Branch Operations",
              notes: `Key software provider in ${cityName}.`,
              updatedAt: "2026-11-18"
            }
          ]
        }
      ];
  }
};

const getInitialCityData = (cityName, customCityConfigs = {}) => {
  try {
    const saved = localStorage.getItem(`${CITY_STORAGE_PREFIX}${cityName.toLowerCase()}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  const registry = getCityRegistry(cityName, customCityConfigs);
  const initialList = [];
  registry.forEach(sec => {
    sec.companies.forEach(comp => {
      initialList.push({ ...comp, isCompleted: false, city: comp.city || cityName });
    });
  });
  return initialList;
};

export default function App() {
  const [cityList, setCityList] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_added_it_cities_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CITIES;
  });

  const [customCityConfigs, setCustomCityConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_city_configs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('last_selected_it_city') || 'Pondicherry';
  });

  const [companies, setCompanies] = useState(() => {
    const initCity = localStorage.getItem('last_selected_it_city') || 'Pondicherry';
    let savedConfigs = {};
    try {
      const saved = localStorage.getItem('custom_city_configs_v1');
      if (saved) savedConfigs = JSON.parse(saved);
    } catch (e) {}
    return getInitialCityData(initCity, savedConfigs);
  });

  const [isScanning, setIsScanning] = useState(false);
  const [currentArea, setCurrentArea] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [hideDone, setHideDone] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
  const [focusTargetForMap, setFocusTargetForMap] = useState(null);
  const [lastVisitedAction, setLastVisitedAction] = useState(null); // For Instant Undo Toast notification
  const [userLocation, setUserLocation] = useState(null);

  // Live User Location for Table Distance Sorting
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Table GPS location:", err);
          setUserLocation([11.9360, 79.8290]); // fallback to Pondicherry center
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Distance formula (KM)
  const calculateDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Save custom added cities
  useEffect(() => {
    localStorage.setItem('custom_added_it_cities_v1', JSON.stringify(cityList));
  }, [cityList]);

  useEffect(() => {
    localStorage.setItem('custom_city_configs_v1', JSON.stringify(customCityConfigs));
  }, [customCityConfigs]);

  // Confirmation Modal State (No native alert!)
  const [confirmModalData, setConfirmModalData] = useState({
    isOpen: false,
    title: '',
    message: '',
    company: null,
    onConfirm: () => {},
    type: 'primary'
  });

  // Mobile Quick Action Drawer for Table
  const [activeMobileCompany, setActiveMobileCompany] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempContact, setTempContact] = useState('');

  // Save selected city preference
  useEffect(() => {
    localStorage.setItem('last_selected_it_city', selectedCity);
  }, [selectedCity]);

  // Auto-save city's companies to its dedicated LocalStorage partition
  useEffect(() => {
    try {
      localStorage.setItem(`${CITY_STORAGE_PREFIX}${selectedCity.toLowerCase()}`, JSON.stringify(companies));
    } catch (e) {
      console.error(e);
    }
  }, [companies, selectedCity]);

  // Handle City Change
  const handleCityChange = (newCity) => {
    if (newCity === selectedCity) return;
    setSelectedCity(newCity);
    setSelectedArea('All Areas');
    setSearch('');
    const loadedData = getInitialCityData(newCity, customCityConfigs);
    setCompanies(loadedData);
  };

  // Add Any Searched City to Application
  const handleAddNewCity = (cityObj) => {
    const cityName = cityObj.name;
    if (!cityList.includes(cityName)) {
      setCityList(prev => [...prev, cityName]);
    }
    const updatedConfigs = {
      ...customCityConfigs,
      [cityName]: {
        name: cityName,
        state: cityObj.state || 'India',
        centerCoordinates: [cityObj.lat, cityObj.lng],
        zoom: 13,
        mainAreas: cityObj.mainAreas || ["All Areas", `${cityName} Central`, `${cityName} IT Corridor`, `${cityName} Bypass`]
      }
    };
    setCustomCityConfigs(updatedConfigs);
    setSelectedCity(cityName);
    setSelectedArea('All Areas');
    setSearch('');

    const loadedData = getInitialCityData(cityName, updatedConfigs);
    setCompanies(loadedData);
  };

  // Sync scan for new additions in the ACTIVE SELECTED CITY
  const startIncrementalScan = async () => {
    setIsScanning(true);
    setProgressIndex(0);

    let currentList = [...companies];
    const existingNames = new Set(currentList.map(c => c.name.toLowerCase().trim()));
    const activeRegistry = getCityRegistry(selectedCity, customCityConfigs);

    for (let i = 0; i < activeRegistry.length; i++) {
      const areaData = activeRegistry[i];
      setCurrentArea(areaData.area);
      setProgressIndex(i + 1);

      await new Promise(r => setTimeout(r, 220));

      areaData.companies.forEach(incoming => {
        if (!existingNames.has(incoming.name.toLowerCase().trim())) {
          currentList.push({ ...incoming, isCompleted: false, city: incoming.city || selectedCity });
          existingNames.add(incoming.name.toLowerCase().trim());
        }
      });

      setCompanies([...currentList]);
    }

    setIsScanning(false);
    setCurrentArea(`${selectedCity} Scanned!`);
  };

  // Safe Professional Modal Confirmation for Toggle Done
  const triggerToggleDone = (c) => {
    if (!c.isCompleted) {
      // Opening Professional In-Theme Modal instead of crude alert()
      setConfirmModalData({
        isOpen: true,
        title: "Mark as Visited & Strike-Off?",
        company: c,
        message: "This company will be struck off from your active checklist. You can always uncheck it anytime to restore.",
        type: "primary",
        onConfirm: () => {
          executeToggle(c.id, true);
        }
      });
    } else {
      executeToggle(c.id, false);
    }
  };

  const executeToggle = (id, nextState) => {
    let affectedCompany = companies.find(c => c.id === id);
    setCompanies(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isCompleted: nextState,
          visitStatus: nextState ? 'Direct Visit Completed - Met HR/Manager' : 'Yet to Visit'
        };
      }
      return item;
    }));

    if (activeMobileCompany && activeMobileCompany.id === id) {
      setActiveMobileCompany(prev => ({
        ...prev,
        isCompleted: nextState,
        visitStatus: nextState ? 'Direct Visit Completed - Met HR/Manager' : 'Yet to Visit'
      }));
    }

    if (nextState && affectedCompany) {
      setLastVisitedAction({
        company: affectedCompany,
        timestamp: Date.now()
      });
    } else {
      setLastVisitedAction(null);
    }
  };

  const handleInstantUndo = () => {
    if (lastVisitedAction && lastVisitedAction.company) {
      executeToggle(lastVisitedAction.company.id, false);
      setLastVisitedAction(null);
    }
  };

  const handleUpdateStatus = (id, field, val) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleSaveNotes = (id) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, notes: tempNotes, contactPerson: tempContact } : c));
    setEditingNotesId(null);
  };

  const triggerResetAll = () => {
    setConfirmModalData({
      isOpen: true,
      title: `Reset ${selectedCity} Directory?`,
      company: null,
      message: `Are you sure you want to reset all records for ${selectedCity} back to default? Any custom strike-offs or notes will be cleared.`,
      type: "danger",
      onConfirm: () => {
        const registry = getCityRegistry(selectedCity);
        const initialList = [];
        registry.forEach(sec => {
          sec.companies.forEach(comp => {
            initialList.push({ ...comp, isCompleted: false, city: comp.city || selectedCity });
          });
        });
        setCompanies(initialList);
        localStorage.setItem(`${CITY_STORAGE_PREFIX}${selectedCity.toLowerCase()}`, JSON.stringify(initialList));
      }
    });
  };

  // Filtered & Distance-sorted list based on user location
  const filtered = useMemo(() => {
    let list = companies.filter(c => {
      if (hideDone && c.isCompleted) return false;
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q) || (c.techStack && c.techStack.join(' ').toLowerCase().includes(q));
      const matchArea = selectedArea === 'All Areas' || c.area.toLowerCase().includes(selectedArea.toLowerCase());
      return matchQ && matchArea;
    });

    // Compute live distance from user position
    const refPoint = userLocation || [11.9360, 79.8290];
    list = list.map(c => {
      const dist = (c.lat && c.lng) 
        ? calculateDist(refPoint[0], refPoint[1], c.lat, c.lng) 
        : 99999;
      return { ...c, distanceKm: dist };
    });

    // Sort: Nearest to user location first! (Unvisited first, then visited at bottom if not hidden)
    list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.distanceKm - b.distanceKm;
    });

    return list;
  }, [companies, hideDone, search, selectedArea, userLocation]);

  const completedCount = companies.filter(c => c.isCompleted).length;
  const pendingCount = companies.length - completedCount;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. STICKY TOP NAVBAR (NEVER SCROLLS AWAY) */}
      <header className="bg-white border-b border-slate-200 px-2 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-2 z-40 flex-shrink-0 shadow-xs">
        {/* Left: Active Location Button (Single tap to search/change) */}
        <div className="flex items-center min-w-0">
          <button
            onClick={() => setIsAddCityModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 active:scale-95 border border-slate-300 hover:border-blue-400 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all text-left"
            title="Click to search and change location"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-black text-slate-900 tracking-tight">
              {selectedCity}
            </span>
            <span className="text-[10px] font-bold text-blue-600 underline">
              change
            </span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* MAP ROUTE BUTTON */}
          <button
            onClick={() => {
              setFocusTargetForMap(null);
              setIsMapModalOpen(true);
            }}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-[11px] sm:text-xs shadow-sm flex items-center gap-1 transition-all"
            title="Open Road Route Navigation"
          >
            <span>🗺️</span>
            <span className="hidden sm:inline">MAP</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-[10px] font-black">{pendingCount}</span>
          </button>

          {/* VISITED HISTORY BUTTON */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            title="View Visited Companies History & Undo"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="hidden md:inline">Visited</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">{completedCount}</span>
          </button>

          {/* SYNC / SCAN BUTTON */}
          <button
            onClick={startIncrementalScan}
            disabled={isScanning}
            className={`p-1.5 sm:px-2.5 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              isScanning 
                ? 'bg-amber-600 text-white cursor-not-allowed animate-pulse' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Scan for new IT companies"
          >
            <Radar className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">{isScanning ? `${currentArea}...` : 'SCAN'}</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportToExcel(companies)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </button>

          {/* Reset Button */}
          <button
            onClick={triggerResetAll}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 border border-slate-200"
            title="Reset directory"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* 2. STICKY TOP FILTER BAR (NEVER SCROLLS AWAY) */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 z-30 flex-shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Search Box */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company, tech, area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-colors"
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

          <div className="flex items-center gap-2">
            {/* Area Filter */}
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold py-1.5 px-2.5 rounded-xl outline-none cursor-pointer"
            >
              {(customCityConfigs[selectedCity]?.mainAreas || CITIES_CONFIG[selectedCity]?.mainAreas || ["All Areas"]).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Hide Visited Checkbox */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={e => setHideDone(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
              <span className="font-semibold text-[11px]">Hide ({completedCount})</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. SCROLLABLE TABLE AREA WITH FROZEN / STICKY TABLE HEADER */}
      <main className="flex-1 overflow-hidden p-3 sm:p-5 max-w-7xl w-full mx-auto flex flex-col">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
          {/* Internal Scroll Container for Table Rows */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* STICKY THEAD - Table scroll panna kooda header maraiyaave marayathu! */}
              <thead className="sticky top-0 z-20 shadow-xs bg-slate-100/95 backdrop-blur-md">
                <tr className="text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-1.5 w-7 text-center bg-slate-100/95">Done</th>
                  <th className="py-2.5 px-1 w-6 text-center bg-slate-100/95">#</th>
                  <th className="py-2.5 px-3 min-w-[200px] bg-slate-100/95">Company Name & Area</th>
                  <th className="py-2.5 px-2.5 min-w-[130px] hidden md:table-cell bg-slate-100/95">Calling Status</th>
                  <th className="py-2.5 px-2.5 min-w-[130px] hidden md:table-cell bg-slate-100/95">Visit Status</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[145px] bg-slate-100/95">Phone Number</th>
                  <th className="py-2.5 px-2.5 text-center min-w-[100px] bg-slate-100/95">Actions</th>
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
                      key={c.id || idx} 
                      className={`transition-all duration-150 ${
                        isDone 
                          ? 'bg-slate-50/70 opacity-45 select-none grayscale' 
                          : 'hover:bg-blue-50/40 cursor-pointer'
                      }`}
                      onClick={(e) => {
                        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('select')) {
                          return;
                        }
                        setActiveMobileCompany(c);
                      }}
                    >
                      {/* Done Checkbox - Compact & Tight */}
                      <td className="py-2.5 px-1.5 w-7 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => triggerToggleDone(c)}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                          title="Click to toggle visited status"
                        />
                      </td>

                      {/* Index */}
                      <td className="py-2.5 px-1 w-6 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Company Name & Area */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-sm ${
                            isDone ? 'line-through text-slate-400 decoration-rose-500 decoration-2' : 'text-slate-900'
                          }`}>
                            {c.name}
                          </span>
                          <span className="md:hidden text-[10px] text-blue-600 font-bold ml-1">
                            Details ›
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                            isDone 
                              ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {c.area}
                          </span>
                          {c.distanceKm !== undefined && c.distanceKm < 9999 && (
                            <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded font-mono">
                              📍 ~{c.distanceKm.toFixed(1)} km
                            </span>
                          )}
                          {c.notes && (
                            <span className="text-[10px] text-emerald-600 font-semibold truncate max-w-[130px]">
                              📝 {c.notes}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[210px] sm:max-w-none mt-0.5" title={c.address}>
                          📍 {c.address}
                        </div>
                      </td>

                      {/* Desktop Calling Status */}
                      <td className="py-2.5 px-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={isDone}
                          value={c.callingStatus || 'Not Called'}
                          onChange={e => handleUpdateStatus(c.id, 'callingStatus', e.target.value)}
                          className="w-full py-1.5 px-2 rounded-lg border text-xs font-semibold bg-white border-slate-300"
                        >
                          <option value="Not Called">Not Called</option>
                          <option value="Called - Follow Up Needed">Follow Up Needed</option>
                          <option value="Called - Positive / Interview Scheduled">Positive / Interview</option>
                          <option value="Called - Not Hiring / Rejected">Not Hiring</option>
                          <option value="No Answer / Switched Off">No Answer</option>
                        </select>
                      </td>

                      {/* Desktop Visit Status */}
                      <td className="py-2.5 px-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={isDone}
                          value={c.visitStatus || 'Yet to Visit'}
                          onChange={e => handleUpdateStatus(c.id, 'visitStatus', e.target.value)}
                          className="w-full py-1.5 px-2 rounded-lg border text-xs font-semibold bg-white border-slate-300"
                        >
                          <option value="Yet to Visit">Yet to Visit</option>
                          <option value="Direct Visit Completed - Met HR/Manager">Direct Visited (Met HR)</option>
                          <option value="Office Found & Verified">Office Verified</option>
                          <option value="Office Shifted / Not at this Address">Office Shifted</option>
                        </select>
                      </td>

                      {/* Phone - Single line nowrap, clean spacing */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                            className={`font-extrabold text-xs inline-flex items-center gap-1.5 ${
                              isDone ? 'text-slate-400 line-through' : 'text-emerald-700 hover:text-emerald-800'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-mono tracking-tight">{c.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No phone</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {c.phone && (
                            <a
                              href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                              className={`p-1.5 rounded-lg ${
                                isDone ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-100 text-emerald-800'
                              }`}
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-lg ${
                              isDone ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-100 text-blue-800'
                            }`}
                            title="Google Maps"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setActiveMobileCompany(c)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="View Options & Notes"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
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

      {/* MOBILE POPUP / BOTTOM DRAWER FOR COMPANY CLICK IN TABLE */}
      {activeMobileCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200 flex flex-col max-h-[85vh] mb-0 sm:mb-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/20 text-white">
                    📍 {activeMobileCompany.area}
                  </span>
                  {activeMobileCompany.isCompleted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400 text-emerald-950">
                      ✓ Visited
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-base leading-snug break-words">
                  {activeMobileCompany.name}
                </h3>
                <p className="text-xs text-blue-100 truncate mt-0.5">
                  {activeMobileCompany.address}
                </p>
              </div>
              <button
                onClick={() => setActiveMobileCompany(null)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Status Options */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
              {/* Quick Dial & Maps Nav Row */}
              <div className="grid grid-cols-2 gap-2">
                {activeMobileCompany.phone ? (
                  <a
                    href={`tel:${activeMobileCompany.phone.replace(/[^0-9+]/g, '')}`}
                    className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center truncate"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Call Now</span>
                  </a>
                ) : (
                  <button disabled className="py-2.5 px-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs text-center cursor-not-allowed">
                    No Phone
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeMobileCompany.mapsQuery || `${activeMobileCompany.name} ${activeMobileCompany.area} Pondicherry`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center truncate"
                >
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Google Maps</span>
                </a>
              </div>

              {/* Calling Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Calling Status:
                </label>
                <select
                  value={activeMobileCompany.callingStatus || 'Not Called'}
                  onChange={e => {
                    handleUpdateStatus(activeMobileCompany.id, 'callingStatus', e.target.value);
                    setActiveMobileCompany(prev => ({ ...prev, callingStatus: e.target.value }));
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold bg-slate-50 outline-none"
                >
                  <option value="Not Called">Not Called</option>
                  <option value="Called - Follow Up Needed">Called - Follow Up Needed</option>
                  <option value="Called - Positive / Interview Scheduled">Called - Positive / Interview</option>
                  <option value="Called - Not Hiring / Rejected">Called - Not Hiring</option>
                  <option value="No Answer / Switched Off">No Answer / Switched Off</option>
                </select>
              </div>

              {/* Physical Visit Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Physical Visit Status:
                </label>
                <select
                  value={activeMobileCompany.visitStatus || 'Yet to Visit'}
                  onChange={e => {
                    handleUpdateStatus(activeMobileCompany.id, 'visitStatus', e.target.value);
                    setActiveMobileCompany(prev => ({ ...prev, visitStatus: e.target.value }));
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold bg-slate-50 outline-none"
                >
                  <option value="Yet to Visit">Yet to Visit</option>
                  <option value="Direct Visit Completed - Met HR/Manager">Direct Visit Completed - Met HR</option>
                  <option value="Office Found & Verified">Office Found & Verified</option>
                  <option value="Office Shifted / Not at this Address">Office Shifted / Not at this Address</option>
                </select>
              </div>

              {/* Editable Notes & HR Details */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-[11px] text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    HR Contact & Notes
                  </span>
                  {editingNotesId !== activeMobileCompany.id && (
                    <button
                      onClick={() => {
                        setEditingNotesId(activeMobileCompany.id);
                        setTempNotes(activeMobileCompany.notes || '');
                        setTempContact(activeMobileCompany.contactPerson || '');
                      }}
                      className="text-blue-600 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Notes
                    </button>
                  )}
                </div>

                {editingNotesId === activeMobileCompany.id ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="HR Name / Contact..."
                      value={tempContact}
                      onChange={e => setTempContact(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none"
                    />
                    <textarea
                      rows={2}
                      placeholder="Interview or visit notes..."
                      value={tempNotes}
                      onChange={e => setTempNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-2.5 py-1 text-slate-500 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleSaveNotes(activeMobileCompany.id);
                          setActiveMobileCompany(prev => ({
                            ...prev,
                            notes: tempNotes,
                            contactPerson: tempContact
                          }));
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-800 font-semibold mb-1">
                      {activeMobileCompany.contactPerson || <span className="text-slate-400 italic">No contact specified</span>}
                    </p>
                    <p className="text-slate-600 italic">
                      {activeMobileCompany.notes || 'No notes added yet. Tap "Edit Notes" to write.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Big Visited Toggle Button with Direct Update & Auto-Close Drawer */}
              <button
                onClick={() => {
                  const targetComp = activeMobileCompany;
                  executeToggle(targetComp.id, !targetComp.isCompleted);
                  setActiveMobileCompany(null);
                }}
                className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                  activeMobileCompany.isCompleted
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{activeMobileCompany.isCompleted ? 'Uncheck Visited (Re-enable)' : 'Mark as Visited ✓'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Real Road Map Modal */}
      <RouteMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setFocusTargetForMap(null);
        }}
        companies={companies}
        focusCompany={focusTargetForMap}
        activeCity={selectedCity}
        cityAreas={customCityConfigs[selectedCity]?.mainAreas || CITIES_CONFIG[selectedCity]?.mainAreas || []}
        onToggleComplete={(id) => {
          const comp = companies.find(c => c.id === id);
          if (comp) {
            executeToggle(id, !comp.isCompleted);
          }
        }}
      />

      {/* Visited Companies History Modal */}
      <VisitedHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        companies={companies}
        onUndoVisited={(comp) => {
          executeToggle(comp.id, false);
        }}
        onOpenMapForCompany={(comp) => {
          setFocusTargetForMap(comp);
          setIsMapModalOpen(true);
        }}
      />

      {/* Add Any City / Town Modal */}
      <AddCityModal
        isOpen={isAddCityModalOpen}
        onClose={() => setIsAddCityModalOpen(false)}
        existingCities={cityList}
        onAddNewCity={handleAddNewCity}
      />

      {/* Instant Undo Toast Notification when accidentally visited */}
      {lastVisitedAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-medium truncate max-w-[200px] sm:max-w-xs">
            Marked <span className="font-bold text-emerald-400">"{lastVisitedAction.company.name}"</span> as visited
          </span>
          <button
            onClick={handleInstantUndo}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>UNDO</span>
          </button>
          <button
            onClick={() => setLastVisitedAction(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Professional In-Theme Confirmation Modal (No Browser Default Alert!) */}
      <ConfirmationModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        companyName={confirmModalData.company?.name}
        message={confirmModalData.message}
        confirmText="Yes, Confirm"
        cancelText="Cancel"
        type={confirmModalData.type}
        onConfirm={confirmModalData.onConfirm}
        onClose={() => setConfirmModalData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
