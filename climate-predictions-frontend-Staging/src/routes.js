import AboutUs from "layouts/pages/landing-pages/about-us";
import ContactUs from "layouts/pages/landing-pages/contact-us";
import Analyze from "layouts/pages/landing-pages/analyze";
import Presentation from "layouts/pages/presentation";
import AboutDataPage from "layouts/pages/landing-pages/about-Data";
// import Compare from "layouts/pages/landing-pages/compare";

const routes = [
  {
    name: "home",
    route: "/presentation",
    component: <Presentation />,
  },
  {
    name: "analyze",
    route: "/analyze",
    component: <Analyze />,
  },
  {
    name: "about us",
    route: "/about-us",
    component: <AboutUs />,
  },
  {
    name: "about data",
    route: "/about-data",
    component: <AboutDataPage />,
  },
  {
    name: "contact us",
    route: "/contact-us",
    component: <ContactUs />,
  },
];

export default routes;
