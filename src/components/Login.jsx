import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";

const FRIENDLY_ERRORS = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Try again in a moment.",
};

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || "Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: "4px", py: 0.25 }}>
          {error}
        </Alert>
      )}
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        size="small"
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        size="small"
        autoComplete="current-password"
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ py: 1 }}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </Box>
  );
};

export default Login;
