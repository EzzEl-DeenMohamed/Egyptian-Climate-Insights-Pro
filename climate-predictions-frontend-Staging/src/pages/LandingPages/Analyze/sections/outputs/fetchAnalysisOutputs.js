import config from "../../../../../config";

const API_BASE_URL = config.API_BASE_URL;

export const fetchMapOutput = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/climate/analysis/maps/choropleth/values`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch map output: ${response.statusText}`);
  }

  return await response.json();
};
