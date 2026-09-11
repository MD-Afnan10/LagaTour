import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation } from "lucide-react";

/**
 * Custom SVG Teardrop Icon for Tour Places
 */
function createTourPlaceIcon(place, isSelected) {
  const rating = Number(place.safetyRating || place.safety_rating || 5.0).toFixed(1);
  const isHighSafety = rating >= 4.0;
  const pinColor = isHighSafety ? "#059669" : "#d97706"; // Emerald (Safe) or Amber (Caution)
  const strokeColor = isSelected ? "#3b82f6" : "#ffffff";
  const strokeWidth = isSelected ? "3.5" : "2";
  const scale = isSelected ? "scale(1.15)" : "scale(1)";
  const zIndex = isSelected ? 1000 : 100;
  const rawId = place.id || place.place_id || "pl";

  return L.divIcon({
    className: "tour-place-marker-wrapper",
    iconSize: [44, 54],
    iconAnchor: [22, 52],
    popupAnchor: [0, -50],
    html: `
      <div style="transform: ${scale}; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); z-index: ${zIndex}; position: relative; cursor: pointer;">
        <!-- Top Star Rating Badge -->
        <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #111827; color: #fbbf24; font-size: 10px; font-weight: 800; padding: 1px 7px; border-radius: 9999px; border: 1.5px solid ${strokeColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.35); white-space: nowrap; display: flex; align-items: center; gap: 2px;">
          ★ ${rating}
        </div>

        <!-- Teardrop Pin SVG -->
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <filter id="shadow-${rawId}" x="0" y="0" width="44" height="52" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <path d="M22 50C22 50 39 33.5 39 20C39 10.6 31.4 3 22 3C12.6 3 5 10.6 5 20C5 33.5 22 50 22 50Z" 
                fill="${pinColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          
          <!-- Inner White Badge -->
          <circle cx="22" cy="20" r="10.5" fill="#FFFFFF"/>

          <!-- Destination Mountain / Landmark Glyph -->
          <path d="M22 13L26 19.5H18L22 13Z" fill="${pinColor}"/>
          <path d="M16.5 25.5L22 18L27.5 25.5H16.5Z" fill="${pinColor}"/>
        </svg>
      </div>
    `
  });
}

/**
 * Custom Animated Pulsing Blue Radar Beacon for User's Current Location
 */
function createUserLocationIcon() {
  return L.divIcon({
    className: "user-current-location-marker",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23],
    html: `
      <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar wave -->
        <div style="position: absolute; width: 46px; height: 46px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: userPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Outer Glowing Ring -->
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(37, 99, 235, 0.2); border: 2px solid #60a5fa; box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);"></div>
        
        <!-- Inner Vibrant Royal Blue Core -->
        <div style="position: absolute; width: 15px; height: 15px; border-radius: 50%; background: #1d4ed8; border: 2.5px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>
      </div>
      <style>
        @keyframes userPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `
  });
}

export default function MapComponent({ 
  pins = [], 
  selectedPin = null, 
  onPinClick = null,
  userLocation = null,
  onLocateMe = null,
  isLocating = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = selectedPin 
      ? [selectedPin.latitude || selectedPin.lat, selectedPin.longitude || selectedPin.lng] 
      : userLocation 
        ? [userLocation.lat, userLocation.lng]
        : [23.6850, 90.3563]; // Bangladesh Center
    const initialZoom = selectedPin ? 12 : userLocation ? 11 : 7;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false
    });

    // Add Zoom Control at top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker on the Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && userLocation.lat && userLocation.lng) {
      const { lat, lng, accuracy } = userLocation;

      const popupHtml = `
        <div style="width: 190px; text-align: center; font-family: 'Outfit', sans-serif; padding: 4px;">
          <div style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 13px; color: #1d4ed8; margin-bottom: 2px;">
            <span>📍 You Are Here</span>
          </div>
          <p style="margin: 0 0 6px; font-size: 11px; color: #4b5563;">Live Device GPS Location</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px; font-family: monospace; font-size: 11px; color: #1e40af; font-weight: bold;">
            ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
          ${accuracy ? `<div style="font-size: 9px; color: #6b7280; margin-top: 4px;">GPS Precision: ±${Math.round(accuracy)}m</div>` : ''}
        </div>
      `;

      if (!userMarkerRef.current) {
        const userMarker = L.marker([lat, lng], { 
          icon: createUserLocationIcon(),
          zIndexOffset: 2000 
        })
          .addTo(map)
          .bindPopup(popupHtml);

        userMarkerRef.current = userMarker;
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
        userMarkerRef.current.setPopupContent(popupHtml);
      }
    } else if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update camera when selectedPin changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPin) return;

    const lat = selectedPin.latitude || selectedPin.lat;
    const lng = selectedPin.longitude || selectedPin.lng;

    if (lat && lng) {
      map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.2
      });

      // Open popup for selected pin if exists
      const marker = markersRef.current[selectedPin.id || selectedPin.place_id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  }, [selectedPin]);

  // Render Tour Places Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    pins.forEach(pin => {
      const lat = parseFloat(pin.latitude || pin.lat);
      const lng = parseFloat(pin.longitude || pin.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const pinId = pin.id || pin.place_id;
      const isSelected = (selectedPin?.id || selectedPin?.place_id) === pinId;

      // Primary photo or clean placeholder
      const photoUrl = (pin.images && pin.images.length > 0) ? pin.images[0] : pin.image;
      const placeName = pin.name || pin.place_name || pin.placeName || "Scenic Spot";
      const districtName = pin.district_name || pin.district || "Bangladesh";
      const divisionName = pin.division_name || pin.division || "";
      const rating = Number(pin.safetyRating || pin.safety_rating || 5.0).toFixed(1);
      const desc = pin.description || "Community discovered travel spot in Bangladesh.";

      const imageHtml = photoUrl ? `
        <div style="position: relative; width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
          <img src="${photoUrl}" style="width:100%; height:100%; object-fit: cover;" alt="${placeName}" />
          <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.65); color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
            📍 ${districtName}
          </div>
        </div>
      ` : `
        <div style="height: 60px; background: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #6b7280; font-size: 11px; margin-bottom: 8px;">
          <span>📍 ${districtName}</span>
        </div>
      `;

      const popupContent = `
        <div style="width: 220px; font-family: 'Outfit', sans-serif;">
          ${imageHtml}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
            <h4 style="margin: 0; font-weight: 800; font-size: 14px; color: #111827; line-height: 1.2;">${placeName}</h4>
            <span style="font-size: 11px; font-weight: 800; color: #d97706; background: #fef3c7; padding: 1px 6px; border-radius: 4px; shrink: 0;">
              ★ ${rating}
            </span>
          </div>
          <div style="font-size: 10px; color: #0284c7; font-weight: bold; margin-top: 2px;">
            📍 ${districtName}${divisionName ? `, ${divisionName}` : ''}
          </div>
          <p style="margin: 6px 0 8px; font-size: 11px; color: #4b5563; line-height: 1.35;">
            ${desc.length > 75 ? desc.substring(0, 75) + '...' : desc}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 6px;">
            <span style="font-family: monospace; font-size: 9px; color: #9ca3af;">(${lat.toFixed(2)}, ${lng.toFixed(2)})</span>
            <button id="btn-explore-pin-${pinId}" style="background: #059669; color: #ffffff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 10px; cursor: pointer; font-weight: 800; display: flex; align-items: center; gap: 3px;">
              View Details →
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { 
        icon: createTourPlaceIcon(pin, isSelected)
      })
        .addTo(map)
        .bindPopup(popupContent);

      markersRef.current[pinId] = marker;

      // Handle Explore Button in Popup
      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-explore-pin-${pinId}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (onPinClick) onPinClick(pin);
          };
        }
      });

      // Handle Pin Click
      marker.on("click", () => {
        if (onPinClick) onPinClick(pin);
      });
    });
  }, [pins, selectedPin, onPinClick]);

  return (
    <div className="relative w-full h-full min-h-[400px] border border-base-300 rounded-2xl overflow-hidden shadow-inner bg-base-200">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Floating Action: Locate Me Button */}
      {onLocateMe && (
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="absolute top-4 left-4 z-[400] btn btn-sm bg-base-100/95 hover:bg-base-100 text-primary border border-base-300 shadow-lg rounded-xl gap-2 font-bold backdrop-blur transition-all"
          title="Zoom to my live GPS location"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-warning' : 'text-blue-600'}`} />
          <span className="text-xs">{isLocating ? "Acquiring GPS..." : "My Location"}</span>
        </button>
      )}

      {/* Map Legend (Tour Places vs User Location) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-base-100/90 backdrop-blur border border-base-300 py-2 px-3 rounded-2xl shadow-lg hidden sm:flex items-center gap-4 text-[11px] font-semibold text-base-content/85">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-sm inline-block"></span>
          <span>Tour Destination</span>
        </div>
        <div className="w-px h-3 bg-base-300"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-blue-300 ring-2 ring-blue-500/30 shadow-sm inline-block"></span>
          <span>Your Live Location</span>
        </div>
      </div>
    </div>
  );
}
