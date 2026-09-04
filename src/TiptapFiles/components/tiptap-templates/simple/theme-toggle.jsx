"use client";

import * as React from "react";

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button";

// --- Icons ---
import { MoonStarIcon } from "../../tiptap-icons/moon-star-icon";
import { SunIcon } from "../../tiptap-icons/sun-icon";

import { useColorMode } from "../../../../ThemeContext";

export function ThemeToggle() {
  const { isDark, toggleMode } = useColorMode();

  return (
    <Button
      onClick={toggleMode}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      data-style="ghost"
    >
      {isDark ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
