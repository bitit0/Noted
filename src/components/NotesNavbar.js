import React from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Stack
  } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../context/AuthContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Logout from "./Logout";
import { Link } from "react-router-dom";
import { LightMode, DarkMode } from "@mui/icons-material";
const NotesNavbar = ({ toggleColorMode }) => {

    const [mobileOpen, setMobileOpen] = useState(false);
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: "center"}}>
            <Typography variant="h6" sx={{ my:2 }}>
                Noted!
            </Typography>
            <List>
                {["Notes", "Profile", "Logout"].map((text) => (
                    <ListItem button key={text}>
                        <ListItemText primary={text}/>
                    </ListItem>
                ))}
            </List>
        </Box>
    )

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) setProfile(snap.data());
        };

        fetchProfile();
    }, [user]);

    return (
        <>
            <AppBar position="static" color="default" elevation={2}>
                <Toolbar sx={{ justifyContent: "space-between "}}>
                    <Typography variant="h6" component="div">
                        Noted!
                    </Typography>

                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
                        <Button color="inherit" component={Link} to="/notes">Notes</Button>
                        <Button color="inherit" component={Link} to="/profile">Profile</Button>
                        <Button color="inherit" component={Link} to="/settings">Settings</Button>
                    </Box>

                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, position: "absolute", left:"90%", transform: "translateX(-50%)" }}>
                        {/* <IconButton onClick={toggleColorMode}>
                            <DarkMode />
                        </IconButton> */}
                    </Box>

                    <Box sx={{ display: { xs: "none", md: "flex" } }}>
                        
                        <Logout/>
                    </Box>

                    <IconButton
                        sx={{ display: { xs: "block", md:"none" }, color: "inherit" }}
                        onClick={handleDrawerToggle}>
                            <MenuIcon/>
                    </IconButton>

                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                display: { xs: "block", sm: "none" },
                "& .MuiDrawer-paper": { width: 240 },
                }}
            >
                {drawer}
            </Drawer>
        </>
    )

}

export default NotesNavbar;