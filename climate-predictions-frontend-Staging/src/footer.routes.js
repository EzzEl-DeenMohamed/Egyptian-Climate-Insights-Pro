// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import YouTubeIcon from "@mui/icons-material/YouTube";

// Material Kit 2 React components
import MKTypography from "components/MKTypography";

// Images
import logo from "assets/images/logo.webp";

const date = new Date().getFullYear();

export default {
  brand: {
    name: "Egyptian Climate Insights Pro",
    image: logo,
    route: "/",
  },
  socials: [
    {
      icon: <FacebookIcon />,
    },
    {
      icon: <TwitterIcon />,
    },
    {
      icon: <GitHubIcon />,
    },
    {
      icon: <YouTubeIcon />,
    },
  ],
  menus: [
    {
      name: "company",
      items: [
        { name: "about us", route: "/about-us" },
        { name: "freebies" },
        { name: "premium tools" },
        { name: "blog" },
      ],
    },
    {
      name: "resources",
      items: [
        {
          name: "Climate Change | UNICEF Egypt",
          href: "https://www.unicef.org/egypt/climate-change",
        },
        {
          name: "Climate Change in Egypt: Opportunities and Obstacles",
          href: "https://carnegieendowment.org/2023/10/26/climate-change-in-egypt-opportunities-and-obstacles-pub-90854",
        },
        {
          name: "Egypt National Climate Change Strategy (NCCS)",
          href: "https://beta.sis.gov.eg/en/media-center/strategies/egypt-national-climate-change-strategy-nccs-2050/",
        },
      ],
    },
    {
      name: "help & support",
      items: [
        { name: "contact us", route: "/contact-us" },
        { name: "knowledge center" },
        { name: "custom development" },
        { name: "sponsorships" },
      ],
    },
    {
      name: "legal",
      items: [
        { name: "terms & conditions" },
        { name: "privacy policy" },
        { name: "licenses (EULA)" },
      ],
    },
  ],
  copyright: (
    <MKTypography variant="button" fontWeight="regular" color="white">
      All rights reserved. Copyright &copy; {date} Egyptian Climate Insights Pro
    </MKTypography>
  ),
};
