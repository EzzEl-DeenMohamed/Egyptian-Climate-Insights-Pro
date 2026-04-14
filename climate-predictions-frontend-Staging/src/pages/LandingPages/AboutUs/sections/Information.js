// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

// Material Kit 2 React components
import MKBox from "components/MKBox";

// Material Kit 2 React examples
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";

function Information() {
  return (
    <MKBox component="section" py={12}>
      <Container>
        <Grid container spacing={3} alignItems="center">
          {/* First Row */}
          <Grid item xs={12} lg={6}>
            <MKBox mb={5}>
              <DefaultInfoCard
                icon="public"
                title="Fully Integrated Climate Insights"
                description="We bring together historical data, real-time analytics, and advanced algorithms to deliver fully integrated climate insights. Our platform ensures that users across Egypt can access seamless, accurate forecasts in one place, empowering them to make informed decisions based on comprehensive and up-to-date climate data."
                color="darkYellow"
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={5}>
              <DefaultInfoCard
                icon="verified"
                title="Trustworthy Forecasts"
                description="With a foundation built on scientific accuracy, our climate forecasts are designed to build trust with our users. We understand that reliable data is essential, and we ensure that every prediction is based on rigorous algorithms and peer-reviewed research. Our platform’s consistency helps foster trust among policymakers, businesses, and individuals alike."
                color="darkYellow"
              />
            </MKBox>
          </Grid>

          {/* Second Row */}
          <Grid item xs={12} lg={6}>
            <MKBox mb={5}>
              <DefaultInfoCard
                icon="insights"
                title="Enhanced Sustainability"
                description="We focus on improving environmental sustainability by providing actionable insights that help users make responsible decisions. From promoting energy-efficient practices to preparing for climate challenges, our platform supports sustainable development in Egypt. With our accurate and timely forecasts, we help communities and businesses minimize their environmental impact and build resilience against climate changes."
                color="darkYellow"
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={5}>
              <DefaultInfoCard
                icon="apps"
                title="Prebuilt Predictive Models"
                description="Our platform offers prebuilt predictive models that help users forecast climate conditions with precision. These models are designed to adapt to Egypt’s unique geography and climate, providing accurate predictions for different regions. By using sophisticated technology, we give users the tools they need to plan and act on the insights provided, no matter their location."
                color="darkYellow"
              />
            </MKBox>
          </Grid>
        </Grid>
      </Container>
    </MKBox>
  );
}

export default Information;
