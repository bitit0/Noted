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
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/weak-password": "Password should be at least 6 characters.",
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Signup = ({ onSuccess }) => {
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password should be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await signup(email.trim(), password, firstName.trim(), lastName.trim());
      onSuccess?.();
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || "Could not create your account. Please try again.");
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
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <TextField
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
          size="small"
          autoComplete="given-name"
        />
        <TextField
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
          size="small"
          autoComplete="family-name"
        />
      </Box>
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
        autoComplete="new-password"
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
      <TextField
        label="Confirm password"
        type={showPassword ? "text" : "password"}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        fullWidth
        size="small"
        autoComplete="new-password"
        required
      />
      <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ py: 1 }}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </Box>
  );
};

export default Signup;
