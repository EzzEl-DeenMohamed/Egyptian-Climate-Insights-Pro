import { useEffect, useRef } from "react";
import L from "leaflet";
import { fixGeoJson } from "./utils";

export const useMapLayers = (
  mapInstanceRef,
  geoJsonDataGOV,
  climateValues,
  paletteName,
  shouldColor,
  selectedGovernments
) => {
  const outlinesAddedRef = useRef(false);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapInstanceRef.current.geoJsonLayerGroup) return;
    const geoJsonGroup = mapInstanceRef.current.geoJsonLayerGroup;

    // Remove only layers that are not in selectedGovernments (when coloring)
    if (shouldColor) {
      geoJsonGroup.eachLayer((layer) => {
        const layerFeature = layer.feature;
        const govCode = layerFeature && layerFeature.properties && layerFeature.properties.code;
        if (
          govCode &&
          Array.isArray(selectedGovernments) &&
          !selectedGovernments.includes(govCode)
        ) {
          geoJsonGroup.removeLayer(layer);
        }
      });
    }

    if (!shouldColor) {
      // Only add outlines if not already added
      if (!outlinesAddedRef.current) {
        const govs =
          geoJsonDataGOV && typeof geoJsonDataGOV === "object" ? Object.keys(geoJsonDataGOV) : [];
        govs.forEach((govCode) => {
          const fixedGovGeoJson = fixGeoJson(geoJsonDataGOV?.[govCode]);
          if (fixedGovGeoJson) {
            if (fixedGovGeoJson.features) {
              fixedGovGeoJson.features.forEach((f) => (f.properties.code = govCode));
            }
            L.geoJSON(fixedGovGeoJson, {
              style: { color: "#888", weight: 2, fillOpacity: 0 }, // outline only, no fill
              interactive: false,
            }).addTo(geoJsonGroup);
          }
        });
        outlinesAddedRef.current = true;
      }
    } else {
      // Add or update only selected governments as outlines (no coloring)
      (Array.isArray(selectedGovernments) ? selectedGovernments : []).forEach((govCode) => {
        let exists = false;
        geoJsonGroup.eachLayer((layer) => {
          const layerFeature = layer.feature;
          if (layerFeature && layerFeature.properties && layerFeature.properties.code === govCode) {
            exists = true;
            // Update style to outline only (no fill)
            layer.setStyle({ color: "#888", weight: 2, fillOpacity: 0 });
          }
        });
        if (!exists) {
          const fixedGovGeoJson = fixGeoJson(geoJsonDataGOV?.[govCode]);
          if (fixedGovGeoJson) {
            if (fixedGovGeoJson.features) {
              fixedGovGeoJson.features.forEach((f) => (f.properties.code = govCode));
            }
            L.geoJSON(fixedGovGeoJson, {
              style: { color: "#888", weight: 2, fillOpacity: 0 }, // outline only, no fill
              interactive: false,
            }).addTo(geoJsonGroup);
          }
        }
      });
      outlinesAddedRef.current = false;
    }

    // Fit the map to the bounds of the displayed layers
    const bounds = geoJsonGroup.getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [geoJsonDataGOV, shouldColor, selectedGovernments, mapInstanceRef]);
};
