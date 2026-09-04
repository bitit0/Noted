import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "./theme";

// Fonts (bundled locally via @fontsource — no external CDN request).
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

const ThemeContext = createContext({
  mode: "light",
  isDark: false,
  toggleMode: () => {},
  setMode: () => {},
});

const STORAGE_KEY = "noted-color-mode";

function getInitialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* ignore */
  }
  return "light";
}

export function ThemeProviderWrapper({ children }) {
  const [mode, setModeState] = useState(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const setMode = useCallback((next) => {
    if (next === "light" || next === "dark") setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((m) => (m === "light" ? "dark" : "light"));
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({ mode, isDark: mode === "dark", toggleMode, setMode }),
    [mode, toggleMode, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useColorMode = () => useContext(ThemeContext);

// Backwards-compatible alias used by the Tiptap theme toggle.
export const useEditorTheme = () => {
  const { mode, isDark, setMode } = useContext(ThemeContext);
  return { editorTheme: mode, isDark, setEditorTheme: setMode };
};
