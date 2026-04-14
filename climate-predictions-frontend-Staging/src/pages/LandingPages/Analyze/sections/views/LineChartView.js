import React, { useState } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import Typography from "@mui/material/Typography";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MKBox from "../../../../../components/MKBox";
import LineChartParametersOutput from "../outputs/LineChartParametersOutput";
import style from "../../../../../style/Anlayze/Sections/DatePicker.css";
import "../../../../../style/Anlayze/Sections/ClimateDropdown.css";
import "../../../../../style/Anlayze/Sections/SeasonDropdown.css";
import "../../../../../style/Anlayze/Sections/DatePickerInput.css";
import "../../../../../style/Anlayze/Sections/DropdownStyles.css";
import "../../../../../style/Anlayze/Sections/Buttons.css";
import "../../../../../style/Anlayze/Sections/CheckBoxes.css";
import { useGlobalData } from "../partials/GlobalDataProvider";
import config from "../../../../../config";
import LoadingOverlay from "../../../../../components/LoadingOverlay";
import MKTypography from "../../../../../components/MKTypography";
import LineChartGovsOutput from "../outputs/LineChartGovsOutput";

// Add this at the top of your main entry file (e.g., src/index.js)
const suppressedErrors = [
  "ResizeObserver loop completed with undelivered notifications.",
  "ResizeObserver loop limit exceeded",
];

const realConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && suppressedErrors.some((msg) => args[0].includes(msg))) {
    return;
  }
  realConsoleError(...args);
};

function LineChartView() {
  // --- Global Data ---
  const { climateParameters, governments: Government } = useGlobalData();

  // Secondary toggle state
  const [subView, setSubView] = useState("parameters"); // 'parameters' or 'governorates'

  // --- Render ---
  return (
    <MKBox component="section" id="linechart-section" py={5} sx={{ position: "relative" }}>
      {/* Secondary Toggle */}
      <Grid container justifyContent="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={subView}
          exclusive
          onChange={(e, value) => value && setSubView(value)}
          aria-label="Line Chart Sub-View"
          size="medium"
        >
          <ToggleButton value="parameters">Climate Parameters</ToggleButton>
          <ToggleButton value="governorates">Governorates</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      {/* Render sub-views */}
      {subView === "parameters" ? (
        <ParametersSubView climateParameters={climateParameters} Government={Government} />
      ) : (
        <GovernoratesSubView climateParameters={climateParameters} Government={Government} />
      )}
    </MKBox>
  );
}

// --- Parameters Sub-View (Isolated) ---
// eslint-disable-next-line react/prop-types
function ParametersSubView({ climateParameters, Government }) {
  const [inputs, setInputs] = useState({
    selectedGovernments: [],
    selectedSeason: "",
    selectedScenarioType: "",
    startDate: null,
    endDate: null,
  });
  const [isAnnualData] = useState(true);
  const [error, setError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage] = useState("");
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Placeholder Data ---
  const createPlaceholderChartData = () => {
    const years = [];
    for (let year = 2020; year <= 2030; year++) {
      years.push(year.toString());
    }
    return {
      labels: years,
      datasets: [
        {
          label: "Select Parameters to View Data",
          data: years.map(() => null),
          borderColor: "#cccccc",
          backgroundColor: "#cccccc33",
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [5, 5],
        },
      ],
    };
  };

  // Copy from StandaloneLineChart.js
  const transformLineChartData = (apiResponse, climateParameters = [], selectedScenario) => {
    if (!apiResponse || !apiResponse.lines || !Array.isArray(apiResponse.lines)) {
      return null;
    }
    const scenarioMap = {
      Historical: "historical",
      "Lower Emission": "ssp245",
      "Higher Emission": "ssp370", // <-- change this to ssp370
    };
    const targetScenarioCode = scenarioMap[selectedScenario] || "historical";
    // Only use lines with the correct scenario_code
    const relevantLines = apiResponse.lines.filter(
      (line) => line.scenario_code === targetScenarioCode
    );
    if (relevantLines.length === 0) {
      return null;
    }
    const colorPalette = [
      "#1976d2",
      "#d32f2f",
      "#388e3c",
      "#fbc02d",
      "#7b1fa2",
      "#0288d1",
      "#c2185b",
      "#ffa000",
      "#388e3c",
      "#455a64",
    ];
    let allYearsSet = new Set();
    relevantLines.forEach((line) => {
      if (Array.isArray(line.time_buckets)) {
        line.time_buckets.forEach((date) => {
          allYearsSet.add(new Date(date).getFullYear().toString());
        });
      }
    });
    const labels = Array.from(allYearsSet).sort();
    const datasets = relevantLines.map((line, idx) => {
      // eslint-disable-next-line react/prop-types
      const param = climateParameters.find((p) => p.id === line.clm_param_id);
      const paramName = param ? param.name : `Parameter ${line.clm_param_id}`;
      const yearToValue = {};
      if (Array.isArray(line.time_buckets) && Array.isArray(line.values)) {
        line.time_buckets.forEach((date, i) => {
          const year = new Date(date).getFullYear().toString();
          yearToValue[year] = line.values[i];
        });
      }
      const data = labels.map((year) =>
        Object.prototype.hasOwnProperty.call(yearToValue, year) ? yearToValue[year] : null
      );
      return {
        label: paramName,
        data,
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: colorPalette[idx % colorPalette.length] + "33",
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });
    if (labels.length === 0) {
      return null;
    }
    return { labels, datasets };
  };

  // Fetch chart data on mount and when relevant filters change
  React.useEffect(() => {
    if (
      !climateParameters ||
      // eslint-disable-next-line react/prop-types
      climateParameters.length === 0 ||
      !inputs.selectedGovernments ||
      inputs.selectedGovernments.length === 0 ||
      !inputs.startDate ||
      !inputs.endDate ||
      !inputs.selectedScenarioType
    )
      return;
    const fetchLineChartData = async () => {
      setIsLoading(true);
      setError("");
      setChartData(null);
      try {
        const req_body = {
          location_codes: inputs.selectedGovernments,
          climate_param_ids: [],
          start_year: inputs.startDate.getFullYear(),
          end_year: inputs.endDate.getFullYear(),
          timeframe: inputs.selectedSeason ? inputs.selectedSeason.toLowerCase() : "annual",
        };
        const response = await fetch(`${config.API_BASE_URL}/climate/analysis/charts/line-chart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify(req_body),
        });
        if (!response.ok) {
          throw new Error("");
        }
        const rawData = await response.json();
        const transformed = transformLineChartData(
          rawData,
          climateParameters,
          inputs.selectedScenarioType
        );
        setChartData(transformed);
      } catch (err) {
        setError(err.message || "");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLineChartData();
  }, [
    inputs.selectedSeason,
    inputs.selectedScenarioType,
    inputs.selectedGovernments,
    inputs.startDate,
    inputs.endDate,
    climateParameters,
  ]);

  // --- Input Handlers ---
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

  return (
    <div>
      {isLoading && <LoadingOverlay message="Loading chart data..." />}
      <Grid
        container
        justifyContent="center"
        spacing={2}
        alignItems="flex-start"
        sx={{ mb: 4, mt: 4 }}
      >
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
                onChange={(e) => handleScenarioChange(e.target.value)}
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
                value={inputs.selectedGovernments}
                onChange={(e) => {
                  const value = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
                  if (value.includes("EG")) {
                    setInputs({ ...inputs, selectedGovernments: ["EG"] });
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
                  if (!selected || selected.length === 0) {
                    return "Select Governorate";
                  }
                  return selected[0] === "EG"
                    ? "All"
                    : // eslint-disable-next-line react/prop-types
                      Government.find((gov) => gov.location_info.code === selected[0])
                        ?.location_info.name || selected[0];
                }}
              >
                <MenuItem disabled value="">
                  Select Governorate
                </MenuItem>
                <MenuItem value="EG">All</MenuItem>
                {/* eslint-disable-next-line react/prop-types */}
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
      {/* Error and empty state handling */}
      {error ? (
        <MKBox mt={2} textAlign="center">
          <MKTypography color="error" variant="h6">
            {errorMessage || "An error occurred while fetching chart data."}
          </MKTypography>
        </MKBox>
      ) : (
        <LineChartParametersOutput
          chartData={
            !isLoading && (!chartData || !chartData.labels || chartData.labels.length === 0)
              ? createPlaceholderChartData()
              : chartData
          }
          isLoading={isLoading}
          error={error}
          climateParameters={climateParameters}
          locationCode={
            inputs.selectedGovernments[0] === "EG" ? "EG" : inputs.selectedGovernments[0] || "EG01"
          }
          startYear={inputs.startDate?.getFullYear?.() || 1991}
          endYear={inputs.endDate?.getFullYear?.() || 1999}
          timeframe={
            inputs.selectedSeason && inputs.selectedSeason !== "Annual"
              ? inputs.selectedSeason.toLowerCase()
              : !isAnnualData
              ? "monthly"
              : "annual"
          }
          locationName={
            inputs.selectedGovernments[0] === "EG"
              ? "EGYPT"
              : // eslint-disable-next-line react/prop-types
                Government.find(
                  (gov) => gov.location_info.code === (inputs.selectedGovernments[0] || "EG01")
                )?.location_info.name ||
                inputs.selectedGovernments[0] ||
                "Egypt"
          }
          selectedScenario={inputs.selectedScenarioType}
        />
      )}
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
            }}
            color="secondary"
          >
            Retry
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// --- Governorates Sub-View (Isolated) ---
// eslint-disable-next-line react/prop-types
function GovernoratesSubView({ climateParameters, Government }) {
  // Isolated state for governorates sub-view
  const [inputs, setInputs] = React.useState({
    selectedParamId: "",
    selectedSeason: "",
    selectedScenarioType: "",
    startDate: null,
    endDate: null,
  });
  return (
    <LineChartGovsOutput
      inputs={inputs}
      setInputs={setInputs}
      climateParameters={climateParameters}
      Government={Government}
    />
  );
}

LineChartView.propTypes = {};

export default LineChartView;
