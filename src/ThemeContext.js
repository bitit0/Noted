import { createContext, useContext, useState, useMemo, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProviderWrapper({ children }) {
  const [editorTheme, setEditorTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("editor-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setEditorThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("editor-theme", editorTheme);
  }, [editorTheme]);

  const setEditorThemeState = (theme) => {
    if (theme === "light" || theme === "dark") {
      setEditorTheme(theme);
    }
  };

  const value = useMemo(() => ({
    editorTheme,
    setEditorTheme,
    isDark: editorTheme === "dark",
  }), [editorTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useEditorTheme = () => useContext(ThemeContext);