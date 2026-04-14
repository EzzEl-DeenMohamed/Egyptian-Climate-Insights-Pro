// Import necessary components and libraries
import React from "react";
import Box from "@mui/material/Box";
import Slider from "react-slick"; // Ensure you've installed react-slick and slick-carousel
import "slick-carousel/slick/slick.css"; // Slick carousel styles
import "slick-carousel/slick/slick-theme.css";

import firstSliderImage from "../../../assets/images/Slider/map-output.png";
import secondSliderImage from "../../../assets/images/Slider/lineChart-output.png";
import thirdSliderImage from "../../../assets/images/Slider/summaryCards-output.png";

const ImageSlider = () => {
  const images = [
    {
      src: firstSliderImage,
      description:
        "Interactive choropleth map displaying Daily Mean Temperature data across Egypt. Shows annual historical climate patterns from 1991-2000, providing a comprehensive view of temperature distribution across all governorates with color-coded visualization for easy interpretation.",
    },
    {
      src: secondSliderImage,
      description:
        "Multi-parameter line chart showcasing climate trends for all parameters including temperature, precipitation, and humidity. Displays annual historical data from 1991-2000 across all of Egypt, enabling users to compare different climate variables and identify temporal patterns and correlations.",
    },
    {
      src: thirdSliderImage,
      description:
        "Summary cards providing key climate insights with statistical overviews. Displays aggregated climate data including averages, trends, and extreme values for all parameters across Egypt. Shows annual historical patterns from 1991-2000, offering quick access to essential climate metrics and comparative analysis in an easy-to-read card format.",
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <Box
      sx={{
        mt: 6,
        mb: 6,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Slider {...sliderSettings} style={{ width: "50%" }}>
        {images.map((image, index) => (
          <Box key={index} sx={{ textAlign: "center" }}>
            <img
              src={image.src}
              alt={`slide-${index}`}
              style={{
                width: "400%", // Adjust this to control the size
                maxWidth: "500px", // Set a fixed max width
                height: "auto", // Maintain aspect ratio
                borderRadius: "30px",
                margin: "0 auto", // Center the image horizontally
              }}
            />
            <p
              style={{
                marginTop: "10px",
                fontSize: "14px",
                color: "#555",
                maxWidth: "80%",
                margin: "10px auto",
              }}
            >
              {image.description}
            </p>
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default ImageSlider;
