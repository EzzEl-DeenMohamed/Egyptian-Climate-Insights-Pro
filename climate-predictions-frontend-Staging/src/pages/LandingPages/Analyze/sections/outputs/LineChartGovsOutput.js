import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Grid, Select, MenuItem, Tooltip, Box, Button, Menu } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MKBox from "components/MKBox";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import jsPDF from "jspdf";
import axios from "axios";
import config from "../../../../../config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

function createPlaceholderGovChartData() {
  const years = [];
  for (let year = 2020; year <= 2030; year++) {
    years.push(year.toString());
  }
  return {
    labels: years,
    datasets: [
      {
        label: "Select Governorate to View Data",
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
}

// eslint-disable-next-line react/prop-types
function LineChartGovsOutput({ inputs, setInputs, climateParameters, Government }) {
  const chartRef = useRef();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handlers for selectors
  const handleParamChange = (e) => {
    setInputs({ ...inputs, selectedParamId: e.target.value });
  };
  const handleSeasonChange = (e) => setInputs({ ...inputs, selectedSeason: e.target.value });
  const handleScenarioChange = (e) =>
    setInputs({ ...inputs, selectedScenarioType: e.target.value });
  const handleStartDateChange = (date) => setInputs({ ...inputs, startDate: date });
  const handleEndDateChange = (date) => setInputs({ ...inputs, endDate: date });

  // Download handlers (filenames adjusted for govs chart)
  const handleDownloadPNG = () => {
    if (chartRef.current) {
      const base64 = chartRef.current.toBase64Image();
      if (base64) {
        const link = document.createElement("a");
        link.href = base64;
        link.download = "govs-line-chart.png";
        link.click();
      }
    }
  };

  const handleDownloadPDF = () => {
    if (chartRef.current) {
      const base64 = chartRef.current.toBase64Image();
      if (base64) {
        const pdf = new jsPDF({ orientation: "landscape" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(base64, "PNG", 10, 10, pageWidth - 20, pageHeight - 20);
        pdf.save("govs-line-chart.pdf");
      }
    }
  };

  const handleDownloadJPEG = () => {
    if (chartRef.current) {
      const base64png = chartRef.current.toBase64Image();
      if (base64png) {
        const img = new window.Image();
        img.src = base64png;
        img.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const jpegUrl = canvas.toDataURL("image/jpeg", 0.92);
          const link = document.createElement("a");
          link.href = jpegUrl;
          link.download = "govs-line-chart.jpg";
          link.click();
        };
      }
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const payload = {
        param_id: inputs.selectedParamId,
        start_year: inputs.startDate?.getFullYear?.(),
        end_year: inputs.endDate?.getFullYear?.(),
        timeframe: inputs.selectedSeason ? inputs.selectedSeason.toLowerCase() : "annual",
        scenario: inputs.selectedScenarioType,
      };
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
        let filename = "govs-line-chart.xlsx";
        const disposition = response.headers["content-disposition"];
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
      console.error("Failed to download Excel file:", error);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // --- Data Fetching Logic ---
  useEffect(() => {
    // Only fetch if all required data is loaded
    if (
      !climateParameters ||
      climateParameters.length === 0 ||
      !inputs.selectedParamId ||
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
          location_codes: [], // always empty for gov chart
          climate_param_ids: [inputs.selectedParamId], // always one param
          start_year: inputs.startDate.getFullYear(),
          end_year: inputs.endDate.getFullYear(),
          timeframe: inputs.selectedSeason ? inputs.selectedSeason.toLowerCase() : "annual",
          // scenario: inputs.selectedScenarioType, // REMOVE scenario from payload
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
          throw new Error("Failed to fetch chart data");
        }
        const rawData = await response.json();
        // Map scenario name to code
        const scenarioMap = {
          Historical: "historical",
          "Lower Emission": "ssp245",
          "Higher Emission": "ssp370",
        };
        const targetScenarioCode = scenarioMap[inputs.selectedScenarioType] || "historical";
        // Only use lines with the correct scenario_code
        const filteredLines = rawData.lines.filter(
          (line) => line.scenario_code === targetScenarioCode
        );
        // Transform the response so that each line is a governorate
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
        filteredLines.forEach((line) => {
          if (Array.isArray(line.time_buckets)) {
            line.time_buckets.forEach((date) => {
              allYearsSet.add(new Date(date).getFullYear().toString());
            });
          }
        });
        const labels = Array.from(allYearsSet).sort();
        const datasets = filteredLines.map((line, idx) => {
          // eslint-disable-next-line react/prop-types
          const gov = Government.find((g) => g.location_info.code === line.location_code);
          const govName = gov ? gov.location_info.name : line.location_code;
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
            label: govName,
            data,
            borderColor: colorPalette[idx % colorPalette.length],
            backgroundColor: colorPalette[idx % colorPalette.length] + "33",
            fill: true,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
          };
        });
        setChartData({ labels, datasets });
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
    inputs.selectedParamId,
    inputs.startDate,
    inputs.endDate,
    climateParameters,
    Government,
  ]);

  return (
    <MKBox py={4} sx={{ position: "relative" }}>
      <Grid container justifyContent="center" spacing={2} alignItems="flex-start" sx={{ mb: 4 }}>
        {/* Climate Parameter Dropdown */}
        <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
          <Tooltip title="Climate Parameter" arrow>
            <div>
              <Select
                value={inputs.selectedParamId || ""}
                onChange={handleParamChange}
                displayEmpty
                fullWidth
                className="climate-dropdown"
                sx={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  "& .MuiSelect-select": { padding: "12px 14px" },
                }}
                renderValue={(selected) => {
                  if (!selected || selected === "") {
                    return "Select Climate Parameter";
                  }
                  const param = climateParameters.find((p) => p.id === selected);
                  return param ? param.name : selected;
                }}
              >
                <MenuItem disabled value="">
                  Select Climate Parameter
                </MenuItem>
                {climateParameters.map((param) => (
                  <MenuItem key={param.id} value={param.id}>
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
                onChange={handleSeasonChange}
                displayEmpty
                fullWidth
                className="season-dropdown"
                sx={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  "& .MuiSelect-select": { padding: "12px 14px" },
                }}
                renderValue={(selected) => {
                  if (!selected) return "Select Season";
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
                value={inputs.selectedScenarioType || ""}
                onChange={handleScenarioChange}
                displayEmpty
                fullWidth
                className="dropdown-select"
                sx={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  "& .MuiSelect-select": { padding: "12px 14px" },
                }}
                renderValue={(selected) => selected || "Select Scenario"}
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
            <div style={{ width: "100%" }}>
              <DatePicker
                selected={inputs.startDate}
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
            <div style={{ width: "100%" }}>
              <DatePicker
                selected={inputs.endDate}
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
            </div>
          </Tooltip>
        </Grid>
      </Grid>
      {/* Placeholder for chart */}
      <Box sx={{ width: "100%", height: 620 }}>
        {isLoading ? (
          <div>Loading chart data...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : chartData ? (
          <Line
            ref={chartRef}
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Governorate Trends" },
              },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: "Year",
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: "Value",
                  },
                },
              },
            }}
          />
        ) : (
          <Line
            ref={chartRef}
            data={createPlaceholderGovChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Governorate Trends" },
              },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: "Year",
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: "Value",
                  },
                },
              },
            }}
          />
        )}
      </Box>
      {/* Download Button and Menu */}
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
              handleDownloadPNG();
            }}
          >
            Download Chart as PNG
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadJPEG();
            }}
          >
            Download Chart as JPEG
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadPDF();
            }}
          >
            Download Chart as PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              handleDownloadExcel();
            }}
          >
            Download Data as Excel
          </MenuItem>
        </Menu>
      </Grid>
    </MKBox>
  );
}

LineChartGovsOutput.propTypes = {
  inputs: PropTypes.object.isRequired,
  setInputs: PropTypes.func.isRequired,
  climateParameters: PropTypes.array.isRequired,
};

export default LineChartGovsOutput;
