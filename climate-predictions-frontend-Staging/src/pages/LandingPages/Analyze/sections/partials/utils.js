// Helper function to generate a unique color from a string
export const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 255;
  const g = (hash >> 8) & 255;
  const b = hash & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

export const legendSteps = 6; // Number of steps in the legend for color gradients
/**
 * Base color definitions for each climate parameter.
 * Each parameter has a start (low value) and end (high value) color in hex format.
 */
const parameterBaseColors = {
  // Daily Mean Temperature (tmp): Sky blue (low) to red (high)
  tmp: { start: "#87CEEB", end: "#FF0000" }, // SkyBlue to Red
  // Monthly average Daily maximum Temperature (tmx): Light blue to deep red
  tmx: { start: "#ADD8E6", end: "#8B0000" }, // LightBlue to DarkRed
  // Monthly average Daily minimum Temperature (tmn): Cyan to orange-red
  tmn: { start: "#00FFFF", end: "#FF4500" }, // Cyan to OrangeRed
  // Precipitation (pre): Light blue to deep blue
  pre: { start: "#E0F7FA", end: "#00008B" }, // LightCyan to DarkBlue
  // Potential Evapotranspiration (pet): Yellow to brown
  pet: { start: "#FFFF99", end: "#8B4513" }, // LightYellow to SaddleBrown
  // Cloud Cover (cld): Light gray to dark gray
  cld: { start: "#D3D3D3", end: "#333333" }, // LightGray to DarkGray
  // Frost day frequency (frs): Light cyan to deep blue
  frs: { start: "#E0FFFF", end: "#0000CD" }, // LightCyan to MediumBlue
  // Wet day frequency (wet): Light blue to navy
  wet: { start: "#B0E0E6", end: "#000080" }, // PowderBlue to Navy
  // Diurnal temperature range (dtr): Light purple to dark purple
  dtr: { start: "#E6E6FA", end: "#4B0082" }, // Lavender to Indigo
  // Wind speed (ws): Light green to dark teal
  ws: { start: "#98FB98", end: "#006400" }, // PaleGreen to DarkGreen
  // Vapor pressure (vap): Light teal to dark teal
  vap: { start: "#AFEEEE", end: "#008B8B" }, // PaleTurquoise to DarkCyan
  // Soil moisture (sm): Light brown to dark green
  sm: { start: "#F5F5DC", end: "#228B22" }, // Beige to ForestGreen
};

/**
 * Generate a linear gradient between two colors with fewer steps.
 * @param {string} startColor - Starting color in hex (#RRGGBB)
 * @param {string} endColor - Ending color in hex (#RRGGBB)
 * @returns {string[]} Array of hex colors
 */
export function generateColorGradient(startColor, endColor) {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
  };

  const [startR, startG, startB] = hexToRgb(startColor);
  const [endR, endG, endB] = hexToRgb(endColor);
  const colors = [];

  for (let i = 0; i < legendSteps; i++) {
    const factor = i / (legendSteps - 1);
    const r = startR + factor * (endR - startR);
    const g = startG + factor * (endG - startG);
    const b = startB + factor * (endB - startB);
    colors.push(rgbToHex(r, g, b));
  }

  return colors;
}

/**
 * Pre-generate color palettes for each climate parameter with 5 steps.
 */
export const parameterPalettes = {};
Object.entries(parameterBaseColors).forEach(([param, { start, end }]) => {
  parameterPalettes[param] = generateColorGradient(start, end);
});

/**
 * Get the color for a value within a parameter's range.
 * @param {number} value - The value to map to a color
 * @param {string} param - The climate parameter code (e.g., 'tmp', 'pre')
 * @param {number} minValue - Minimum value in the data range
 * @param {number} maxValue - Maximum value in the data range
 * @returns {string} Hex color code
 */
export function getParameterColor(value, param, minValue, maxValue) {
  if (value === null || value === undefined || minValue === maxValue) {
    return "#cccccc"; // Default gray for no data
  }

  const palette = parameterPalettes[param] || parameterPalettes.tmp; // Fallback to tmp
  const range = maxValue - minValue;
  const normalizedValue = Math.min(Math.max((value - minValue) / range, 0), 1); // Clamp to [0, 1]
  const index = Math.floor(normalizedValue * (palette.length - 1));
  return palette[index];
}

// Helper function to fix incorrect GeoJSON formats
export const fixGeoJson = (geoJsonData) => {
  if (!geoJsonData) return null;
  if (geoJsonData.features && !Array.isArray(geoJsonData.features)) {
    return { ...geoJsonData, features: [geoJsonData.features] };
  }
  return geoJsonData;
};

// Transform line chart data from backend format to chart format
export const transformLineChartData = (backendData, governmentData, comparisonRows) => {
  if (!backendData || !backendData.lines) {
    return null;
  }

  // Create a mapping of government codes to names from governmentData
  const govMapping = governmentData.reduce((acc, gov) => {
    acc[gov.location_info.code] = gov.location_info.name;
    return acc;
  }, {});

  // Create a mapping of selected locations from comparisonRows
  const selectedLocationMapping = comparisonRows.reduce((acc, row) => {
    if (row.governments && row.governments.length > 0) {
      row.governments.forEach((govCode) => {
        acc[govCode] = govMapping[govCode] || govCode;
      });
    }
    return acc;
  }, {});

  // Extract unique years for labels
  const labels = [...new Set(backendData.lines.flatMap((line) => line.years))].sort();

  // Create datasets for each location
  const datasets = backendData.lines.map((line) => {
    const label =
      selectedLocationMapping[line.location_code] ||
      govMapping[line.location_code] ||
      line.location_code;

    return {
      label, // Use the name instead of the code
      data: line.values,
      borderColor: stringToColor(label), // Unique color based on gov name
      fill: false,
    };
  });
  return { labels, datasets };
};
