import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FormControl, TextField, Input, InputLabel, InputAdornment, IconButton, Button } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';
import GoogleLogin from "./GoogleLogin";

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(email, password);
        } catch (error) {
            console.error("Error logging in: ", error.message);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <FormControl sx={{ m: 1, width: '95%' }} variant='standard'>
                    <TextField id="emailField" label="Email" variant="standard" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </FormControl>
                <FormControl sx={{ m: 1, width: '95%'}} variant='standard'>
                    <InputLabel htmlFor="passwordField">Password</InputLabel>
                    <Input
                    id="passwordField"
                    variant="standard"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    endAdornment={
                        <InputAdornment position="end">
                        <IconButton
                            aria-label={
                            showPassword ? 'hide the password' : 'display the password'
                            }
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </InputAdornment>
                    }
                    />
                </FormControl>
                <Button
                    color="secondary" 
                    type="submit"
                    variant="contained"
                    sx={{
                        width:"100%",
                        marginTop: "5%"
                    }}>
                    Login
                </Button>
                <GoogleLogin/>
            </form>

        </>  
      );
}

export default Login;