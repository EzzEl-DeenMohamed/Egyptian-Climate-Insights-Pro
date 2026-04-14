// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

// Material Kit 2 React components
import MKBox from "components/MKBox";

// Material Kit 2 React examples
import RotatingCard from "examples/Cards/RotatingCard";
import RotatingCardFront from "examples/Cards/RotatingCard/RotatingCardFront";
import RotatingCardBack from "examples/Cards/RotatingCard/RotatingCardBack";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";

// Images
import rotatingImage from "assets/images/logo.webp";

function Information() {
  return (
    <MKBox component="section" py={6} my={6}>
      <Container>
        <Grid container item xs={11} spacing={3} alignItems="center" sx={{ mx: "auto" }}>
          <Grid item xs={12} lg={5} sx={{ mx: "auto" }}>
            <RotatingCard>
              <RotatingCardFront
                image={rotatingImage}
                icon="touch_app"
                color="dark"
                title={
                  <>
                    Egyptian Climate
                    <br />
                    Insights Pro
                  </>
                }
                description="The Egyptian Climate Insights Pro is a web application that predicts the climate of Egypt based on the given dataset."
              ></RotatingCardFront>
              <RotatingCardBack
                image={rotatingImage}
                title="Discover More"
                description="You can find more about the Egyptian Climate Insights Pro by visiting the about us page."
                color="dark"
                action={{
                  type: "internal",
                  route: "/about-us",
                  label: "Know More",
                }}
              ></RotatingCardBack>
            </RotatingCard>
          </Grid>
          <Grid item xs={12} lg={7} sx={{ ml: "auto" }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DefaultInfoCard
                  icon="data_usage"
                  title="Data-Driven Insights"
                  color="darkYellow"
                  description="The ECIP platform leverages historical and real-time data to provide detailed insights into climate patterns across Egypt."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DefaultInfoCard
                  icon="science"
                  title="Scientific Accuracy"
                  color="darkYellow"
                  description="Built on robust algorithms, the predictor delivers reliable forecasts to help communities and policymakers plan effectively."
                />
              </Grid>
            </Grid>
            <Grid container spacing={3} sx={{ mt: { xs: 0, md: 6 } }}>
              <Grid item xs={12} md={6}>
                <DefaultInfoCard
                  icon="eco"
                  title="Sustainable Planning"
                  color="darkYellow"
                  description="Empowering users to make informed decisions that contribute to environmental sustainability and resilience."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DefaultInfoCard
                  icon="public"
                  title="Nationwide Coverage"
                  color="darkYellow"
                  description="Providing comprehensive predictions tailored to Egypt's diverse geographical regions, from the Nile Delta to the desert."
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </MKBox>
  );
}

export default Information;
