import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Navigation, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Compass, 
  Route, 
  Building2, 
  LocateFixed,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ConfirmationModal from './ConfirmationModal';

// Fix Leaflet Default Icon Path in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Vibrant Custom Google Maps Pin Factory
const createGoogleMapsPin = (number, isSelectedArea, isFirstStop, isVisited) => {
  const bg = isVisited
    ? '#059669' // Visited = Distinct Emerald Green
    : isFirstStop 
      ? '#ea580c' // NEXT STOP = Vibrant Deep Orange / Amber
      : isSelectedArea 
        ? '#8b5cf6' 
        : '#2563eb'; // Other unvisited = Blue

  const size = isFirstStop ? 36 : 28;
  const anchorY = isFirstStop ? 36 : 28;
  const anchorX = isFirstStop ? 18 : 14;

  return L.divIcon({
    className: 'custom-google-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; pointer-events: none;">
        ${isFirstStop && !isVisited ? `
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #f97316;
            opacity: 0.35;
            pointer-events: none;
          "></div>
        ` : ''}
        <div style="
          background: ${bg};
          border: ${isFirstStop ? '3px solid #ffffff' : '2px solid #ffffff'};
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          color: #ffffff;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          cursor: pointer;
        ">
          <span style="
            transform: rotate(45deg);
            font-weight: 900;
            font-size: ${isVisited ? '14px' : (isFirstStop ? '13px' : '11px')};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            pointer-events: none;
          ">${isVisited ? '✓' : number}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, -anchorY - 2]
  });
};

// LIVE MOVING GPS USER PIN
const userLocationIcon = L.divIcon({
  className: 'user-live-moving-pin',
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #0284c7;
        opacity: 0.35;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #0ea5e9;
        opacity: 0.25;
      "></div>
      <div style="
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #0284c7;
        border: 3.5px solid #ffffff;
        box-shadow: 0 0 12px rgba(2, 132, 199, 0.9), 0 3px 8px rgba(0,0,0,0.4);
        z-index: 20;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Component to dynamically animate map center and maintain proper size on viewport change
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size immediately so zoom & container resizes never distort pin alignments
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Distance formula (KM)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const PONDY_MAIN_AREAS = [
  "All Areas",
  "White Town",
  "Heritage Town",
  "Lawspet",
  "Pakkumudayanpet",
  "Mudaliarpet",
  "Ellaipillaichavady",
  "Reddiarpalayam",
  "Villianur",
  "Kalapet"
];

export default function RouteMapModal({ 
  isOpen, 
  onClose, 
  companies, 
  onToggleComplete,
  focusCompany = null,
  activeCity = 'Pondicherry',
  cityAreas = []
}) {
  const [showRoadRoute, setShowRoadRoute] = useState(true);
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Locating Live GPS...');
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState([11.9360, 79.8290]);
  const [mapZoom, setMapZoom] = useState(14);
  const [nextStopRoadGeometry, setNextStopRoadGeometry] = useState([]);
  const [subsequentRoadGeometry, setSubsequentRoadGeometry] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedCompanyForAction, setSelectedCompanyForAction] = useState(null);
  const [pinnedDirectTarget, setPinnedDirectTarget] = useState(null);

  // If focusCompany is passed from Visited list or external, pin it directly!
  useEffect(() => {
    if (focusCompany && focusCompany.lat && focusCompany.lng) {
      setPinnedDirectTarget(focusCompany);
      setSelectedCompanyForAction(focusCompany);
      setMapCenter([focusCompany.lat, focusCompany.lng]);
      setMapZoom(16);
    }
  }, [focusCompany, isOpen]);

  // Professional Confirmation Modal State for Map
  const [confirmModalData, setConfirmModalData] = useState({
    isOpen: false,
    company: null
  });

  // REAL-TIME CONTINUOUS LIVE GPS TRACKING (watchPosition)
  useEffect(() => {
    if (!isOpen) return;

    let watchId;
    if (navigator.geolocation) {
      setIsLocating(true);
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setIsLocating(false);
          setLocationStatus("Live Tracking Active 🟢");
        },
        (err) => {
          console.warn("GPS tracking warning:", err);
          setIsLocating(false);
          setLocationStatus("GPS Blocked / Using Pondy Center");
          setUserLocation(prev => prev || [11.9350, 79.8250]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOpen]);

  const recenterGPS = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(16);
    }
  };

  // Filter active companies and also include visited companies so both are visible on the map!
  const mapCompanies = useMemo(() => {
    return companies.filter(c => c.lat && c.lng);
  }, [companies]);

  // Nearest Stop Order Algorithm from user's live position (unvisited stops get numbered steps)
  const orderedRoute = useMemo(() => {
    const unvisited = mapCompanies.filter(c => !c.isCompleted);
    if (unvisited.length === 0) return [];

    let startPoint = userLocation || [11.9350, 79.8250];
    let remaining = [...unvisited];
    let route = [];

    // If a direct target was chosen (e.g. from visited list or manually clicked)
    if (pinnedDirectTarget && !pinnedDirectTarget.isCompleted) {
      const idx = remaining.findIndex(c => c.id === pinnedDirectTarget.id);
      if (idx !== -1) {
        const target = remaining[idx];
        const dist = calculateDistance(startPoint[0], startPoint[1], target.lat, target.lng);
        route.push({
          ...target,
          stepNumber: 1,
          distanceFromPrev: dist.toFixed(2),
          isDirectTarget: true
        });
        remaining.splice(idx, 1);
      }
    }

    let currentLat = route.length > 0 ? route[0].lat : startPoint[0];
    let currentLng = route.length > 0 ? route[0].lng : startPoint[1];

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = calculateDistance(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextTarget = remaining[nearestIdx];
      route.push({
        ...nextTarget,
        stepNumber: route.length + 1,
        distanceFromPrev: minDistance.toFixed(2)
      });

      currentLat = nextTarget.lat;
      currentLng = nextTarget.lng;
      remaining.splice(nearestIdx, 1);
    }

    return route;
  }, [mapCompanies, userLocation, pinnedDirectTarget]);

  // Combine ordered unvisited stops with visited stops for map display
  const allDisplayStops = useMemo(() => {
    const visitedStops = mapCompanies
      .filter(c => c.isCompleted)
      .map(c => ({
        ...c,
        isCompleted: true,
        stepNumber: null
      }));
    return [...orderedRoute, ...visitedStops];
  }, [orderedRoute, mapCompanies]);

  useEffect(() => {
    if (orderedRoute.length > 0 && !selectedCompanyForAction) {
      setSelectedCompanyForAction(orderedRoute[0]);
    }
  }, [orderedRoute]);

  // DUAL-COLOR ROAD ROUTING:
  useEffect(() => {
    if (!showRoadRoute || orderedRoute.length === 0) {
      setNextStopRoadGeometry([]);
      setSubsequentRoadGeometry([]);
      return;
    }

    const fetchRealRoadRoutes = async () => {
      setIsLoadingRoute(true);
      try {
        const startPoint = userLocation || [11.9350, 79.8250];
        const nextTarget = orderedRoute[0];

        // 1. Route to immediate Next Stop (#1)
        const nextStopUrl = `https://router.project-osrm.org/route/v1/driving/${startPoint[1]},${startPoint[0]};${nextTarget.lng},${nextTarget.lat}?overview=full&geometries=geojson`;
        const res1 = await fetch(nextStopUrl);
        const data1 = await res1.json();

        if (data1.code === 'Ok' && data1.routes && data1.routes[0]) {
          const latLngs = data1.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setNextStopRoadGeometry(latLngs);
        } else {
          setNextStopRoadGeometry([[startPoint[0], startPoint[1]], [nextTarget.lat, nextTarget.lng]]);
        }

        // 2. Route between subsequent stops (1 -> 2 -> 3 -> ...)
        if (orderedRoute.length > 1) {
          const stopsToRoute = orderedRoute.slice(0, 12);
          const coordinatesQuery = stopsToRoute.map(c => `${c.lng},${c.lat}`).join(';');
          const subsequentUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=geojson`;
          const res2 = await fetch(subsequentUrl);
          const data2 = await res2.json();

          if (data2.code === 'Ok' && data2.routes && data2.routes[0]) {
            const latLngs2 = data2.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setSubsequentRoadGeometry(latLngs2);
          } else {
            setSubsequentRoadGeometry(stopsToRoute.map(c => [c.lat, c.lng]));
          }
        } else {
          setSubsequentRoadGeometry([]);
        }
      } catch (err) {
        console.warn("OSRM road routing fallback", err);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRealRoadRoutes();
  }, [orderedRoute, userLocation, showRoadRoute]);

  if (!isOpen) return null;

  // Direct instant mark visited on map
  const executeMarkVisitedDirectly = (comp) => {
    if (!comp) return;
    
    // Toggle completed state in parent master state
    onToggleComplete(comp.id);

    // Keep the current company selected so user directly sees it turn GREEN ("Visited ✓")!
    const nextCompletedState = !comp.isCompleted;
    setSelectedCompanyForAction({
      ...comp,
      isCompleted: nextCompletedState
    });
  };

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    if (area === 'All Areas') {
      setMapCenter([11.9360, 79.8290]);
      setMapZoom(14);
    } else {
      const match = activeCompanies.find(c => c.area.toLowerCase().includes(area.toLowerCase()));
      if (match) {
        setMapCenter([match.lat, match.lng]);
        setMapZoom(16);
      }
    }
  };

  const nextStopCompany = orderedRoute.length > 0 ? orderedRoute[0] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Mobile Clean Header */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 shadow-xs z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs flex-shrink-0 font-black text-xs">
            🧭
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-1.5">
              <span>Road Navigation</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300">
                Next: {nextStopCompany ? `#1 ${nextStopCompany.area}` : 'Done'}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{locationStatus}</span>
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Road Route Toggle */}
          <label className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRoadRoute}
              onChange={e => setShowRoadRoute(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer rounded"
            />
            <span className="text-[11px]">Road</span>
          </label>

          {/* Locate Me (Recenter to live GPS) */}
          <button
            onClick={recenterGPS}
            className="p-1.5 px-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
            title="Recenter to my live position"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] hidden sm:inline">My GPS</span>
          </button>

          {/* Area Dropdown */}
          <select
            value={selectedArea}
            onChange={e => handleAreaChange(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-bold py-1.5 px-1.5 rounded-xl outline-none cursor-pointer max-w-[110px] sm:max-w-none shadow-xs"
          >
            {(cityAreas.length > 0 ? cityAreas : PONDY_MAIN_AREAS).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-100">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <ZoomControl position="topright" />

          {/* Standard Clean OpenStreetMap Roads Tile */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Real-time Moving User Live GPS Pin */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <span className="font-extrabold text-blue-700 block text-sm">📍 You Are Here (Live Tracking)</span>
                  <span className="text-[11px] text-slate-500">Updates live as you walk or drive</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 1. NEXT STOP ROAD ROUTE - DISTINCT VIBRANT ORANGE / AMBER ROUTE LINE */}
          {showRoadRoute && nextStopRoadGeometry.length > 1 && (
            <Polyline
              positions={nextStopRoadGeometry}
              pathOptions={{
                color: '#f97316', // Vibrant Orange Next Stop Route
                weight: 6,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
          )}

          {/* 2. SUBSEQUENT STOPS ROAD ROUTE - CLASSIC GOOGLE MAPS BLUE */}
          {showRoadRoute && subsequentRoadGeometry.length > 1 && (
            <Polyline
              positions={subsequentRoadGeometry}
              pathOptions={{
                color: '#3b82f6',
                weight: 4,
                opacity: 0.65,
                dashArray: '8, 8',
                lineJoin: 'round'
              }}
            />
          )}

          {/* Markers: Next stop is Golden-Orange, other unvisited are Blue, visited are Green ✓ */}
          {allDisplayStops.map((comp) => {
            const isSelectedArea = selectedArea !== 'All Areas' && comp.area.toLowerCase().includes(selectedArea.toLowerCase());
            const isFirstStop = comp.stepNumber === 1 && !comp.isCompleted;
            const isVisited = !!comp.isCompleted;
            const pinIcon = createGoogleMapsPin(comp.stepNumber, isSelectedArea, isFirstStop, isVisited);

            return (
              <Marker
                key={comp.id}
                position={[comp.lat, comp.lng]}
                icon={pinIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedCompanyForAction(comp);
                    setMapCenter([comp.lat, comp.lng]);
                  }
                }}
              >
                <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                  <span className="text-xs font-bold text-slate-900">
                    {isVisited 
                      ? `✅ VISITED: ${comp.name}` 
                      : (isFirstStop ? '⭐ NEXT TARGET: ' : `#${comp.stepNumber}: `) + comp.name}
                  </span>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Dynamic Route Legend */}
        <div className="absolute top-2 left-2 z-[999] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm px-2.5 py-1.5 flex items-center gap-2.5 text-[11px] font-bold text-slate-700 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white"></span>
            <span>You</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-black">1</span>
            <span className="text-orange-700 font-black">Next Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">2+</span>
            <span className="text-slate-600">Pending</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">✓</span>
            <span className="text-emerald-700 font-black">Visited</span>
          </span>
        </div>
      </div>

      {/* MOBILE BOTTOM ACTION DRAWER */}
      {selectedCompanyForAction && (() => {
        // Look up the freshest live data from companies array
        const liveCompany = companies.find(c => c.id === selectedCompanyForAction.id) || selectedCompanyForAction;
        const isCurrentVisited = !!liveCompany.isCompleted;

        return (
          <div className="bg-white border-t border-slate-200 p-3 sm:px-6 shadow-2xl z-30 animate-in slide-in-from-bottom-5 duration-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      isCurrentVisited
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : liveCompany.stepNumber === 1
                          ? 'bg-orange-100 text-orange-900 border border-orange-300 animate-pulse'
                          : 'bg-blue-100 text-blue-900'
                    }`}>
                      {isCurrentVisited
                        ? '✅ VISITED'
                        : liveCompany.stepNumber === 1
                          ? '⭐ NEXT TARGET'
                          : `STOP #${liveCompany.stepNumber || 1}`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      📍 {liveCompany.area}
                    </span>
                    {liveCompany.distanceFromPrev && !isCurrentVisited && (
                      <span className="text-[10px] text-slate-500 font-semibold font-mono">
                        ~{liveCompany.distanceFromPrev} km
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug truncate">
                    {liveCompany.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {liveCompany.address}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedCompanyForAction(null);
                    setPinnedDirectTarget(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* BIG ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
                {/* Call */}
                {liveCompany.phone ? (
                  <a
                    href={`tel:${liveCompany.phone.replace(/[^0-9+]/g, '')}`}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <Phone className="w-4 h-4 animate-bounce" />
                    <span>Call Now</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs text-center cursor-not-allowed"
                  >
                    No Phone
                  </button>
                )}

                {/* Maps Navigate */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    liveCompany.mapsQuery || `${liveCompany.name} ${liveCompany.area} Pondicherry`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm text-center"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate</span>
                </a>

                {/* Mark Visited Action Button with clear color distinction */}
                <button
                  onClick={() => executeMarkVisitedDirectly(liveCompany)}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs shadow-2xs flex items-center justify-center gap-1.5 text-center transition-all active:scale-95 ${
                    isCurrentVisited
                      ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                  title={isCurrentVisited ? 'Click to unmark as visited' : 'Mark this company as visited and navigate to next target'}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isCurrentVisited ? 'text-white' : 'text-emerald-600'}`} />
                  <span>{isCurrentVisited ? 'Visited ✓' : 'Mark Visited'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
