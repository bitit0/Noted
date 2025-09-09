import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FormControl, TextField, Input, InputLabel, InputAdornment, IconButton, Button, Box } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, googleProvider } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Signup = () => {
    const { signup } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setPasswordError(true);
            return;
        }

        if (!isValidEmail(email)) {
            setEmailError(true);
            return;
        }

        setPasswordError(false);
        setEmailError(false);

        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email: user.email,
                createdAt: new Date()
            });

            console.log("New user saved to database.");

        } catch (error) {
            console.error("Error signing up: ", error.message);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
      event.preventDefault();
    };
  
    const handleMouseUpPassword = (event) => {
      event.preventDefault();
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <Box
                    sx={{ display:"flex", justifyContent:"center"}}>
                    <FormControl sx={{ m: 1, width: '50%' }} variant='standard'>
                        <TextField id="firstName" label="First Name" variant="standard" value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
                    </FormControl>
                    <FormControl sx={{ m: 1, width: '50%' }} variant='standard'>
                        <TextField id="lastName" label="Last Name" variant="standard" value={lastName} onChange={(e) => setLastName(e.target.value)}/>
                    </FormControl>
                </Box>
               
                <FormControl sx={{ m: 1, width: '95%' }} variant='standard'>
                    <TextField id="emailField" label="Email" variant="standard" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    {emailError && (
                        <p style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                        Email is not valid.
                        </p>
                    )}
                </FormControl>
                <FormControl sx={{ m: 1, width: '95%'}} variant='standard'>
                    <InputLabel>Password</InputLabel>
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
                <FormControl sx={{ m: 1, width: '95%' }} variant='standard'>
                    <InputLabel>Confirm Password</InputLabel>
                    <Input
                        id="confirmPasswordField"
                        variant="standard"
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                            aria-label={showPassword ? 'hide the password' : 'display the password'}
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                            >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                        }
                    />
                    {passwordError && (
                        <p style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                        Passwords do not match.
                        </p>
                    )}
                </FormControl>
                <Button
                color="secondary" 
                type="submit"
                variant="contained"
                sx={{
                    width:"100%",
                    marginTop: "5%"
                }}>
                    Signup
            </Button>
            </form>
            
        </>
    );

}

export default Signup;