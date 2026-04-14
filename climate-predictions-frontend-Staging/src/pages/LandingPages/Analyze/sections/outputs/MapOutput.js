import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import MKBox from "components/MKBox";
import MonthSlider from "../partials/MonthSlider";
import { getParameterColor, parameterPalettes, legendSteps } from "../partials/utils";

function MapOutput({
  mapRef,
  mapInstanceRef,
  selectedMonth,
  handleMonthChange,
  selectedSeason,
  selectedScenario,
  isVisible,
  geoJsonDataGOV,
  climateApiData,
  selectedClimateParameter,
  climateParameters,
  selectedGovernments,
}) {
  // Default parameter if none is selected
  const DEFAULT_PARAMETER = "Temperature";
  const activeParameter = selectedClimateParameter || DEFAULT_PARAMETER;

  // State to store the full API data and currently displayed parameter
  const [fullApiData, setFullApiData] = useState(null);
  const [currentDisplayParam, setCurrentDisplayParam] = useState(null);

  const getMonthAbbreviation = (monthIndex) => {
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    return months[monthIndex];
  };

  // Invalidate map size if needed
  useEffect(() => {
    if (mapRef.current && mapInstanceRef && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize?.();
      }, 100);
    }
  }, [mapRef, mapInstanceRef]);

  // Store the full API data on initial load or when it changes
  useEffect(() => {
    if (climateApiData && Object.keys(climateApiData).length > 0) {
      setFullApiData(climateApiData);
    }
  }, [climateApiData]);

  // Update the displayed parameter when selectedClimateParameter changes
  useEffect(() => {
    if (selectedClimateParameter && climateParameters) {
      const param = climateParameters.find((p) => p.name === selectedClimateParameter);
      if (param) {
        setCurrentDisplayParam(param.id);
      }
    }
  }, [selectedClimateParameter, climateParameters]);

  // Calculate min/max values for the currently displayed parameter
  const calculateValueRange = () => {
    let minValue = Infinity;
    let maxValue = -Infinity;

    if (!fullApiData) return null;

    Object.entries(fullApiData).forEach(([govCode, regionData]) => {
      // Skip if government is selected and this isn't one of them
      if (
        selectedGovernments.length > 0 &&
        !selectedGovernments.includes(govCode) &&
        !selectedGovernments.includes("EG")
      ) {
        return;
      }

      const paramData = regionData[currentDisplayParam];
      if (paramData) {
        // Use the selected scenario or fall back to what's available
        const scenarioData =
          paramData[selectedScenario.toLowerCase()] || paramData[Object.keys(paramData)[0]];

        if (scenarioData) {
          // Handle monthly data
          if (selectedSeason === "Monthly") {
            const monthAbbr = getMonthAbbreviation(selectedMonth);
            if (scenarioData[monthAbbr]) {
              const value = scenarioData[monthAbbr];
              minValue = Math.min(minValue, value);
              maxValue = Math.max(maxValue, value);
            }
          }
          // Handle seasonal/annual data
          else {
            const periodKey = selectedSeason === "Annual" ? "annual" : selectedSeason.toLowerCase();
            const value = scenarioData[periodKey] || scenarioData[Object.keys(scenarioData)[0]];
            if (value !== undefined) {
              minValue = Math.min(minValue, value);
              maxValue = Math.max(maxValue, value);
            }
          }
        }
      }
    });

    if (minValue === Infinity || maxValue === -Infinity) {
      return null;
    }
    if (minValue === maxValue) {
      return { minValue: minValue - 1, maxValue: maxValue + 1 };
    }

    return { minValue, maxValue };
  };
  useEffect(() => {
    const map = mapInstanceRef?.current;
    if (!map || !geoJsonDataGOV || !fullApiData || !geoJsonDataGOV.features || !climateParameters) {
      return;
    }

    const valueRange = calculateValueRange();
    const activeParam = climateParameters.find((p) => p.id === currentDisplayParam);
    const paramCode = activeParam?.code;

    // Remove previous layers and labels
    if (window.geoJsonLayersRef) {
      window.geoJsonLayersRef.forEach((layer) => map.removeLayer(layer));
    }
    if (window.geoJsonLabelsRef) {
      window.geoJsonLabelsRef.forEach((label) => map.removeLayer(label));
    }
    window.geoJsonLayersRef = [];
    window.geoJsonLabelsRef = [];

    if (Array.isArray(geoJsonDataGOV.features)) {
      geoJsonDataGOV.features.forEach((feature) => {
        const govCode = feature?.properties?.code;
        const name = feature?.properties?.name || govCode || "Unknown";

        // Skip if government is selected and this isn't one of them
        if (
          selectedGovernments.length > 0 &&
          !selectedGovernments.includes(govCode) &&
          !selectedGovernments.includes("EG")
        ) {
          return;
        }

        let tooltipContent = `<div style="font-weight:bold">${name}</div>`;
        let colorValue = null;

        if (govCode && fullApiData[govCode]) {
          tooltipContent += `<table style="width:100%">`;

          Object.keys(fullApiData[govCode]).forEach((paramId) => {
            const param = climateParameters.find((p) => p.id === parseInt(paramId));
            if (param) {
              const value = fullApiData[govCode][paramId];
              // Use selected scenario or fall back to first available
              const scenario =
                value[selectedScenario.toLowerCase()] || value[Object.keys(value)[0]];

              let displayValue;
              if (selectedSeason === "Monthly") {
                const monthAbbr = getMonthAbbreviation(selectedMonth);
                displayValue = scenario?.[monthAbbr] ?? "N/A";
              } else {
                const periodKey =
                  selectedSeason === "Annual" ? "annual" : selectedSeason.toLowerCase();
                displayValue = scenario?.[periodKey] ?? "N/A";
              }

              tooltipContent += `
            <tr>
              <td style="padding-right:10px">${param.name}:</td>
              <td>${typeof displayValue === "number" ? displayValue.toFixed(2) : displayValue}</td>
            </tr>
          `;

              if (parseInt(paramId) === currentDisplayParam) {
                colorValue = displayValue;
              }
            }
          });

          tooltipContent += `</table>`;
        }

        const fillColor =
          valueRange && typeof colorValue === "number" && paramCode
            ? getParameterColor(colorValue, paramCode, valueRange.minValue, valueRange.maxValue)
            : "#cccccc";

        const layer = L.geoJSON(feature, {
          style: {
            color: "#222",
            weight: 0.2,
            fillOpacity: 0.7,
            fillColor,
          },
        }).addTo(map);

        layer.bindTooltip(tooltipContent, { sticky: true });
        window.geoJsonLayersRef.push(layer);

        // Add label (feature name) at feature center
        const center = layer.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: "region-label",
            html: `<div style="white-space: nowrap; display: inline-block; font-size: 12px; color: black;">${name}</div>`,
          }),
          interactive: false,
        }).addTo(map);

        window.geoJsonLabelsRef.push(label);
      });
    }

    return () => {
      if (window.geoJsonLayersRef) {
        window.geoJsonLayersRef.forEach((layer) => map.removeLayer(layer));
        window.geoJsonLayersRef = [];
      }
      if (window.geoJsonLabelsRef) {
        window.geoJsonLabelsRef.forEach((label) => map.removeLayer(label));
        window.geoJsonLabelsRef = [];
      }
    };
  }, [
    geoJsonDataGOV,
    fullApiData,
    selectedMonth,
    selectedScenario,
    selectedSeason,
    currentDisplayParam,
    climateParameters,
    selectedGovernments,
  ]);

  // Add/update legend when data changes
  useEffect(() => {
    const map = mapInstanceRef?.current;

    // Remove existing legend if any
    if (window.colorLegend && map) {
      map.removeControl(window.colorLegend);
      window.colorLegend = null;
    }
    // Only show legend if we have valid data
    if (!map || !fullApiData) return;

    const valueRange = calculateValueRange();
    if (!valueRange) return;

    // Find the parameter that matches the current display parameter
    const activeParam = climateParameters.find((p) => p.id === currentDisplayParam);
    const paramCode = activeParam?.code;
    const paramName = activeParam?.name || activeParameter;
    const paramUnit = activeParam?.unit || "";
    if (!paramCode) return;

    // Create new legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "info legend");
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.borderRadius = "5px";
      div.style.boxShadow = "0 0 15px rgba(0,0,0,0.2)";

      const palette = parameterPalettes[paramCode] || parameterPalettes.tmp; // Fallback to tmp
      const step = (valueRange.maxValue - valueRange.minValue) / legendSteps;

      // Add legend title with parameter name and unit
      div.innerHTML = `<h4 style="margin: 0 0 5px; color: #555;">${paramName} in ${paramUnit}</h4>`;

      // Generate legend items using palette colors
      for (let i = 0; i < legendSteps; i++) {
        const value = valueRange.minValue + i * step;
        const color = palette[i]; // Use precomputed color from palette

        div.innerHTML += `
        <div style="margin: 5px 0; display: flex; align-items: center;">
          <i style="background:${color}; width:18px; height:18px; display:inline-block; margin-right:8px; opacity:0.7;"></i>
          <span style="font: 12px/1.5 Arial, Helvetica, sans-serif; color: #555;">
            ${value.toFixed(1)}${i < legendSteps - 1 ? "–" + (value + step).toFixed(1) : "+"}
          </span>
        </div>
      `;
      }

      return div;
    };

    window.colorLegend = legend;
    legend.addTo(map);
  }, [
    fullApiData,
    currentDisplayParam,
    activeParameter,
    selectedMonth,
    selectedScenario,
    selectedSeason,
    climateParameters,
    selectedGovernments,
  ]);

  return (
    <MKBox
      height="550px"
      borderRadius="16px"
      overflow="hidden"
      sx={{
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        border: "5px solid rgba(0, 0, 0, 0.2)",
        padding: "5px",
        display: isVisible ? "block" : "none",
        position: "relative",
      }}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
      {/* Sliders */}
      {selectedSeason === "Monthly" && (
        <MonthSlider handleMonthChange={handleMonthChange} selectedMonth={selectedMonth} />
      )}
    </MKBox>
  );
}

MapOutput.propTypes = {
  mapRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  mapInstanceRef: PropTypes.shape({ current: PropTypes.any }),
  selectedMonth: PropTypes.number.isRequired,
  handleMonthChange: PropTypes.func.isRequired,
  selectedSeason: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedScenario: PropTypes.string.isRequired,
  handleScenarioChange: PropTypes.func.isRequired,
  isScenarioToggleEnabled: PropTypes.bool.isRequired,
  isVisible: PropTypes.bool.isRequired,
  geoJsonDataGOV: PropTypes.shape({
    features: PropTypes.array,
  }),
  climateApiData: PropTypes.object.isRequired,
  selectedClimateParameter: PropTypes.string,
  climateParameters: PropTypes.array,
  selectedGovernments: PropTypes.array,
};

export default MapOutput;
