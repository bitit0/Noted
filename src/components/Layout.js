import React from "react";
import { Outlet } from "react-router-dom";
import NotesNavbar from "./NotesNavbar";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { useEditorTheme } from "../ThemeContext"

const getInitialMode = () => {
  return localStorage.getItem("colorMode") || "light";
};

const Layout = () => {

  const [mode, setMode] = useState(getInitialMode);
  const { editorTheme } = useEditorTheme();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: editorTheme,
        },
      }),
    [editorTheme]
  );

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotesNavbar />
        <main>
          <Outlet />
        </main>
      </ThemeProvider>
    </>
  );
};

export default Layout;