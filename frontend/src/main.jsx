import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Task Tracker */}
        <Route path="/" element={<App />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);