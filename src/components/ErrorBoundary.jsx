import React from "react";
import { Box, Typography, Button } from "@mui/material";

/**
 * App-level error boundary so a render error shows a recoverable screen
 * instead of a blank page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[Noted] Uncaught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          px: 3,
          textAlign: "center",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="h4">Something went wrong</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          The app hit an unexpected error. Reloading usually fixes it — your notes
          are saved.
        </Typography>
        <Button variant="contained" onClick={this.handleReload}>
          Reload Noted
        </Button>
      </Box>
    );
  }
}
