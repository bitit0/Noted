import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from "@mui/material";
import { Sun, Moon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useColorMode } from "../ThemeContext";

const NAV_LINKS = [
  { label: "Notes", to: "/notes" },
  { label: "Profile", to: "/profile" },
];

const NotesNavbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleMode } = useColorMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const isActive = (to) =>
    location.pathname === to || (to === "/notes" && location.pathname === "/");

  const initial = (user?.displayName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <AppBar position="static">
      <Toolbar sx={{ minHeight: 56, px: { xs: 2, md: 3 }, gap: 1 }}>
        <Typography
          component={Link}
          to="/notes"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.02em",
            color: "text.primary",
            textDecoration: "none",
            mr: 2,
          }}
        >
          Noted
        </Typography>

        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5 }}>
          {NAV_LINKS.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              disableRipple
              sx={{
                color: isActive(link.to) ? "text.primary" : "text.secondary",
                fontWeight: isActive(link.to) ? 600 : 500,
                px: 1.5,
                position: "relative",
                "&::after": isActive(link.to)
                  ? {
                      content: '""',
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: 2,
                      height: 2,
                      backgroundColor: "primary.main",
                    }
                  : {},
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
          <IconButton onClick={toggleMode} size="small">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Account">
          <IconButton onClick={openMenu} size="small" sx={{ ml: 0.5 }}>
            <Avatar
              src={user?.photoURL || undefined}
              sx={{
                width: 30,
                height: 30,
                fontSize: 14,
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "#fff",
                borderRadius: "4px",
              }}
              variant="square"
            >
              {initial}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ px: 2, py: 1, maxWidth: 240 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.displayName || "Signed in"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              closeMenu();
              navigate("/profile");
            }}
          >
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            Log out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NotesNavbar;
