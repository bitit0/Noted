import logo from './logo.svg';
import './App.css';
import Notes from "./Notes";
import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Logout from "./components/Logout";
import GoogleLogin from "./components/GoogleLogin";

function App() {

  const { user } = useAuth();

  return (
    <AuthProvider>
      <div>
        <h1>Noted</h1>
        {!user ? (
          <>
            <Signup />
            <Login />
            <GoogleLogin />  {/* Google Sign-In Button */}
          </>
        ) : (
          <>
            <Logout />
            <Notes />
          </>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
