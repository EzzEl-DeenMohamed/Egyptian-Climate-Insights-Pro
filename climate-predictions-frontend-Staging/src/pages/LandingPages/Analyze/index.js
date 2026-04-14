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

// Presentation page sections
// import Counters from "pages/Presentation/sections/Counters";
import Map from "./sections/AnalyzeSection";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

// Images
import bgImage from "../../../assets/images/bg.jpg";

function Analyze() {
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
          <Grid container item xs={12} lg={7} justifyContent="center" mx="auto">
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
              Analyze{" "}
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
              This is the page you can use to analyze data and see future weather forecasts.
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
        {/* Map Section */}
        <Map />
        {/*<Counters />*/}
      </Card>
      <MKBox pt={6} px={1} mt={6}>
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default Analyze;
