import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import Home from "./components/Home";
import Layout from "./components/Layout";
import Notes from "./Notes";
import Profile from "./components/Profile.tsx";

function FullPageLoader() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress size={28} sx={{ color: "primary.main" }} />
    </Box>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Router>
      <Routes>
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Notes />} />
            <Route path="notes" element={<Notes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
