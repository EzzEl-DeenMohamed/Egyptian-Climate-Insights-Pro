// ============================================================================
// EXTERNAL LIBRARIES
// ============================================================================
import React, { useState } from "react";
import { Grid, Container, ToggleButton, ToggleButtonGroup } from "@mui/material";
import "../../../../style/Anlayze/Sections/DatePicker.css";
import "../../../../style/Anlayze/Sections/ClimateDropdown.css";
import "../../../../style/Anlayze/Sections/SeasonDropdown.css";
import "../../../../style/Anlayze/Sections/DatePickerInput.css";
import "../../../../style/Anlayze/Sections/DropdownStyles.css";
import "../../../../style/Anlayze/Sections/Buttons.css";
import "../../../../style/Anlayze/Sections/CheckBoxes.css";

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================
import MKBox from "../../../../components/MKBox";
import MapView from "./views/MapView";
import LineChartView from "./views/LineChartView";
import SummaryCardsView from "./views/SummaryCardsView";
import DrawMapView from "./views/DrawMapView";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const buildRequestPayload = ({ startDate, endDate, selectedSeason, selectedMonth }) => {
  const start_year = startDate ? startDate.getFullYear() : undefined;
  const end_year = endDate ? endDate.getFullYear() : undefined;

  let timeframe = undefined;
  if (selectedSeason === "Monthly" && selectedMonth !== undefined && selectedMonth !== null) {
    timeframe = getMonthAbbreviation(selectedMonth);
  } else if (selectedSeason && selectedSeason !== "Annual") {
    timeframe = selectedSeason.toLowerCase();
  } else if (selectedSeason === "Annual") {
    timeframe = "annual";
  }

  return {
    ...(start_year !== undefined && { start_year }),
    ...(end_year !== undefined && { end_year }),
    ...(timeframe && { timeframe }),
  };
};

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

// ============================================================================
// MAIN COMPONENT: AnalyzeSection
// ============================================================================
function AnalyzeSection() {
  // State for which view is active
  const [outputView, setOutputView] = useState("map");

  // Per-view input state
  const [mapInputs, setMapInputs] = useState({
    selectedClimateParameter: [],
    selectedSeason: "",
    selectedGovernments: [],
    startDate: null,
    endDate: null,
    selectedMonth: null,
    selectedScenarioType: "",
  });
  const [cardsInputs, setCardsInputs] = useState({
    selectedClimateParameter: [],
    selectedSeason: "",
    selectedScenarioType: "",
    selectedGovernments: [],
    startDate: null,
    endDate: null,
  });
  const [chartInputs, setChartInputs] = useState({
    selectedSeason: "",
    selectedScenarioType: "",
    selectedGovernments: [],
    startDate: null,
    endDate: null,
  });
  // DrawMapView state
  const [drawMapInputs, setDrawMapInputs] = useState({
    paramId: "",
    season: "Annual",
    scenario: "historical",
    startYear: null,
    endYear: null,
  });
  const [drawMapImages, setDrawMapImages] = useState([]);
  const [drawMapError, setDrawMapError] = useState("");
  const [drawMapDownloadAnchorEl, setDrawMapDownloadAnchorEl] = useState(null);

  return (
    <MKBox component="section" id="map-section" py={5}>
      <Container>
        {/* Output View Switch */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={false} md={3} lg={4} />
          <Grid item xs={12} md={6} lg={4} sx={{ display: "flex", justifyContent: "center" }}>
            <ToggleButtonGroup
              value={outputView}
              exclusive
              onChange={(e, value) => {
                if (value !== null) setOutputView(value);
              }}
              aria-label="Output View"
              size="large"
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor: "#b4b4b4",
                  color: "#555",
                  fontSize: "0.8rem",
                  px: 10,
                  py: 2,
                },
                "& .Mui-selected": {
                  backgroundColor: "#bdbdbd !important",
                  color: "#000",
                },
              }}
            >
              <ToggleButton value="map">Map</ToggleButton>
              <ToggleButton value="drawmap">Draw Map</ToggleButton>
              <ToggleButton value="chart">Line Chart</ToggleButton>
              <ToggleButton value="summary">Summary Cards</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={false} md={3} lg={4} />
        </Grid>
        {/* Render the selected view */}
        {outputView === "map" && <MapView inputs={mapInputs} setInputs={setMapInputs} />}
        {outputView === "drawmap" && (
          <DrawMapView
            inputs={drawMapInputs}
            setInputs={setDrawMapInputs}
            images={drawMapImages}
            setImages={setDrawMapImages}
            error={drawMapError}
            setError={setDrawMapError}
            downloadAnchorEl={drawMapDownloadAnchorEl}
            setDownloadAnchorEl={setDrawMapDownloadAnchorEl}
          />
        )}
        {outputView === "chart" && (
          <LineChartView inputs={chartInputs} setInputs={setChartInputs} />
        )}
        {outputView === "summary" && (
          <SummaryCardsView inputs={cardsInputs} setInputs={setCardsInputs} />
        )}
      </Container>
    </MKBox>
  );
}

export default AnalyzeSection;
