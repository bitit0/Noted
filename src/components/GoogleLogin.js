import React from "react";
import { useAuth } from "../context/AuthContext";

const GoogleLogin = () => {
    const { signInWithGoogle } = useAuth();

    return (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
    );

};

export default GoogleLogin;