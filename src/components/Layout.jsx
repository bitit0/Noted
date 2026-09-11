import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import NotesNavbar from "./NotesNavbar";

const Layout = () => {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <NotesNavbar />
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Suspense
          fallback={
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={26} sx={{ color: "primary.main" }} />
            </Box>
          }
        >
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default Layout;
