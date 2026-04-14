import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

export const useDrawMapInitialization = (mapRef) => {
  const mapInstanceRef = useRef(null);
  const [drawnGeoJsons, setDrawnGeoJsons] = useState([]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([26.8206, 30.8025], 6);

      const baseLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      );
      baseLayer.addTo(mapInstanceRef.current);

      // Feature group for drawn items
      const drawnItems = new L.FeatureGroup();
      mapInstanceRef.current.addLayer(drawnItems);

      // Drawing controls
      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: true,
          polyline: false,
          rectangle: true,
          circle: false,
          marker: false,
        },
      });
      mapInstanceRef.current.addControl(drawControl);

      // Handle draw created
      mapInstanceRef.current.on("draw:created", (event) => {
        const { layer } = event;
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON();
        setDrawnGeoJsons((prev) => [...prev, geojson]);
      });

      // Handle draw edited
      mapInstanceRef.current.on("draw:edited", () => {
        // Rebuild the array from all layers
        const features = [];
        drawnItems.eachLayer((layer) => {
          features.push(layer.toGeoJSON());
        });
        setDrawnGeoJsons(features);
      });

      // Handle draw deleted
      mapInstanceRef.current.on("draw:deleted", () => {
        // Rebuild the array from all layers
        const features = [];
        drawnItems.eachLayer((layer) => {
          features.push(layer.toGeoJSON());
        });
        setDrawnGeoJsons(features);
      });

      // Add scale
      L.control.scale({ position: "bottomleft" }).addTo(mapInstanceRef.current);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapRef]);

  return { mapInstanceRef, drawnGeoJsons };
};
