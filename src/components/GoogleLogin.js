import React from "react";
import { useAuth } from "../context/AuthContext";
import GoogleIcon from '@mui/icons-material/Google';
import { Button, IconButton } from '@mui/material';

const GoogleLogin = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <Button variant="contained" startIcon={<GoogleIcon />} onClick={signInWithGoogle} sx={{textTransform:"none", marginTop:"3%", width: '100%' }}>
            Sign in with Google
        </Button>
    );

};

export default GoogleLogin;