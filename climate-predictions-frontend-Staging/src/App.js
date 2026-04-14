import { useEffect } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Material Kit 2 React themes
import theme from "assets/theme";
import Presentation from "layouts/pages/presentation";

// Material Kit 2 React routes
import routes from "routes";
import ClimateChatbot from "components/ClimateChatbot/ClimateChatbot";
import { GlobalDataProvider } from "./pages/LandingPages/Analyze/sections/partials/GlobalDataProvider";

export default function App() {
  const { pathname } = useLocation();

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalDataProvider>
        <Routes>
          {getRoutes(routes)}
          <Route path="/presentation" element={<Presentation />} />
          <Route path="*" element={<Navigate to="/presentation" />} />
        </Routes>
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1300 }}>
          <ClimateChatbot />
        </div>
      </GlobalDataProvider>
    </ThemeProvider>
  );
}
