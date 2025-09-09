import logo from './logo.svg';
import './App.css';
import Notes from "./Notes";
import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Logout from "./components/Logout";
import GoogleLogin from "./components/GoogleLogin";
import Home from "./components/Home";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Profile from "./components/Profile.tsx";

function App() {

  const { user } = useAuth();

  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>
            {user ? (
              <Route path="/" element={<Layout/>}>
                <Route index element={<Notes/>}/>
                <Route path="notes" element={<Notes/>}/>
                <Route path="profile" element={<Profile/>}/>
              </Route>
            ) : (
              <Route path="/" element={<Home />} />
            )}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
