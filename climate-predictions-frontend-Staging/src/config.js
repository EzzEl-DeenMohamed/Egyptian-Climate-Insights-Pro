const config = {
  // eslint-disable-next-line no-undef
  API_BASE_URL: process.env.REACT_APP_BACKEND_API_BASE_URL || "http://localhost:8000",
  // eslint-disable-next-line no-undef
  RISK_MAP_URL: process.env.REACT_APP_RISK_MAP_URL || "#",
};

// Validate API base URL
// eslint-disable-next-line no-undef
if (!process.env.REACT_APP_BACKEND_API_BASE_URL) {
  console.warn(
    "REACT_APP_BACKEND_API_BASE_URL not found in environment variables. Using default: http://localhost:8000"
  );
}

export default config;
