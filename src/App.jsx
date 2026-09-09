import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Pantry from "@/pages/Pantry";
import Recipes from "@/pages/Recipes";
import Ranks from "@/pages/Ranks";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/pantry" replace />} />
              <Route path="/pantry" element={<Pantry />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/ranks" element={<Ranks />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
