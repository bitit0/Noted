import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import GoogleLogin from './GoogleLogin';
import { Button, TextField, Typography, Box, Container, ButtonGroup, ToggleButton, ToggleButtonGroup, InputLabel, FilledInput, InputAdornment, IconButton } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FormControl, Input } from '@mui/material';

const Home = () => {

    const [alignment, setAlignment] = React.useState('login');
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const { login } = useAuth();
    const { signInWithGoogle } = useAuth();

    const handleButtonClick = (type) => {
        setIsLogin(type === "login");
    }

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
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh"
      }}>
        <Typography variant="h3" fontWeight="bold" align="center" sx={{ mb: 1 }}>
        Noted!
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 3 }}>
          Take notes efficiently!
        </Typography>
        <Container maxWidth="xs"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
            
            <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 3,
              borderRadius: 2,
              boxShadow: 3,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ display: "flex", width: "100%", marginBottom: 2 }}>
              <Button
                variant="contained"
                color={isLogin ? "primary" : "default"}
                onClick={() => handleButtonClick("login")}
                sx={{
                  width:"100%",
                  textTransform:"none"
                }}>
                  Login
                </Button>
              <Button
                variant="contained"
                color={isLogin ? "default" : "primary"}
                onClick={() => handleButtonClick("signup")}
                sx={{
                  width:"100%",
                  textTransform:"none"
                }}>
                  Sign Up
              </Button>
            </Box>

              {isLogin ? <Login/> : <Signup/>}

              {/* <FormControl sx={{ m: 1, width: '95%' }} variant='standard'>
                <InputLabel htmlFor="emailField">Email</InputLabel>
                <Input id="emailField" alignItems="center"></Input>
              </FormControl>
              <FormControl sx={{ m: 1, width: '95%'}} variant='standard'>
                <InputLabel htmlFor="passwordField">Password</InputLabel>
                <Input
                  id="passwordField"
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
              </FormControl> */}
            
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Home;
