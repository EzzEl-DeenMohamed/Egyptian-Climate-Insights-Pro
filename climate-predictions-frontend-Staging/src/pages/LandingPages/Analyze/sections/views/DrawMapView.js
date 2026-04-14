import React, { useRef } from "react";
import {
  Select,
  MenuItem,
  Grid,
  Container,
  Typography,
  CircularProgress,
  Tooltip,
  Button,
} from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MKBox from "../../../../../components/MKBox";
import { useDrawMapInitialization } from "../partials/useDrawMapInitialization";
import config from "../../../../../config";
import { useGlobalData } from "../partials/GlobalDataProvider";
import style from "../../../../../style/Anlayze/Sections/DatePicker.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Menu from "@mui/material/Menu";
import PropTypes from "prop-types";

const SCENARIOS = [
  { label: "Historical", value: "historical" },
  { label: "Lower Emission", value: "ssp245" },
  { label: "Higher Emission", value: "ssp370" },
];

function DrawMapView({
  inputs,
  setInputs,
  images,
  setImages,
  error,
  setError,
  downloadAnchorEl,
  setDownloadAnchorEl,
}) {
  const mapRef = useRef(null);
  const { drawnGeoJsons } = useDrawMapInitialization(mapRef);

  // --- Global Data ---
  const { climateParameters } = useGlobalData();

  // --- State ---
  const downloadMenuOpen = Boolean(downloadAnchorEl);

  // --- Handlers ---
  const handleChange = (field) => (event) => {
    setInputs((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleStartDateChange = (date) => {
    setInputs((prev) => ({ ...prev, startYear: date }));
  };
  const handleEndDateChange = (date) => {
    setInputs((prev) => ({ ...prev, endYear: date }));
  };

  // Remove the button and useEffect for auto-fetch
  React.useEffect(() => {
    setImages([]);
    setError("");
    if (
      !inputs.paramId ||
      !inputs.season ||
      !inputs.scenario ||
      !inputs.startYear ||
      !inputs.endYear ||
      !drawnGeoJsons ||
      drawnGeoJsons.length === 0
    ) {
      return;
    }
    const newImages = Array(drawnGeoJsons.length)
      .fill()
      .map(() => ({ url: null, loading: true, error: null }));
    setImages(newImages);
    drawnGeoJsons.forEach(async (feature, idx) => {
      try {
        const payload = {
          climate_param_ids: [inputs.paramId],
          scenario_codes: [inputs.scenario],
          start_year: inputs.startYear?.getFullYear?.(),
          end_year: inputs.endYear?.getFullYear?.(),
          timeframe: inputs.season.toLowerCase(),
          geojson: { type: "FeatureCollection", features: [feature] },
        };
        const response = await fetch(
          `${config.API_BASE_URL}/climate/analysis/downloads/choropleth-map`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) throw new Error("Failed to fetch map image");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImages((prev) => {
          const updated = [...prev];
          updated[idx] = { url, loading: false, error: null };
          return updated;
        });
      } catch (err) {
        setImages((prev) => {
          const updated = [...prev];
          updated[idx] = { url: null, loading: false, error: err.message || "Error" };
          return updated;
        });
      }
    });
  }, [
    inputs.paramId,
    inputs.season,
    inputs.scenario,
    inputs.startYear,
    inputs.endYear,
    drawnGeoJsons,
    setImages,
    setError,
  ]);

  // Download Excel handler
  const handleDownloadExcel = async () => {
    try {
      const payload = {
        climate_param_ids: [inputs.paramId],
        scenario_codes: [inputs.scenario],
        start_year: inputs.startYear?.getFullYear?.(),
        end_year: inputs.endYear?.getFullYear?.(),
        timeframe: inputs.season.toLowerCase(),
        geojson:
          drawnGeoJsons && drawnGeoJsons.length > 0
            ? { type: "FeatureCollection", features: drawnGeoJsons }
            : undefined,
      };
      const response = await fetch(`${config.API_BASE_URL}/climate/analysis/downloads/excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to download Excel file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "climate-map-data.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download Excel file");
    }
  };

  // Download all images as PNGs (zipped if multiple)
  const handleDownloadImages = async () => {
    if (!images || images.length === 0) return;
    if (images.length === 1 && images[0].url) {
      // Single image, download directly
      const link = document.createElement("a");
      link.href = images[0].url;
      link.setAttribute("download", `climate-map-output.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    // Multiple images: zip them
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    await Promise.all(
      images.map(async (img, idx) => {
        if (img.url) {
          const response = await fetch(img.url);
          const blob = await response.blob();
          zip.file(`climate-map-output-${idx + 1}.png`, blob);
        }
      })
    );
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "climate-map-outputs.zip");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadMenuClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };

  return (
    <MKBox component="section" py={5} sx={{ position: "relative" }}>
      <Container>
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
                  value={inputs.paramId}
                  onChange={handleChange("paramId")}
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
                  value={inputs.season}
                  onChange={handleChange("season")}
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
                  value={inputs.scenario}
                  onChange={handleChange("scenario")}
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
                    if (!selected) return "Select Scenario";
                    const found = SCENARIOS.find((s) => s.value === selected);
                    return found ? found.label : selected;
                  }}
                >
                  <MenuItem value="historical">Historical</MenuItem>
                  <MenuItem value="ssp245">Lower Emission</MenuItem>
                  <MenuItem value="ssp370">Higher Emission</MenuItem>
                </Select>
              </div>
            </Tooltip>
          </Grid>

          {/* Start Year DatePicker */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="Start Date" arrow>
              <div className={style.dateInput} style={{ width: "100%" }}>
                <DatePicker
                  selected={inputs.startYear}
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

          {/* End Year DatePicker */}
          <Grid item style={{ minWidth: 220, maxWidth: 220 }}>
            <Tooltip title="End Date" arrow>
              <div className={style.dateInput} style={{ width: "100%" }}>
                <DatePicker
                  selected={inputs.endYear}
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
        <MKBox
          height="550px"
          borderRadius="16px"
          overflow="hidden"
          sx={{
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            border: "5px solid rgba(0, 0, 0, 0.2)",
            padding: "5px",
            position: "relative",
            mb: 3,
          }}
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </MKBox>
        <MKBox
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          mt={4}
          sx={{
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
            padding: 4,
            gap: 4,
            flexWrap: "wrap",
            minHeight: 620,
            minWidth: 620,
            maxWidth: "100%",
            position: "relative",
          }}
        >
          {/* Images in rows of 2, center if only one in row */}
          {images.length === 0 || images.every((img) => !img.url && !img.loading && !img.error) ? (
            <Typography
              variant="h6"
              color={error ? "error" : "text"}
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                px: 3,
                py: 2,
                borderRadius: 2,
                boxShadow: 3,
                m: "auto",
                textAlign: "center",
                width: "100%",
                alignSelf: "center",
              }}
            >
              {error
                ? error || "An error occurred while fetching map data."
                : "No output yet. Draw polygons and select parameters to view the map images."}
            </Typography>
          ) : (
            <>
              {Array.from({ length: Math.ceil(images.length / 2) }).map((_, rowIdx) => {
                const rowImages = images.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <div
                    key={rowIdx}
                    style={{
                      display: "flex",
                      justifyContent: rowImages.length === 1 ? "center" : "space-between",
                      width: "100%",
                      marginBottom: 24,
                      gap: 32,
                    }}
                  >
                    {rowImages.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          textAlign: "center",
                          background: "#f7f7f7",
                          borderRadius: 12,
                          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
                          margin: 0,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: 520,
                          minWidth: 520,
                          maxWidth: 520,
                          minHeight: 500,
                          boxSizing: "border-box",
                        }}
                      >
                        {img.loading && <CircularProgress sx={{ my: 2 }} />}
                        {img.error && (
                          <Typography color="error" variant="body2" sx={{ my: 2 }}>
                            {img.error}
                          </Typography>
                        )}
                        {img.url && (
                          <img
                            src={img.url}
                            alt={`Map Output ${rowIdx * 2 + idx + 1}`}
                            style={{
                              width: "100%",
                              height: 600,
                              objectFit: "contain",
                              borderRadius: 8,
                              background: "#eaeaea",
                              boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </MKBox>
        <Grid container justifyContent="center" mb={2} mt={2}>
          <Button
            variant="contained"
            className="common-button"
            onClick={handleDownloadMenuClick}
            endIcon={<KeyboardArrowDownIcon />}
            disabled={
              !inputs.paramId ||
              !inputs.season ||
              !inputs.scenario ||
              !inputs.startYear ||
              !inputs.endYear ||
              !drawnGeoJsons ||
              drawnGeoJsons.length === 0
            }
            sx={{ mb: 2 }}
          >
            Download
          </Button>
          <Menu
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
              onClick={async () => {
                handleDownloadMenuClose();
                await handleDownloadImages();
              }}
            >
              Download Map Image(s) (PNG)
            </MenuItem>
          </Menu>
        </Grid>
      </Container>
    </MKBox>
  );
}

DrawMapView.propTypes = {
  inputs: PropTypes.shape({
    paramId: PropTypes.string.isRequired,
    season: PropTypes.string.isRequired,
    scenario: PropTypes.string.isRequired,
    startYear: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]),
    endYear: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]),
  }).isRequired,
  setInputs: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      loading: PropTypes.bool,
      error: PropTypes.string,
    })
  ).isRequired,
  setImages: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  setError: PropTypes.func.isRequired,
  downloadAnchorEl: PropTypes.any,
  setDownloadAnchorEl: PropTypes.func.isRequired,
};

export default DrawMapView;
