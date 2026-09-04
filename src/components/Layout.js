import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
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
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
