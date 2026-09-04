import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProviderWrapper } from "./ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProviderWrapper>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProviderWrapper>
  </React.StrictMode>
);
