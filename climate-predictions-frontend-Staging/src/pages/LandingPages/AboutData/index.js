import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Material Kit 2 React examples
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import DefaultFooter from "examples/Footers/DefaultFooter";

// Routes
import routes from "routes";
import footerRoutes from "footer.routes";

// Images
import bgImage from "../../../assets/images/bg.jpg";

function AboutData() {
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
              About Data
            </MKTypography>

            {/* Intro */}
            <MKTypography
              variant="body1"
              color="white"
              bold
              textAlign="center"
              px={{ xs: 6, lg: 12 }}
              mt={1}
              sx={{ textShadow: "0px 0px 3px black" }}
            >
              Atlas Climate Data - Egypt-focused climate
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
        <Container>
          {/* Data Sources */}
          <MKTypography variant="h4" mb={1} color="dark" fontWeight="bold">
            Data Sources
          </MKTypography>
          <MKTypography variant="body2" color="text" mb={3}>
            We use data from trusted global platforms like <b>LLNL’s AIMS and PCMDI (USA)</b> and{" "}
            <b>CNRM-CERFACS (France)</b>. These organizations share detailed climate model outputs
            through the <b>Earth System Grid Federation (ESGF)</b>, giving us access to hundreds of
            high-quality simulations. Our main datasets include <b>CRU</b> and <b>CMIP6</b> climate
            data.
          </MKTypography>

          {/* Processing Flow */}
          <MKTypography variant="h4" mb={1} color="dark" fontWeight="bold">
            Processing Flow
          </MKTypography>
          <MKTypography variant="body2" color="text" mb={3}>
            <ul>
              <li>
                <b>Data Ingestion:</b> Load NetCDF files for climate variables and geodatabase for
                district geometries. Clip data to Egypt’s land boundaries and filter time periods.
              </li>
              <li>
                <b>Data Validation:</b> Exclude missing or invalid data points.
              </li>
              <li>
                <b>Transformations:</b> Apply calculations (e.g., temperature conversion, vapor
                pressure from humidity and temperature).
              </li>
              <li>
                <b>Processing:</b> Process data in parallel for efficiency.
              </li>
              <li>
                <b>Database Storage:</b> Store processed data in a time-series database, committing
                in batches.
              </li>
              <li>
                <b>Aggregation:</b> Create aggregated views by governorate, year, season, and
                scenario, calculating averages, sums, minimums, and maximums.
              </li>
            </ul>
          </MKTypography>

          {/* Climate Models */}
          <MKTypography variant="h4" mb={1} color="dark" fontWeight="bold">
            Climate Models
          </MKTypography>
          <MKTypography variant="body2" color="text" mb={3}>
            We use well-known models like <b>CNRM-CM6-1</b>, <b>MPI-ESM1-2</b>, and <b>CESM2</b> to
            simulate climate variables such as temperature, rainfall, humidity, and extreme weather.
            These models include the effects of land, oceans, and human emissions, helping us
            analyze heatwaves, drought risk, and water availability for Egypt. Projections cover
            both historical data (since 1850) and future periods up to 2100.
          </MKTypography>

          {/* Transparency & Updates */}
          <MKTypography variant="h4" mb={1} color="dark" fontWeight="bold">
            Transparency & Updates
          </MKTypography>
          <MKTypography variant="body2" color="text" mb={3}>
            Our data is open, transparent, and regularly updated. We include metadata explaining
            which model was used, how many versions were run, and under what conditions.
            Model-specific notes, limitations, and corrections are always provided.
          </MKTypography>

          {/* Our Goal */}
          <MKTypography variant="h4" mb={1} color="dark" fontWeight="bold">
            Our Goal
          </MKTypography>
          <MKTypography variant="body2" color="text" mb={3}>
            We aim to support climate planning, agriculture, water management, education, and public
            awareness in Egypt. Whether you are a researcher, student, policy-maker, or simply
            curious, ECIP provides reliable, Egypt-focused climate predictions to help you
            understand and prepare for the future.
          </MKTypography>
        </Container>
      </Card>
      <MKBox pt={6} px={1} mt={6}>
        <DefaultFooter content={footerRoutes} />
      </MKBox>
    </>
  );
}

export default AboutData;
