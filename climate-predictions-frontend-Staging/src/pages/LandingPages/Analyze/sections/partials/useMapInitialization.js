import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const useMapInitialization = (mapRef) => {
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([26.8206, 30.8025], 6);

      const baseLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      );

      // Add default layer
      baseLayer.addTo(mapInstanceRef.current);

      // Initialize geoJsonLayerGroup as an L.FeatureGroup
      mapInstanceRef.current.geoJsonLayerGroup = new L.FeatureGroup().addTo(mapInstanceRef.current);

      // Add distance measurement control
      L.control.scale({ position: "bottomleft" }).addTo(mapInstanceRef.current);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapRef]);

  return { mapInstanceRef };
};
