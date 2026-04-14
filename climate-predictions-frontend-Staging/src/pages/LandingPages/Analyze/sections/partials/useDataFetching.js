import { useEffect } from "react";
import config from "../../../../../config";

const API_BASE_URL = config.API_BASE_URL;

export const useDataFetching = (setClimateParameters, setGovernment) => {
  // --- On Page Load: Fetch Climate Parameters and All Governments ---
  useEffect(() => {
    async function fetchClimateParameters() {
      try {
        const response = await fetch(`${API_BASE_URL}/climate/parameters`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch climate parameters: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setClimateParameters(data);
      } catch (error) {
        console.error("Error fetching climate parameters:", error);
        // Set empty array to prevent undefined errors
        setClimateParameters([]);
      }
    }

    async function fetchGovernment() {
      try {
        const response = await fetch(`${API_BASE_URL}/geo/govs`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch government data: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setGovernment(data);
      } catch (error) {
        console.error("Error fetching government data:", error);
        // Set empty array to prevent undefined errors
        setGovernment([]);
      }
    }

    const fetchAllData = async () => {
      try {
        await Promise.all([fetchClimateParameters(), fetchGovernment()]);
      } catch (error) {
        console.error("Error fetching all data:", error);
        // Handle errors if needed, e.g., set empty states
        setClimateParameters([]);
        setGovernment([]);
      }
    };

    fetchAllData();
  }, []); // Only run once on mount
};

// Fetch all Government GeoJSON at once
export const fetchGeoJsonDataGOV = async (setGeoJsonDataGOV) => {
  try {
    const response = await fetch(`${API_BASE_URL}/geo/govs/geojson`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch GeoJSON for all governorates: ${response.status} ${response.statusText}`
      );
    }
    const govData = await response.json(); // Should be a FeatureCollection
    setGeoJsonDataGOV(govData); // Set all at once
    console.log("Fetched all Government GeoJSON successfully");
  } catch (error) {
    console.error("Error fetching all Government GeoJSON:", error);
    setGeoJsonDataGOV({});
  }
};
