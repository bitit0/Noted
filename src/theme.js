import { createTheme } from "@mui/material/styles";

// ---------------------------------------------------------------------------
// Noted design system
//
// Editorial, flat, high-contrast. Space Grotesk for headings/UI, Inter for body.
// One dominant primary (clay/terracotta) per screen; everything else is a ghost
// button or text link. Sharp 4px corners, 1px solid borders, minimal shadow.
// ---------------------------------------------------------------------------

const HEADING_FONT = '"Space Grotesk", "Segoe UI", sans-serif';
const BODY_FONT = '"Inter", "Segoe UI", system-ui, sans-serif';
const MONO_FONT = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

const tokens = {
  light: {
    canvas: "#FAFAF9", // stone-50
    surface: "#FFFFFF",
    surfaceMuted: "#F5F5F4", // stone-100
    border: "#E7E5E4", // stone-200
    borderStrong: "#D6D3D1", // stone-300
    textPrimary: "#1C1917", // stone-900
    textSecondary: "#57534E", // stone-600
    textFaint: "#A8A29E", // stone-400
    primary: "#C2410C", // orange-700 (clay)
    primaryHover: "#9A3412", // orange-800
    primarySoft: "#FDEEE3",
    accentText: "#9A3412",
    danger: "#B91C1C", // red-700
  },
  dark: {
    canvas: "#0C0A09", // stone-950
    surface: "#1C1917", // stone-900
    surfaceMuted: "#292524", // stone-800
    border: "#292524", // stone-800
    borderStrong: "#44403C", // stone-700
    textPrimary: "#FAFAF9",
    textSecondary: "#A8A29E", // stone-400
    textFaint: "#78716C", // stone-500
    primary: "#EA580C", // orange-600
    primaryHover: "#F97316", // orange-500
    primarySoft: "#2A1710",
    accentText: "#FB923C",
    danger: "#F87171",
  },
};

export function createAppTheme(mode = "light") {
  const t = tokens[mode] || tokens.light;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        dark: t.primaryHover,
        contrastText: "#FFFFFF",
      },
      error: { main: t.danger },
      background: {
        default: t.canvas,
        paper: t.surface,
      },
      text: {
        primary: t.textPrimary,
        secondary: t.textSecondary,
        disabled: t.textFaint,
      },
      divider: t.border,
      // custom slots consumed via theme.palette.custom.*
      custom: t,
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: BODY_FONT,
      fontSize: 14,
      h1: { fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: "-0.03em" },
      h2: { fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: "-0.03em" },
      h3: { fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontFamily: HEADING_FONT, fontWeight: 600, letterSpacing: "-0.02em" },
      h5: { fontFamily: HEADING_FONT, fontWeight: 600, letterSpacing: "-0.01em" },
      h6: { fontFamily: HEADING_FONT, fontWeight: 600, letterSpacing: "-0.01em" },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, letterSpacing: 0 },
      overline: {
        fontFamily: HEADING_FONT,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.canvas,
            color: t.textPrimary,
          },
          "*::selection": {
            backgroundColor: t.primarySoft,
          },
          "::-webkit-scrollbar": { width: 10, height: 10 },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: t.borderStrong,
            borderRadius: 0,
          },
          "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
          outlined: { border: `1px solid ${t.border}` },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: false },
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 4,
            fontWeight: 600,
            boxShadow: "none",
            paddingInline: 16,
            "&:hover": { boxShadow: "none" },
          },
          contained: {
            backgroundColor: t.primary,
            color: "#FFFFFF",
            "&:hover": { backgroundColor: t.primaryHover },
          },
          outlined: {
            borderColor: t.border,
            color: t.textPrimary,
            "&:hover": {
              borderColor: t.borderStrong,
              backgroundColor: t.surfaceMuted,
            },
          },
          text: {
            color: t.textSecondary,
            "&:hover": { backgroundColor: t.surfaceMuted, color: t.textPrimary },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            color: t.textSecondary,
            "&:hover": { backgroundColor: t.surfaceMuted, color: t.textPrimary },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: t.surface,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: t.border },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: t.borderStrong },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: t.primary,
              borderWidth: 1,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${t.border}`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${t.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: t.textPrimary,
            color: t.canvas,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "default" },
        styleOverrides: {
          root: {
            backgroundColor: t.surface,
            color: t.textPrimary,
            borderBottom: `1px solid ${t.border}`,
            boxShadow: "none",
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: t.border } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 4, fontWeight: 500 },
          outlined: { borderColor: t.border },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            "&.Mui-selected": {
              backgroundColor: t.primarySoft,
              "&:hover": { backgroundColor: t.primarySoft },
            },
          },
        },
      },
    },
  });
}

export { HEADING_FONT, BODY_FONT, MONO_FONT, tokens };
