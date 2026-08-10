import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Leaflet marker default icon fix
// In webpack/vite environments, default marker icons are often broken. We override them with SVG markers or Leaflet default CDN assets.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent({ pins = [], selectedPin = null, onPinClick = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map centered in Bangladesh
    const initialCenter = selectedPin ? [selectedPin.lat, selectedPin.lng] : [23.6850, 90.3563];
    const initialZoom = selectedPin ? 11 : 7;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true
    });

    // Add Tile Layer (OpenStreetMap CartoDB Dark/Light styles or standard OSM)
    // We use CartoDB Voyagers or standard OSM. Standard OSM is highly colorful.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Clean up map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when selectedPin changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPin) return;
    mapInstanceRef.current.setView([selectedPin.lat, selectedPin.lng], 11, {
      animate: true,
      duration: 1.0
    });

    // Open popup for selected pin if marker exists
    const marker = markersRef.current[selectedPin.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedPin]);

  // Update markers when pins array changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    // Add new markers
    pins.forEach(pin => {
      const isUnsafe = pin.unsafeCount > 0;

      const unsafeBanner = isUnsafe 
        ? `<div style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:10px; font-weight:bold; padding:4px; border-radius:4px; margin-bottom:6px; text-align:center;">⚠️ UNSAFE LOCATION (${pin.unsafeCount} Reports)</div>`
        : '';

      const popupContent = `
        <div style="width: 210px; font-family: 'Outfit', sans-serif;">
          ${unsafeBanner}
          <img src="${pin.image}" style="width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:6px;" alt="${pin.name}" />
          <h4 style="margin:0; font-weight:bold; font-size:14px; color:#1f2937;">${pin.name}</h4>
          <span style="display:inline-block; font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; margin:4px 0 6px;">${pin.category}</span>
          <p style="margin:0 0 6px; font-size:11px; color:#4b5563; line-height:1.3;">${pin.description.substring(0, 70)}...</p>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e5e7eb; padding-top:6px;">
            <span style="font-size:11px; font-weight:bold; color:#d97706;">★ ${pin.rating}</span>
            <button id="btn-pin-${pin.id}" style="background:#f97316; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;">Explore Plans</button>
          </div>
        </div>
      `;

      const marker = L.marker([pin.lat, pin.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(popupContent);

      markersRef.current[pin.id] = marker;

      // Handle custom popup button click
      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-pin-${pin.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (onPinClick) {
              onPinClick(pin);
            }
          };
        }
      });
    });
  }, [pins, onPinClick]);

  return (
    <div className="relative w-full h-full min-h-[400px] border border-base-300 rounded-xl overflow-hidden shadow-inner bg-base-200">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
