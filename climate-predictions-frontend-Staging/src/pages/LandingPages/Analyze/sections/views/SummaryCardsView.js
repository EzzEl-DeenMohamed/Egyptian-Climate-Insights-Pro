import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import Typography from "@mui/material/Typography";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MKBox from "../../../../../components/MKBox";
import SummaryCardsOutput from "../outputs/SummaryCardsOutput";
import config from "../../../../../config";
import style from "../../../../../style/Anlayze/Sections/DatePicker.css";
import "../../../../../style/Anlayze/Sections/ClimateDropdown.css";
import "../../../../../style/Anlayze/Sections/SeasonDropdown.css";
import "../../../../../style/Anlayze/Sections/DatePickerInput.css";
import "../../../../../style/Anlayze/Sections/DropdownStyles.css";
import "../../../../../style/Anlayze/Sections/Buttons.css";
import "../../../../../style/Anlayze/Sections/CheckBoxes.css";
import { useGlobalData } from "../partials/GlobalDataProvider";
import PropTypes from "prop-types";
import LoadingOverlay from "../../../../../components/LoadingOverlay";
import MKTypography from "../../../../../components/MKTypography";

function SummaryCardsView({ inputs, setInputs }) {
  // --- Global Data ---
  const { climateParameters, governments: Government } = useGlobalData();
  // --- State ---
  const [isAnnualData] = useState(true);
  const [error, setError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage] = useState("");
  const [factsData, setFactsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Placeholder Data ---
  const createPlaceholderFactsData = () => {
    const placeholderData = {};

    // Use generic placeholder data instead of actual selected values
    const placeholderParams = climateParameters.slice(0, 2); // Just show 2 example parameters
    const placeholderGovs = ["PLACEHOLDER"]; // Use a placeholder location code

    placeholderParams.forEach((param) => {
      placeholderGovs.forEach((govCode) => {
        const key = `${param.id}_${govCode}`;
        placeholderData[key] = {
          clm_param_id: param.id,
          location_code: govCode,
          scenario_code: "placeholder", // Generic placeholder
          timeframe: "placeholder", // Generic placeholder
          avg_value: null,
          min_value: null,
          max_value: null,
          std_value: null,
        };
      });
    });

    return placeholderData;
  };

  // Memoize climate_param_ids and location_codes to avoid reference changes
  const climate_param_ids = useMemo(() => {
    if (inputs.selectedClimateParameter && inputs.selectedClimateParameter.length > 0) {
      return climateParameters
        .filter((p) => inputs.selectedClimateParameter.includes(p.name))
        .map((p) => p.id);
    } else {
      return climateParameters.map((p) => p.id);
    }
  }, [climateParameters, inputs.selectedClimateParameter]);

  const location_codes = useMemo(() => {
    if (inputs.selectedGovernments && inputs.selectedGovernments.length) {
      if (inputs.selectedGovernments.includes("EG")) {
        return ["EG"];
      }
      return inputs.selectedGovernments;
    }
    return []; // Return empty array instead of defaulting to Cairo
  }, [inputs.selectedGovernments]);

  // --- Data Fetching ---
  useEffect(() => {
    let didCancel = false;
    // Only fetch if ALL required inputs are provided
    if (
      !climateParameters ||
      climateParameters.length === 0 ||
      !inputs.selectedClimateParameter ||
      inputs.selectedClimateParameter.length === 0 ||
      !inputs.selectedGovernments ||
      inputs.selectedGovernments.length === 0 ||
      !inputs.startDate ||
      !inputs.endDate ||
      !inputs.selectedScenarioType
    )
      return;
    const fetchSummaryFacts = async () => {
      setIsLoading(true);
      setError("");
      let scenario_codes = [];
      if (inputs.selectedScenarioType === "Lower Emission") scenario_codes = ["ssp245"];
      else if (inputs.selectedScenarioType === "Higher Emission") scenario_codes = ["ssp370"];
      else scenario_codes = ["historical"];
      const payload = {
        climate_param_ids,
        location_codes,
        scenario_codes,
        start_year: inputs.startDate.getFullYear(),
        end_year: inputs.endDate.getFullYear(),
        timeframe:
          inputs.selectedSeason && inputs.selectedSeason !== "Annual"
            ? inputs.selectedSeason.toLowerCase()
            : !isAnnualData
            ? "monthly"
            : "annual",
      };
      try {
        const response = await fetch(`${config.API_BASE_URL}/climate/analysis/facts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!didCancel) setFactsData(data.data || {});
      } catch (err) {
        if (!didCancel) {
          setFactsData({});
          setError("Failed to fetch summary data.");
        }
      } finally {
        if (!didCancel) setIsLoading(false);
      }
    };
    fetchSummaryFacts();
    return () => {
      didCancel = true;
    };
  }, [
    climate_param_ids,
    location_codes,
    inputs.selectedScenarioType,
    inputs.selectedSeason,
    inputs.startDate,
    inputs.endDate,
    isAnnualData,
    climateParameters,
    inputs.selectedClimateParameter,
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

  // --- Render ---
  return (
    <MKBox component="section" id="summarycards-section" py={5} sx={{ position: "relative" }}>
      {isLoading && <LoadingOverlay message="Loading summary data..." />}
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
                multiple
                value={inputs.selectedClimateParameter}
                onChange={(e) => setInputs({ ...inputs, selectedClimateParameter: e.target.value })}
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
                  if (!selected || selected.length === 0) {
                    return "Select Climate Parameter";
                  }
                  return selected.length === 1
                    ? selected[0]
                    : `${selected.length} parameters selected`;
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
                  // For single selection (summary and chart views), just return the value
                  return selected[0] === "EG"
                    ? "All"
                    : Government.find((gov) => gov.location_info.code === selected[0])
                        ?.location_info.name || selected[0];
                }}
              >
                <MenuItem disabled value="">
                  Select Governorate
                </MenuItem>
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
      {/* Summary Cards Output View */}
      {error ? (
        <MKBox mt={2} textAlign="center">
          <MKTypography color="error" variant="h6">
            {errorMessage || "An error occurred while fetching summary cards data."}
          </MKTypography>
        </MKBox>
      ) : (
        <SummaryCardsOutput
          climateParameters={climateParameters}
          Government={Government}
          startYear={inputs.startDate?.getFullYear?.() || 1991}
          endYear={inputs.endDate?.getFullYear?.() || 1999}
          selectedClimateParameter={inputs.selectedClimateParameter}
          selectedGovernments={inputs.selectedGovernments}
          selectedScenario={inputs.selectedScenarioType}
          selectedSeason={inputs.selectedSeason}
          isAnnualData={isAnnualData}
          config={config}
          factsData={
            !isLoading && (!factsData || Object.keys(factsData).length === 0)
              ? createPlaceholderFactsData()
              : factsData
          }
          isLoading={isLoading}
          error={error}
          handleScenarioChange={handleScenarioChange}
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
    </MKBox>
  );
}

SummaryCardsView.propTypes = {
  inputs: PropTypes.object.isRequired,
  setInputs: PropTypes.func.isRequired,
};

export default SummaryCardsView;
