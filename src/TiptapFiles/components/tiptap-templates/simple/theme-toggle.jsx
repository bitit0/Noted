"use client"

import * as React from "react"

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "../../tiptap-icons/moon-star-icon"
import { SunIcon } from "../../tiptap-icons/sun-icon"

import { useState } from "react"
import { useEditorTheme } from "../../../../ThemeContext"



export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const { editorTheme, setEditorTheme } = useEditorTheme();

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setIsDarkMode(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [])

  React.useEffect(() => {
    const initialDarkMode =
      !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(initialDarkMode)
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => {
    const nextMode = editorTheme === "light" ? "dark" : "light";
    setEditorTheme(nextMode);           // This updates MUI + persists in localStorage
    setIsDarkMode(nextMode === "dark"); // This updates TipTap editor styling
  }
  

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-style="ghost">
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
