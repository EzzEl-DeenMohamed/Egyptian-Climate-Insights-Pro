// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";
// Images
import aboutUs from "assets/images/logo.webp";

function Newsletter() {
  return (
    <MKBox component="section" pt={6} my={6}>
      <Container>
        <Grid container alignItems="center">
          <Grid item sx={12} md={6}>
            <MKTypography variant="h4">Our Mission</MKTypography>
            <MKTypography
              variant="body2"
              color="text"
              mb={3}
              sx={{ fontSize: { xs: "14px", md: "15px", lg: "17px" } }}
            >
              <p>
                We are dedicated to delivering precise, data-driven climate predictions that empower
                individuals, communities, and policymakers to make informed, effective decisions. By
                focusing on Egypt&apos;s diverse regions, our platform combines historical data with
                real-time analytics to provide actionable insights for sustainable development and
                climate resilience. Our commitment to studying climate data patterns across Egypt
                ensures users receive up-to-date information to anticipate and respond to climate
                changes effectively. From forecasting temperature shifts to predicting rainfall
                patterns, we equip our users with the knowledge they need to stay informed,
                prepared, and ready to build a sustainable future.
              </p>
            </MKTypography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ ml: "auto" }}>
            <MKBox position="relative">
              <MKBox component="img" src={aboutUs} alt="aboutUs" width="100%" />
            </MKBox>
          </Grid>
        </Grid>
      </Container>
    </MKBox>
  );
}

export default Newsletter;
