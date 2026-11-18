import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Plus, 
  Sparkles, 
  Building2, 
  Check, 
  Compass, 
  Loader2 
} from 'lucide-react';
import { CITIES_CONFIG } from '../data/multiCityRegistry';

export default function AddCityModal({
  isOpen,
  onClose,
  existingCities = [],
  onAddNewCity
}) {
  const [cityInput, setCityInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const debounceTimerRef = useRef(null);

  if (!isOpen) return null;

  // Real-time automatic search function
  const executeSearch = async (val) => {
    const queryTerm = val.trim().toLowerCase();
    if (!queryTerm) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setErrorMsg('');

    const matchedResults = [];

    // 1. Instant local matching for presets (Pondicherry, Cuddalore, Coimbatore, Chennai, Madurai, etc.)
    Object.keys(CITIES_CONFIG).forEach(cityKey => {
      const config = CITIES_CONFIG[cityKey];
      const isPondy = (queryTerm.includes('pond') || queryTerm.includes('pudu')) && (cityKey === 'Pondicherry');
      const isGeneral = cityKey.toLowerCase().includes(queryTerm) || queryTerm.includes(cityKey.toLowerCase());

      if (isPondy || isGeneral) {
        matchedResults.push({
          name: cityKey,
          fullName: `${cityKey}, ${config.state || 'India'}`,
          state: config.state || 'India',
          lat: config.centerCoordinates[0],
          lng: config.centerCoordinates[1],
          mainAreas: config.mainAreas
        });
      }
    });

    try {
      const cleanQuery = (queryTerm.includes('pond') || queryTerm.includes('pudu')) ? 'Puducherry' : val.trim();
      const q = encodeURIComponent(`${cleanQuery}, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=5`, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        data.forEach(item => {
          let name = item.address?.city || item.address?.town || item.address?.state_district || item.name || val;
          if (name.toLowerCase().includes('puducherry') || name.toLowerCase().includes('pondicherry') || queryTerm.includes('pond') || queryTerm.includes('pudu')) {
            name = 'Pondicherry';
          } else {
            name = name.charAt(0).toUpperCase() + name.slice(1);
          }
          const state = item.address?.state || 'India';
          if (!matchedResults.some(r => r.name.toLowerCase() === name.toLowerCase())) {
            matchedResults.push({
              name: name,
              fullName: item.display_name,
              state: state,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            });
          }
        });
      }
    } catch (err) {
      console.warn("City search API error:", err);
    }

    if (matchedResults.length === 0 && queryTerm.length >= 2) {
      const isPondy = queryTerm.includes('pond') || queryTerm.includes('pudu');
      const formattedName = isPondy ? 'Pondicherry' : (val.trim().charAt(0).toUpperCase() + val.trim().slice(1));
      matchedResults.push({
        name: formattedName,
        fullName: `${formattedName}, India`,
        state: isPondy ? 'Puducherry UT' : 'India',
        lat: 11.9360,
        lng: 79.8290
      });
    }

    setSearchResults(matchedResults);
    setIsSearching(false);
  };

  // Debounced live typing effect (300ms)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setCityInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const selectAndAddCity = (cityObj) => {
    onAddNewCity(cityObj);
    onClose();
    setCityInput('');
    setSearchResults([]);
  };

  // Popular Pre-configured cities suggestions that aren't yet added
  const popularPresets = Object.keys(CITIES_CONFIG).filter(c => !existingCities.includes(c));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              📍
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">
                Set Active Location
              </h3>
              <p className="text-[11px] text-blue-100">
                Type any city or town to scan IT companies
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

        {/* Search Input Box with Real-time Debounced Auto-Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Type city (e.g. Pondicherry, Madurai, Trichy, Salem)..."
              value={cityInput}
              onChange={handleInputChange}
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500 shadow-xs transition-all"
              autoFocus
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : cityInput ? (
              <button
                type="button"
                onClick={() => {
                  setCityInput('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Quick presets */}
          {popularPresets.length > 0 && !cityInput && (
            <div className="mt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Popular Tech Hubs:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularPresets.map(preset => (
                  <button
                    key={preset}
                    onClick={() => selectAndAddCity({
                      name: preset,
                      state: CITIES_CONFIG[preset]?.state || 'Tamil Nadu',
                      lat: CITIES_CONFIG[preset]?.centerCoordinates[0] || 11.9360,
                      lng: CITIES_CONFIG[preset]?.centerCoordinates[1] || 79.8290,
                      mainAreas: CITIES_CONFIG[preset]?.mainAreas
                    })}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                Found Locations (Click to Set):
              </span>
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => selectAndAddCity(res)}
                  className="w-full text-left p-3 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 truncate">
                        {res.name}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-100 text-slate-600">
                        {res.state}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 pl-5">
                      {res.fullName}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          ) : cityInput ? (
            <div className="text-center py-8 px-4 text-slate-400">
              <p className="text-xs font-bold text-slate-600">Searching...</p>
            </div>
          ) : (
            <div className="text-center py-8 px-4 text-slate-400">
              <Compass className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-600">Type any city name above</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Results appear automatically as you type!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
