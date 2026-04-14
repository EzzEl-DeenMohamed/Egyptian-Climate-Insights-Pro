// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";

// About Us page sections
import Newsletter from "pages/LandingPages/AboutUs/sections/Newsletter";
import Information from "pages/LandingPages/AboutUs/sections/Information";
import Team from "pages/LandingPages/AboutUs/sections/Team";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

// Images
import bgImage from "../../../assets/images/bg.jpg";
import { Link } from "react-router-dom"; // Import Link from React Router
import Button from "@mui/material/Button"; // Import Button

function AboutUs() {
  return (
    <>
      <DefaultNavbar routes={routes} sticky />

      <MKBox
        minHeight="75vh"
        width="100%"
        sx={{
          backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.dark.main, 0.6),
              rgba(gradients.dark.state, 0.6)
            )}, url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Container>
          <Grid
            container
            item
            xs={12}
            lg={8}
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            sx={{ mx: "auto", textAlign: "center" }}
          >
            {/* Heading */}
            <MKTypography
              variant="h1"
              color="white"
              bold
              mt={-6}
              mb={1}
              sx={({ breakpoints, typography: { size } }) => ({
                textShadow: "0px 0px 4px black",
                [breakpoints.down("md")]: {
                  fontSize: size["3xl"],
                },
              })}
            >
              About Us
            </MKTypography>

            {/* Description */}
            <MKTypography
              vvariant="body1"
              color="white"
              bold
              textAlign="center"
              px={{ xs: 6, lg: 12 }}
              mt={1}
              sx={{
                textShadow: "0px 0px 3px black",
              }}
            >
              Atlas Climate Insights Platform (ECIP) provides reliable, Egypt-focused climate
            </MKTypography>
          </Grid>
        </Container>
      </MKBox>
      <Card
        sx={{
          p: 2,
          mx: { xs: 2, lg: 3 },
          mt: -8,
          mb: 4,
          backgroundColor: ({ palette: { white }, functions: { rgba } }) => rgba(white.main, 0.8),
          backdropFilter: "saturate(200%) blur(30px)",
          boxShadow: ({ boxShadows: { xxl } }) => xxl,
        }}
      >
        <Newsletter />
        <Information />
        <Team />
      </Card>
      {/* Contact Us Button - Centered */}
      <Grid container justifyContent="center" alignItems="center" sx={{ mt: 4 }}>
        <Button
          component={Link}
          to="/contact-us"
          variant="contained"
          sx={{
            backgroundColor: "#1a1a1a", // Dark black background
            color: "white", // White text
            fontSize: "1.1rem", // Slightly larger text
            fontWeight: "bold",
            padding: "12px 24px", // Bigger padding for better UX
            borderRadius: "30px", // Rounded edges
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle shadow
            textTransform: "none", // Ensure text stays as typed
            "&:hover": {
              backgroundColor: "#333333", // Slightly lighter black on hover
              transform: "scale(1.05)", // Slight pop effect
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.4)", // More shadow on hover
            },
          }}
        >
          Contact Us
        </Button>
      </Grid>

      <MKBox pt={6} px={1} mt={6}>
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default AboutUs;
