import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from '@mui/material/Button';

const Logout = () => {
    const { logout } = useAuth();

    return <Button onClick={logout} variant="contained">Logout</Button>;
};

export default Logout;