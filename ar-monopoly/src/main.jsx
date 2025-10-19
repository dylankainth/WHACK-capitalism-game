import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { StrictMode } from 'react'
import './index.css'

import WelcomePage from "./pages/Welcome.jsx";
import GamesPage from "./pages/Games.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GamePage from "./pages/Game.jsx";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
