import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Grid, CircularProgress, Typography, Button, Menu, MenuItem, Box } from "@mui/material";
import MKBox from "components/MKBox";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import jsPDF from "jspdf";
import axios from "axios";
import config from "../../../../../config";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = config.API_BASE_URL;

function LineChartParametersOutput({
  chartData,
  isLoading,
  error,
  locationName,
  selectedScenario,
  ...props
}) {
  const chartRef = useRef();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Remove useEffect that fetches data
  // Only render based on chartData, isLoading, and error props

  // Download handlers
  const handleDownloadPNG = () => {
    if (chartRef.current) {
      const base64 = chartRef.current.toBase64Image();
      if (base64) {
        const link = document.createElement("a");
        link.href = base64;
        link.download = "climate-line-chart.png";
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
        pdf.save("climate-line-chart.pdf");
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
          link.download = "climate-line-chart.jpg";
          link.click();
        };
      }
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const payload = {
        location_code: props.locationCode,
        start_year: props.startYear,
        end_year: props.endYear,
        timeframe: props.timeframe,
      };

      const response = await axios.post(
        `${API_BASE_URL}/climate/analysis/downloads/excel`,
        payload,
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );

      const blob = response.data;
      const reader = new FileReader();
      reader.onloadend = function () {
        const url = reader.result;
        const link = document.createElement("a");
        const disposition = response.headers["content-disposition"];
        let filename = "climate-line-chart.xlsx";
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
      // You could add a toast notification here if you have a notification system
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const showTitle = locationName && props.startYear && props.endYear && selectedScenario;
  const chartTitle = showTitle
    ? `Climate Parameters Trends - ${locationName} (${selectedScenario}) (${props.startYear}-${
        props.endYear
      })${props.timeframe ? ` [${props.timeframe}]` : ""}`
    : "";

  return (
    <MKBox py={4} sx={{ position: "relative" }}>
      {isLoading && (
        <Grid container justifyContent="center" sx={{ mb: 3 }}>
          <Grid item>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
              Loading chart data...
            </Typography>
          </Grid>
        </Grid>
      )}

      {error && (
        <Typography variant="body1" color="error" sx={{ textAlign: "center", mt: 2 }}>
          {error}
        </Typography>
      )}

      {chartData && !isLoading && !error && (
        <Box sx={{ width: "100%", height: 620 }}>
          <Line
            ref={chartRef}
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "top" },
                title: { display: !!chartTitle, text: chartTitle },
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
        </Box>
      )}

      {chartData && (
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
      )}
    </MKBox>
  );
}

LineChartParametersOutput.propTypes = {
  chartData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  climateParameters: PropTypes.array,
  locationName: PropTypes.string,
  selectedScenario: PropTypes.string,
  locationCode: PropTypes.string.isRequired,
  startYear: PropTypes.number.isRequired,
  endYear: PropTypes.number.isRequired,
  timeframe: PropTypes.string.isRequired,
};

export default LineChartParametersOutput;
