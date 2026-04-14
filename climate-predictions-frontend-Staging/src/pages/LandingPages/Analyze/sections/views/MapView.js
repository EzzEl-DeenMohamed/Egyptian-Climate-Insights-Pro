import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  MenuItem,
  Grid,
  Button,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu as MuiMenu,
  Container,
} from "@mui/material";
import Typography from "@mui/material/Typography";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import axios from "axios";
import MKBox from "../../../../../components/MKBox";
import MapOutput from "../outputs/MapOutput";
import config from "../../../../../config";
import style from "../../../../../style/Anlayze/Sections/DatePicker.css";
import "../../../../../style/Anlayze/Sections/ClimateDropdown.css";
import "../../../../../style/Anlayze/Sections/SeasonDropdown.css";
import "../../../../../style/Anlayze/Sections/DatePickerInput.css";
import "../../../../../style/Anlayze/Sections/DropdownStyles.css";
import "../../../../../style/Anlayze/Sections/Buttons.css";
import "../../../../../style/Anlayze/Sections/CheckBoxes.css";
import { useMapInitialization } from "../partials/useMapInitialization";
import { fetchGeoJsonDataGOV } from "../partials/useDataFetching";
import { useMapLayers } from "../partials/useMapLayers";
import { fetchMapOutput } from "../outputs/fetchAnalysisOutputs";
import { buildRequestPayload } from "../AnalyzeSection";
import PropTypes from "prop-types";
import LoadingOverlay from "../../../../../components/LoadingOverlay";
import MKTypography from "../../../../../components/MKTypography";
import { useGlobalData } from "../partials/GlobalDataProvider";

function MapView({ inputs, setInputs }) {
  // --- Refs ---
  const mapRef1 = useRef(null);

  // --- Global Data ---
  const { climateParameters, governments: Government } = useGlobalData();

  // --- State ---
  const [geoJsonDataGOV, setGeoJsonDataGOV] = useState({});
  const [mapOutputData, setMapOutputData] = useState(null);
  const [error, setError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const [isLoading, setIsLoading] = useState(false);
  const [apiCache, setApiCache] = useState({});
  const [lastRequestParams, setLastRequestParams] = useState(null);

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

  // --- Computed values ---
  const isScenarioToggleEnabled =
    (inputs.startDate instanceof Date &&
      !isNaN(inputs.startDate) &&
      inputs.startDate.getFullYear() > 2023) ||
    (inputs.endDate instanceof Date &&
      !isNaN(inputs.endDate) &&
      inputs.endDate.getFullYear() > 2023);

  let scenarioCode = null;
  if (isScenarioToggleEnabled) {
    if (inputs.selectedScenarioType === "Lower Emission") scenarioCode = "ssp245";
    else if (inputs.selectedScenarioType === "Higher Emission") scenarioCode = "ssp370";
    else scenarioCode = "historical";
  } else {
    scenarioCode = "historical";
  }

  // --- Helpers ---
  const getDateRangeForScenario = (scenario) => {
    switch (scenario) {
      case "Historical":
        return {
          minDate: new Date(1901, 0, 1),
          maxDate: new Date(2023, 11, 31),
        };
      case "Lower Emission":
      case "Higher Emission":
        return {
          minDate: new Date(2020, 0, 1),
          maxDate: new Date(2100, 11, 31),
        };
      default:
        return {
          minDate: new Date(1901, 0, 1),
          maxDate: new Date(2100, 11, 31),
        };
    }
  };

  // Fetch data function with caching
  const fetchData = async () => {
    const currentParams = {
      startDate: inputs.startDate,
      endDate: inputs.endDate,
      selectedSeason: inputs.selectedSeason,
      selectedMonth: inputs.selectedMonth,
    };

    // Check if we have cached data for these params
    const cacheKey = JSON.stringify(currentParams);

    if (apiCache[cacheKey] && JSON.stringify(lastRequestParams) === cacheKey) {
      // Use cached data if available and params haven't changed
      setMapOutputData(apiCache[cacheKey]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildRequestPayload(currentParams);
      const data = await fetchMapOutput(payload);

      // Update cache
      setApiCache((prev) => ({
        ...prev,
        [cacheKey]: data,
      }));
      setLastRequestParams(currentParams);
      setMapOutputData(data);
    } catch (err) {
      setMapOutputData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Hooks ---
  const { mapInstanceRef } = useMapInitialization(mapRef1);
  useEffect(() => {
    setIsLoading(true);
    fetchGeoJsonDataGOV(setGeoJsonDataGOV).finally(() => setIsLoading(false));
  }, []);
  useMapLayers(
    mapInstanceRef,
    geoJsonDataGOV,
    mapOutputData?.data,
    inputs.selectedGovernments.length > 0 &&
      ((Array.isArray(inputs.selectedClimateParameter) &&
        inputs.selectedClimateParameter.length > 0) ||
        (!Array.isArray(inputs.selectedClimateParameter) && inputs.selectedClimateParameter)) &&
      inputs.startDate &&
      inputs.endDate &&
      inputs.selectedSeason,
    inputs.selectedGovernments
  );

  // --- Effects ---
  // Data fetching effect with caching
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);
  useEffect(() => {
    if (!initialLoadComplete) return;

    // Only fetch if all required user inputs are present
    if (
      !inputs.startDate ||
      !inputs.endDate ||
      !inputs.selectedSeason ||
      !Array.isArray(inputs.selectedGovernments) ||
      !inputs.selectedClimateParameter ||
      inputs.selectedClimateParameter.length === 0
    ) {
      return;
    }

    // Only fetch if these specific params change
    const paramsChanged =
      JSON.stringify({
        startDate: inputs.startDate,
        endDate: inputs.endDate,
        selectedSeason: inputs.selectedSeason,
        selectedMonth: inputs.selectedMonth,
      }) !== JSON.stringify(lastRequestParams);

    if (paramsChanged) {
      const timer = setTimeout(() => {
        fetchData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    initialLoadComplete,
    inputs.startDate,
    inputs.endDate,
    inputs.selectedSeason,
    inputs.selectedMonth,
    inputs.selectedGovernments,
    inputs.selectedClimateParameter,
    inputs.selectedScenarioType,
  ]);

  // --- Input Handlers ---
  const handleStartDateChange = (date) => {
    const { maxDate } = getDateRangeForScenario(inputs.selectedScenarioType);
    if (date > maxDate) {
      setError(
        `Start date cannot be after ${maxDate.getFullYear()} for ${
          inputs.selectedScenarioType
        } scenario`
      );
      return;
    }
    if (inputs.endDate && date > inputs.endDate) {
      setError("Start date cannot be after end date");
      return;
    }
    setError("");
    setInputs({ ...inputs, startDate: date });
  };

  const handleEndDateChange = (date) => {
    const { minDate } = getDateRangeForScenario(inputs.selectedScenarioType);
    if (date < minDate) {
      setError(
        `End date cannot be before ${minDate.getFullYear()} for ${
          inputs.selectedScenarioType
        } scenario`
      );
      return;
    }
    if (date < inputs.startDate) {
      setError("End date cannot be earlier than start date");
      return;
    }
    setError("");
    setInputs({ ...inputs, endDate: date });
  };

  const handleScenarioChange = (scenario) => {
    setInputs({ ...inputs, selectedScenarioType: scenario });
  };

  const handleMonthChange = (month) => {
    setInputs({ ...inputs, selectedMonth: month });
  };

  const handleDownloadMenuClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadExcel = async () => {
    try {
      const payload = buildRequestPayload({
        startDate: inputs.startDate,
        endDate: inputs.endDate,
        selectedSeason: inputs.selectedSeason,
        selectedMonth: inputs.selectedMonth,
      });
      const response = await axios.post(
        `${config.API_BASE_URL}/climate/analysis/downloads/excel`,
        payload,
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      const blob = response.data;
      const reader = new FileReader();
      reader.onloadend = function () {
        const url = reader.result;
        const link = document.createElement("a");
        const disposition = response.headers["content-disposition"];
        let filename = "climate-map-data.xlsx";
        if (disposition && disposition.indexOf("filename=") !== -1) {
          filename = disposition.split("filename=")[1].replace(/['"]/g, "").trim();
        }
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setErrorMessage("Failed to download Excel file");
      setErrorDialogOpen(true);
    }
  };

  const handleDownloadMapImage = async () => {
    try {
      const climateParamId = climateParameters.find(
        (p) =>
          p.name ===
          (Array.isArray(inputs.selectedClimateParameter)
            ? inputs.selectedClimateParameter[0]
            : inputs.selectedClimateParameter)
      )?.id;
      if (!climateParamId) throw new Error("No climate parameter selected");
      const isAllEgypt = inputs.selectedGovernments.length === Government.length;

      let timeframe;
      if (inputs.selectedSeason === "Monthly") {
        timeframe = getMonthAbbreviation(inputs.selectedMonth);
      } else {
        timeframe =
          inputs.selectedSeason && inputs.selectedSeason !== "Annual"
            ? inputs.selectedSeason.toLowerCase()
            : "annual";
      }

      const payload = {
        climate_param_ids: [climateParamId],
        location_codes: isAllEgypt ? [] : inputs.selectedGovernments,
        scenario_codes: [scenarioCode],
        start_year: inputs.startDate?.getFullYear?.(),
        end_year: inputs.endDate?.getFullYear?.(),
        timeframe: timeframe,
        geojson: {},
      };
      const response = await axios.post(
        `${config.API_BASE_URL}/climate/analysis/downloads/choropleth-map`,
        payload,
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );
      if (response.headers["content-type"] !== "image/png") {
        throw new Error("Unexpected response type");
      }
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "climate-map.png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage("Failed to download map image");
      setErrorDialogOpen(true);
    }
  };

  // --- Render ---
  return (
    <MKBox component="section" id="map-section" py={5} sx={{ position: "relative" }}>
      {/* Error and empty state overlay */}
      {(error || (!isLoading && (!mapOutputData || Object.keys(mapOutputData).length === 0))) && (
        <MKBox
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            zIndex: 2000,
            pointerEvents: "none",
          }}
        >
          <MKTypography
            color={error ? "error" : "text"}
            variant="h6"
            sx={{
              bgcolor: "rgba(255,255,255,0.9)",
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: 3,
              pointerEvents: "auto",
            }}
          >
            {error
              ? errorMessage || "An error occurred while fetching map data."
              : "No data available for the selected filters."}
          </MKTypography>
        </MKBox>
      )}
      {isLoading && <LoadingOverlay message="Loading map data..." />}
      <Container>
        {/* Selections Row */}
        <Grid
          container
          justifyContent="center"
          spacing={2}
          alignItems="flex-start"
          sx={{ mb: 4, mt: 4 }}
        >
          {/* Climate Parameter Dropdown */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Climate Parameter" arrow>
              <div>
                <Select
                  value={
                    Array.isArray(inputs.selectedClimateParameter)
                      ? inputs.selectedClimateParameter[0] || ""
                      : inputs.selectedClimateParameter
                  }
                  onChange={(e) =>
                    setInputs({ ...inputs, selectedClimateParameter: [e.target.value] })
                  }
                  displayEmpty
                  fullWidth
                  className="climate-dropdown"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    "& .MuiSelect-select": {
                      padding: "12px 14px",
                    },
                  }}
                  renderValue={(selected) => {
                    if (!selected || selected === "") {
                      return "Select Climate Parameter";
                    }
                    return selected;
                  }}
                >
                  <MenuItem disabled value="">
                    Select Climate Parameter
                  </MenuItem>
                  {climateParameters.map((param) => (
                    <MenuItem key={param.id} value={param.name}>
                      {param.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </Tooltip>
          </Grid>
          {/* Season Dropdown */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Season" arrow>
              <div>
                <Select
                  value={inputs.selectedSeason || ""}
                  onChange={(e) => setInputs({ ...inputs, selectedSeason: e.target.value })}
                  displayEmpty
                  fullWidth
                  className="season-dropdown"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    "& .MuiSelect-select": {
                      padding: "12px 14px",
                    },
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return "Select Season";
                    }
                    return selected === "Annual" ? "Annual" : selected;
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Season (Optional)
                  </MenuItem>
                  <MenuItem value="Annual">Annual</MenuItem>
                  <MenuItem value="Winter">Winter</MenuItem>
                  <MenuItem value="Spring">Spring</MenuItem>
                  <MenuItem value="Summer">Summer</MenuItem>
                  <MenuItem value="Fall">Fall</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </Select>
              </div>
            </Tooltip>
          </Grid>
          {/* Scenario Dropdown */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Scenario" arrow>
              <div>
                <Select
                  value={inputs.selectedScenarioType}
                  onChange={(e) => setInputs({ ...inputs, selectedScenarioType: e.target.value })}
                  displayEmpty
                  fullWidth
                  className="dropdown-select"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    "& .MuiSelect-select": {
                      padding: "12px 14px",
                    },
                  }}
                  renderValue={(selected) => {
                    return selected || "Select Scenario";
                  }}
                >
                  <MenuItem value="Historical">Historical</MenuItem>
                  <MenuItem value="Lower Emission">Lower Emission</MenuItem>
                  <MenuItem value="Higher Emission">Higher Emission</MenuItem>
                </Select>
              </div>
            </Tooltip>
          </Grid>
          {/* Start Date Picker */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Start Date" arrow>
              <div className={style.dateInput} style={{ width: "100%" }}>
                <DatePicker
                  selected={inputs.startDate}
                  minDate={getDateRangeForScenario(inputs.selectedScenarioType).minDate}
                  maxDate={
                    inputs.endDate || getDateRangeForScenario(inputs.selectedScenarioType).maxDate
                  }
                  onChange={handleStartDateChange}
                  showYearPicker={true}
                  showMonthDropdown={false}
                  showYearDropdown={true}
                  dateFormat={"yyyy"}
                  placeholderText={"Select Start Year"}
                  className="datepicker"
                  wrapperClassName="datepicker-wrapper"
                  popperClassName="datepicker-popper"
                  customInput={
                    <input
                      className="datepicker-input"
                      style={{ width: "100%", padding: "12px 14px" }}
                    />
                  }
                />
              </div>
            </Tooltip>
          </Grid>
          {/* End Date Picker */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="End Date" arrow>
              <div className={style.dateInput} style={{ width: "100%" }}>
                <DatePicker
                  selected={inputs.endDate}
                  minDate={
                    inputs.startDate || getDateRangeForScenario(inputs.selectedScenarioType).minDate
                  }
                  maxDate={getDateRangeForScenario(inputs.selectedScenarioType).maxDate}
                  onChange={handleEndDateChange}
                  showYearPicker={true}
                  showMonthDropdown={false}
                  showYearDropdown={true}
                  dateFormat={"yyyy"}
                  placeholderText={"Select End Year"}
                  className="datepicker"
                  wrapperClassName="datepicker-wrapper"
                  popperClassName="datepicker-popper"
                  customInput={
                    <input
                      className="datepicker-input"
                      style={{ width: "100%", padding: "12px 14px" }}
                    />
                  }
                />
                {error && (
                  <p style={{ color: "red", fontSize: "0.9rem", marginTop: "8px" }}>{error}</p>
                )}
              </div>
            </Tooltip>
          </Grid>
          {/* Governorate Dropdown */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Governorate" arrow>
              <div>
                <Select
                  multiple
                  value={inputs.selectedGovernments}
                  onChange={(e) => {
                    const value = e.target.value;
                    // If 'All' was selected (either newly or already in selection)
                    if (value.includes("EG")) {
                      // If 'All' was just selected now, set to empty array (represents All)
                      if (value[value.length - 1] === "EG") {
                        setInputs({ ...inputs, selectedGovernments: [] });
                      } else {
                        // If 'All' was already selected and user is selecting others, remove 'All'
                        setInputs({
                          ...inputs,
                          selectedGovernments: value.filter((v) => v !== "EG"),
                        });
                      }
                    } else if (value.length === 0) {
                      setInputs({ ...inputs, selectedGovernments: [] }); // Empty array represents All
                    } else {
                      setInputs({ ...inputs, selectedGovernments: value });
                    }
                  }}
                  displayEmpty
                  fullWidth
                  className="dropdown-select"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    "& .MuiSelect-select": {
                      padding: "12px 14px",
                    },
                  }}
                  renderValue={(selected) => {
                    // Show 'All' by default if nothing is selected (empty array)
                    if (!selected || selected.length === 0) {
                      return "All";
                    }
                    if (selected.includes("EG")) {
                      return "All";
                    }
                    return selected
                      .map(
                        (code) =>
                          Government.find((gov) => gov.location_info.code === code)?.location_info
                            .name || code
                      )
                      .join(", ");
                  }}
                >
                  <MenuItem value="EG">All</MenuItem>
                  {Government.map((gov) => (
                    <MenuItem key={gov.location_info.code} value={gov.location_info.code}>
                      {gov.location_info.name}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </Tooltip>
          </Grid>
        </Grid>
        {/* Map Output View */}
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12}>
            <MapOutput
              mapRef={mapRef1}
              mapInstanceRef={mapInstanceRef}
              selectedMonth={inputs.selectedMonth}
              handleMonthChange={handleMonthChange}
              selectedSeason={inputs.selectedSeason}
              selectedScenario={inputs.selectedScenarioType}
              handleScenarioChange={handleScenarioChange}
              isVisible={true}
              climateApiData={mapOutputData?.data || {}}
              geoJsonDataGOV={geoJsonDataGOV}
              climateParameters={climateParameters}
              selectedClimateParameter={
                Array.isArray(inputs.selectedClimateParameter) &&
                inputs.selectedClimateParameter.length > 0
                  ? inputs.selectedClimateParameter[0]
                  : (Array.isArray(inputs.selectedClimateParameter)
                      ? ""
                      : inputs.selectedClimateParameter) ||
                    (climateParameters.length > 0 ? climateParameters[0].name : "")
              }
              selectedGovernments={inputs.selectedGovernments}
            />
          </Grid>
        </Grid>
        {/* Download button for map output */}
        <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
          <Button
            variant="contained"
            className="common-button"
            onClick={handleDownloadMenuClick}
            endIcon={<KeyboardArrowDownIcon />}
          >
            Download
          </Button>
          <MuiMenu
            anchorEl={downloadAnchorEl}
            open={downloadMenuOpen}
            onClose={handleDownloadMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleDownloadMenuClose();
                handleDownloadExcel();
              }}
            >
              Download Data as Excel
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadMenuClose();
                handleDownloadMapImage();
              }}
            >
              Download Map as Image (PNG)
            </MenuItem>
          </MuiMenu>
        </Grid>
        <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <Typography>{errorMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setErrorDialogOpen(false)} color="primary">
              Close
            </Button>
            <Button
              onClick={() => {
                setErrorDialogOpen(false);
                setInputs({ ...inputs, selectedClimateParameter: [] });
              }}
              color="secondary"
            >
              Retry
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MKBox>
  );
}

MapView.propTypes = {
  inputs: PropTypes.object.isRequired,
  setInputs: PropTypes.func.isRequired,
};

export default MapView;
