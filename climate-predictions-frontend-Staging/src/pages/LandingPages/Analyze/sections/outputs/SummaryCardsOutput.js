import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Grid, Card, Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import html2canvas from "html2canvas";
import axios from "axios";
import jsPDF from "jspdf";

function SummaryCardsOutput({
  climateParameters,
  Government,
  startYear,
  endYear,
  selectedClimateParameter,
  selectedGovernments,
  isScenarioToggleEnabled,
  selectedScenario,
  selectedSeason,
  isAnnualData,
  config,
  factsData,
}) {
  const summaryCardsRef = useRef();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Unique color mapping for each parameter name (case-insensitive)
  const paramColorMap = {
    "daily mean temperature": "#FFD600", // yellow
    "monthly average daily maximum temperature": "#FF9800", // orange
    "monthly average daily minimum temperature": "#1976D2", // blue
    precipitation: "#00B8D4", // cyan
    "potential evapotranspiration": "#8E24AA", // purple
    "cloud cover": "#90A4AE", // grey blue
    "forest day frequency": "#388E3C", // green
    "wet day frequency": "#0288D1", // light blue
    "diurnal temperature range": "#FBC02D", // gold
    "wind speed": "#43E97B", // green
    "vapor pressure": "#C2185B", // magenta
    "soil moisture": "#6D4C41", // brown
  };

  // Units mapping for each parameter name (case-insensitive)
  const paramUnitMap = {
    "daily mean temperature": "°C",
    "monthly average daily maximum temperature": "°C",
    "monthly average daily minimum temperature": "°C",
    precipitation: "mm",
    "potential evapotranspiration": "mm",
    "cloud cover": "%",
    "forest day frequency": "Days",
    "wet day frequency": "Days",
    "diurnal temperature range": "°C",
    "wind speed": "m/s",
    "vapor pressure": "hPa",
    "soil moisture": "m³/m³ or %",
  };

  // Group facts by location_code
  const factsByLocation = {};
  Object.entries(factsData || {}).forEach(([paramId, fact]) => {
    if (!factsByLocation[fact.location_code]) factsByLocation[fact.location_code] = {};
    factsByLocation[fact.location_code][paramId] = fact;
  });

  // --- Download Handlers ---
  const handleDownloadSummaryImage = async (type = "png") => {
    if (summaryCardsRef.current) {
      const canvas = await html2canvas(summaryCardsRef.current, { backgroundColor: null });
      let dataUrl;
      if (type === "jpg" || type === "jpeg") {
        dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      } else {
        dataUrl = canvas.toDataURL("image/png");
      }
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `climate-summary-cards.${type}`;
      link.click();
    }
  };

  const handleDownloadSummaryPDF = async () => {
    if (summaryCardsRef.current) {
      const canvas = await html2canvas(summaryCardsRef.current, { backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Fit the image to the page
      pdf.addImage(imgData, "PNG", 10, 10, pageWidth - 20, pageHeight - 20);
      pdf.save("climate-summary-cards.pdf");
    }
  };

  const handleDownloadSummaryExcel = async () => {
    // Build the same payload as used for summary facts
    let climate_param_ids = [];
    if (selectedClimateParameter && selectedClimateParameter.length > 0) {
      climate_param_ids = climateParameters
        .filter((p) => selectedClimateParameter.includes(p.name))
        .map((p) => p.id);
    } else {
      climate_param_ids = climateParameters.map((p) => p.id);
    }
    let location_codes =
      selectedGovernments && selectedGovernments.length ? selectedGovernments : ["EG01"];
    if (location_codes.includes("EG")) {
      location_codes = ["EG"];
    }
    let scenario_codes = [];
    if (isScenarioToggleEnabled) {
      if (selectedScenario === "Optimistic") scenario_codes = ["ssp245"];
      else if (selectedScenario === "Pessimistic") scenario_codes = ["ssp370"];
    } else {
      scenario_codes = ["historical"];
    }
    const start_year = startYear || 1991;
    const end_year = endYear || 1999;
    let timeframe = "annual";
    if (selectedSeason && selectedSeason !== "Annual") {
      timeframe = selectedSeason.toLowerCase();
    } else if (!isAnnualData) {
      timeframe = "monthly";
    }
    const payload = {
      climate_param_ids,
      location_codes,
      scenario_codes,
      start_year,
      end_year,
      timeframe,
    };
    try {
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
        let filename = "climate-summary-cards.xlsx";
        if (disposition && disposition.indexOf("filename=") !== -1) {
          filename = disposition.split("filename=")[1].replace(/['"]/g, "").trim();
        }
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert("Failed to download Excel file.");
    }
  };

  // --- Download Menu Handlers ---
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <div ref={summaryCardsRef}>
        {/* Render a set of info+parameter cards for each selected government */}
        {Object.entries(factsByLocation).map(([locationCode, paramFacts]) => {
          // Find govName, scenario, season, etc. for this location
          const firstFact = Object.values(paramFacts)[0];
          let govName = locationCode;

          // Handle placeholder data
          if (locationCode === "PLACEHOLDER") {
            govName = "Select Location";
          } else if (typeof govName === "string" && govName === "EG") {
            govName = "EGYPT";
          } else if (Government) {
            const govObj = Government.find((g) => g.location_info.code === locationCode);
            if (govObj) govName = govObj.location_info.name;
          }

          const scenario =
            firstFact?.scenario_code === "placeholder"
              ? "Select Scenario"
              : firstFact?.scenario_code;
          const season =
            firstFact?.timeframe === "placeholder" ? "Select Season" : firstFact?.timeframe;
          const infoColor = "#7C4DFF";
          return (
            <Box key={locationCode} sx={{ mb: 4 }}>
              {/* Info card for this location */}
              <Grid container justifyContent="center" sx={{ mt: 2, mb: 2 }}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      p: 2,
                      background: "rgba(255,255,255,0.7)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                      borderLeft: `6px solid ${infoColor}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      maxWidth: 240,
                      margin: "0 auto",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color={infoColor}
                      sx={{
                        mb: 0.5,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontSize: "1rem",
                      }}
                    >
                      {govName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.2, fontSize: "0.85rem" }}
                    >
                      <span style={{ fontWeight: 600 }}>Scenario:</span> {scenario}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.2, fontSize: "0.85rem" }}
                    >
                      <span style={{ fontWeight: 600 }}>Timeframe:</span>{" "}
                      {season === "Select Season" ? "Select Dates" : `[${startYear}-${endYear}]`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600 }}>Season:</span>{" "}
                      {season === "Select Season"
                        ? "Select Season"
                        : season?.charAt(0).toUpperCase() + season?.slice(1)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
              {/* Parameter cards for this location */}
              <Grid container spacing={3} sx={{ mt: 2 }} justifyContent="center">
                {Object.entries(paramFacts).map(([paramId, fact]) => {
                  const param = climateParameters?.find((p) => String(p.id) === String(paramId));
                  const paramName = param?.name || `Parameter ${paramId}`;
                  const color = paramColorMap[paramName?.toLowerCase()] || "#888";
                  return (
                    <Grid item xs={12} sm={6} md={4} key={paramId}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          p: 3,
                          background: "rgba(255,255,255,0.7)",
                          backdropFilter: "blur(12px)",
                          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                          borderLeft: `6px solid ${color}`,
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-6px) scale(1.03)",
                            boxShadow: `0 16px 40px 0 ${color}33, 0 8px 32px 0 rgba(31, 38, 135, 0.18)`,
                          },
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          minHeight: 180,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color={color}
                          sx={{ mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
                        >
                          {paramName}
                        </Typography>
                        <Typography
                          variant="h3"
                          fontWeight={800}
                          color={color}
                          sx={{ mb: 1, lineHeight: 1.1 }}
                        >
                          {fact.avg_value !== null
                            ? `${fact.avg_value.toFixed(2)} ${
                                paramUnitMap[paramName?.toLowerCase()] || ""
                              }`
                            : "No Data"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, width: "100%", mt: "auto" }}>
                          <Typography variant="body2" color="text.secondary">
                            <span style={{ fontWeight: 600 }}>Min:</span>{" "}
                            {fact.min_value !== null
                              ? `${fact.min_value.toFixed(2)} ${
                                  paramUnitMap[paramName?.toLowerCase()] || ""
                                }`
                              : "No Data"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <span style={{ fontWeight: 600 }}>Max:</span>{" "}
                            {fact.max_value !== null
                              ? `${fact.max_value.toFixed(2)} ${
                                  paramUnitMap[paramName?.toLowerCase()] || ""
                                }`
                              : "No Data"}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          );
        })}
      </div>
      {/* Download menu button */}
      <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="contained"
          className="common-button"
          onClick={handleMenuClick}
          endIcon={<KeyboardArrowDownIcon />}
        >
          Download
        </Button>
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadSummaryImage("png");
            }}
          >
            Download Cards as PNG
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadSummaryImage("jpg");
            }}
          >
            Download Cards as JPG
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadSummaryPDF();
            }}
          >
            Download Cards as PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadSummaryExcel();
            }}
          >
            Download Data as Excel
          </MenuItem>
        </Menu>
      </Grid>
    </>
  );
}

SummaryCardsOutput.propTypes = {
  climateParameters: PropTypes.array,
  Government: PropTypes.array,
  startYear: PropTypes.number,
  endYear: PropTypes.number,
  selectedClimateParameter: PropTypes.array,
  selectedGovernments: PropTypes.array,
  isScenarioToggleEnabled: PropTypes.bool,
  selectedScenario: PropTypes.string,
  selectedSeason: PropTypes.string,
  isAnnualData: PropTypes.bool,
  config: PropTypes.object,
  factsData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

export default SummaryCardsOutput;
