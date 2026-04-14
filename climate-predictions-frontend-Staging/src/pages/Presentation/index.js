// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// import MKSocialButton from "components/MKSocialButton";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";
import FilledInfoCard from "examples/Cards/InfoCards/FilledInfoCard";

// Presentation page sections
import Counters from "pages/Presentation/sections/Counters";
import Information from "pages/Presentation/sections/Information";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

// Images
import bgImage from "../../assets/images/bg.jpg";

// Import the ImageSlider component
import ImageSlider from "pages/Presentation/sections/imageSlider";

function Presentation() {
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
              Egyptian Climate Insights Pro{" "}
            </MKTypography>
            <MKTypography
              variant="body1"
              color="white"
              bold
              textAlign="center"
              px={{ xs: 6, lg: 12 }}
              mt={1}
              sx={{
                textShadow: "0px 0px 3px black",
              }}
            >
              Analyze the Egyptian Climate Change and know the future weather forecast based on the
              existing data.
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
        <Counters />
        <Information />
        <ImageSlider />
        <Container>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <FilledInfoCard
                variant="gradient"
                color="dark"
                icon="analytics"
                title="Analyzing"
                description="Analyze The Egyptian Climate Change and know the future weather forecast based on the existing data."
                action={{
                  type: "internal",
                  route: "/analyze",
                  label: "Let's start Analyzing",
                }}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <FilledInfoCard
                variant="gradient"
                color="dark"
                icon="compare_arrows"
                title="Comparing"
                description="Compare the weather data of different cities and know the difference in the weather conditions."
                action={{
                  type: "internal",
                  route: "/analyze",
                  label: "Let's start Comparing",
                }}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <FilledInfoCard
                variant="gradient"
                color="dark"
                icon="flag"
                title="How to contact us"
                description="If you have any questions or need help, Don't worry! We are here to help you! just contact us."
                action={{
                  type: "internal",
                  route: "/contact-us",
                  label: "Contact Us",
                }}
              />
            </Grid>
          </Grid>
        </Container>
        <MKBox pt={18} pb={6}>
          <Container>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={5} ml="auto" sx={{ textAlign: { xs: "center", lg: "left" } }}>
                <MKTypography variant="h4" fontWeight="bold" mb={0.5}>
                  Thank you for your support!
                </MKTypography>
                <MKTypography variant="body1" color="text">
                  Egyptian Climate Insights Pro.
                </MKTypography>
              </Grid>
              <Grid
                item
                xs={12}
                lg={5}
                my={{ xs: 5, lg: "auto" }}
                mr={{ xs: 0, lg: "auto" }}
                sx={{ textAlign: { xs: "center", lg: "right" } }}
              ></Grid>
            </Grid>
          </Container>
        </MKBox>
      </Card>
      <MKBox pt={6} px={1} mt={6}>
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default Presentation;
