import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const allMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

// eslint-disable-next-line react/prop-types
const MonthSlider = ({ handleMonthChange, selectedMonth }) => {
  // Always show all months for the slider
  const monthsToShow = allMonths;

  // Map selectedMonth (0-11) to the index in monthsToShow
  const selectedIdx = monthsToShow.findIndex((m) => m === allMonths[selectedMonth]);
  // If not found, default to first month
  const sliderValue = selectedIdx !== -1 ? selectedIdx : 0;

  // Build marks for the slider, bold the selected month
  const marks = monthsToShow.reduce((acc, month, idx) => {
    acc[idx] = <span style={{ fontWeight: idx === sliderValue ? "bold" : "normal" }}>{month}</span>;
    return acc;
  }, {});

  const handleOnChange = (value) => {
    // Map back to the global month index
    const monthName = monthsToShow[value];
    const globalIdx = allMonths.findIndex((m) => m === monthName);
    handleMonthChange(globalIdx);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.75)",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        minWidth: "400px",
      }}
    >
      <div
        style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}
      >
        {/* Intentionally left blank for spacing or add a label if needed */}
      </div>
      <Slider
        min={0}
        max={monthsToShow.length - 1}
        value={sliderValue}
        marks={marks}
        step={null}
        onChange={handleOnChange}
        style={{ height: "40px" }}
        handleStyle={{
          borderColor: "#1976d2",
          backgroundColor: "#1976d2",
        }}
        trackStyle={{ backgroundColor: "rgba(25, 118, 210, 0.3)" }}
        dotStyle={{ borderColor: "#bdbdbd" }}
        activeDotStyle={{ borderColor: "#1976d2" }}
      />
    </div>
  );
};

export default MonthSlider;
