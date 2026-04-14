import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";
import PropTypes from "prop-types";

const LoadingOverlay = ({ message = "Loading...", zIndex = 1000, blockPointerEvents = false }) => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex,
      background: "rgba(255,255,255,0.7)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: 1,
      transition: "opacity 0.3s",
      pointerEvents: blockPointerEvents ? "auto" : "none",
    }}
    aria-busy="true"
    aria-live="polite"
  >
    <CircularProgress size={48} />
    <Typography variant="body1" sx={{ mt: 2 }}>
      {message}
    </Typography>
  </Box>
);

LoadingOverlay.propTypes = {
  message: PropTypes.string,
  zIndex: PropTypes.number,
  blockPointerEvents: PropTypes.bool,
};

export default LoadingOverlay;
