import React, { useState } from "react";
import { Box, Typography, Container } from "@mui/material";
import Login from "./Login";
import Signup from "./Signup";
import GoogleLogin from "./GoogleLogin";

const FEATURES = [
  "Real-time collaborative editing, powered by CRDTs",
  "Organize notes into folders, share with a teammate by email",
  "A focused, distraction-free writing surface",
];

const Home = () => {
  const [tab, setTab] = useState("login");

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      {/* Brand / editorial panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
          }}
        >
          Noted
        </Typography>

        <Box sx={{ maxWidth: 460 }}>
          <Typography
            variant="h2"
            sx={{ fontSize: { md: 44, lg: 52 }, lineHeight: 1.05, mb: 3 }}
          >
            Write together,
            <br />
            in real time.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {FEATURES.map((f) => (
              <Box key={f} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    mt: "7px",
                    flexShrink: 0,
                    bgcolor: "primary.main",
                  }}
                />
                <Typography color="text.secondary">{f}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary">
          A collaborative notes workspace.
        </Typography>
      </Box>

      {/* Auth panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
        }}
      >
        <Container maxWidth="xs" disableGutters>
          <Typography
            sx={{
              display: { xs: "block", md: "none" },
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 24,
              mb: 3,
            }}
          >
            Noted
          </Typography>

          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {tab === "login" ? "Welcome back" : "Create your account"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {tab === "login"
              ? "Sign in to continue to your notes."
              : "Start writing and collaborating in minutes."}
          </Typography>

          {/* Segmented toggle — ghost, underline for the active tab */}
          <Box sx={{ display: "flex", gap: 3, mb: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            {[
              { id: "login", label: "Sign in" },
              { id: "signup", label: "Sign up" },
            ].map((o) => (
              <Box
                key={o.id}
                onClick={() => setTab(o.id)}
                sx={{
                  cursor: "pointer",
                  pb: 1.25,
                  mb: "-1px",
                  fontWeight: 600,
                  fontSize: 14,
                  color: tab === o.id ? "text.primary" : "text.secondary",
                  borderBottom: "2px solid",
                  borderColor: tab === o.id ? "primary.main" : "transparent",
                  transition: "color 120ms",
                }}
              >
                {o.label}
              </Box>
            ))}
          </Box>

          {tab === "login" ? <Login /> : <Signup onSuccess={() => setTab("login")} />}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2.5 }}>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
            <Typography variant="caption" color="text.secondary">
              or
            </Typography>
            <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
          </Box>

          <GoogleLogin />
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
