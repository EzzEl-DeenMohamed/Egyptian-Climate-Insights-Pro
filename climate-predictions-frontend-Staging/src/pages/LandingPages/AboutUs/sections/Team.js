// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

// Material Kit 2 React examples
import HorizontalTeamCard from "examples/Cards/TeamCards/HorizontalTeamCard";

// Images
import Ezz from "assets/images/team/ezz.jpg";
import Amr from "assets/images/team/Amr.jpg";
import Maram from "assets/images/team/Maram.jpg";
import monem from "assets/images/team/mn3em.jpg";
import karem from "assets/images/team/karem.jpg";
import malak from "assets/images/team/malak.jpg";

function Team() {
  return (
    <MKBox
      component="section"
      variant="gradient"
      bgColor="dark"
      position="relative"
      py={6}
      px={{ xs: 2, lg: 0 }}
      mx={-2}
    >
      <Container>
        <Grid container>
          <Grid item xs={12} md={8} sx={{ mb: 6 }}>
            <MKTypography variant="h3" color="white">
              The Executive Team
            </MKTypography>
            <MKTypography variant="body2" color="white" opacity={0.8}>
              There&apos;s nothing I really wanted to do in life that I wasn&apos;t able to get good
              at. That&apos;s my skill.
            </MKTypography>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <MKBox mb={1}>
              <HorizontalTeamCard
                image={Ezz}
                name={
                  <MKBox display="flex" alignItems="center">
                    Ezzeldeen Mohamed
                    <a
                      href="https://www.linkedin.com/in/ezz-el-deen-mohamed-090133223/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                    <a
                      href="https://github.com/EzzEl-DeenMohamed"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <GitHubIcon style={{ marginLeft: "4px", color: "#333" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "Backend Developer" }}
                description="A skilled backend software developer, specializing in .NET, Laravel, and Python. Focused on creating efficient, maintainable systems and delivering quality results."
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={1}>
              <HorizontalTeamCard
                image={Amr}
                name={
                  <MKBox display="flex" alignItems="center">
                    Amr Abdeltawab
                    <a
                      href="https://www.linkedin.com/in/amr-abd-eltawab-a67b1b240"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                    <a
                      href="https://github.com/amr-abdeltawab-ahmed"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <GitHubIcon style={{ marginLeft: "4px", color: "#333" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "Full Stack Developer" }}
                description="A Full Stack Developer proficient in Python, with expertise in creating dynamic user interfaces. Skilled in writing efficient scripts and delivering robust full-stack solutions."
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={{ xs: 1, lg: 0 }}>
              <HorizontalTeamCard
                image={monem}
                name={
                  <MKBox display="flex" alignItems="center">
                    Abdelmonem Tarek
                    <a
                      href="https://www.linkedin.com/in/monaem-tarek/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                    <a
                      href="https://github.com/mn3mnn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <GitHubIcon style={{ marginLeft: "4px", color: "#333" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "Backend Developer" }}
                description="Passionate About Data Engineering and ML."
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={{ xs: 1, lg: 0 }}>
              <HorizontalTeamCard
                image={Maram}
                name={
                  <MKBox display="flex" alignItems="center">
                    Maram Wael
                    <a
                      href="https://www.linkedin.com/in/maram-w-a1ba3b268/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                    <a
                      href="https://github.com/maramwael188"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <GitHubIcon style={{ marginLeft: "4px", color: "#333" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "MERN Stack Developer" }}
                description="A dedicated MERN Stack Developer with a passion for crafting innovative and user-friendly web applications. With expertise in MongoDB, Express.js, React.js, and Node.js."
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={{ xs: 1, lg: 0 }}>
              <HorizontalTeamCard
                image={karem}
                name={
                  <MKBox display="flex" alignItems="center">
                    Youssef Karem
                    <a
                      href="https://www.linkedin.com/in/youssef-karem-6896132a7/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "Data Analyst" }}
                description="Data Analyst with a keen eye for uncovering insights from complex datasets. Proficient in SQL, Python, and data visualization tools to drive data-driven decisions."
              />
            </MKBox>
          </Grid>
          <Grid item xs={12} lg={6}>
            <MKBox mb={{ xs: 1, lg: 0 }}>
              <HorizontalTeamCard
                image={malak}
                name={
                  <MKBox display="flex" alignItems="center">
                    Malak Walid
                    <a
                      href="https://www.linkedin.com/in/malak-walid-783899304/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <LinkedInIcon style={{ marginLeft: "87px", color: "#0077B5" }} />
                    </a>
                    <a
                      href="https://github.com/malakwalid32"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                    >
                      <GitHubIcon style={{ marginLeft: "4px", color: "#333" }} />
                    </a>
                  </MKBox>
                }
                position={{ color: "info", label: "Software Developer" }}
                description="A skilled software developer."
              />
            </MKBox>
          </Grid>
        </Grid>
      </Container>
    </MKBox>
  );
}

export default Team;
