import React, { createContext, useContext, useState, useEffect } from "react";
import config from "../../../../../config";

const GlobalDataContext = createContext();

// eslint-disable-next-line react/prop-types
export function GlobalDataProvider({ children }) {
  const [climateParameters, setClimateParameters] = useState([]);
  const [governments, setGovernments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      try {
        const [paramsRes, govsRes] = await Promise.all([
          fetch(`${config.API_BASE_URL}/climate/parameters`),
          fetch(`${config.API_BASE_URL}/geo/govs`),
        ]);
        const params = await paramsRes.json();
        const govs = await govsRes.json();
        if (!cancelled) {
          setClimateParameters(params);
          setGovernments(govs);
        }
      } catch (e) {
        if (!cancelled) {
          setClimateParameters([]);
          setGovernments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlobalDataContext.Provider value={{ climateParameters, governments, loading }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  return useContext(GlobalDataContext);
}
