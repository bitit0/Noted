import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
    const { signup } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signup(email, password);
        } catch (error) {
            console.error("Error signing up: ", error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
          <h2>Sign Up</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Sign Up</button>
        </form>
    );

}

export default Signup;