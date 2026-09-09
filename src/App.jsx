import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Pantry from "@/pages/Pantry";
import Recipes from "@/pages/Recipes";
import Ranks from "@/pages/Ranks";
import { Loader2 } from "lucide-react";

// Profile pulls in three.js/react-three-fiber for the 3D avatar - keep that
// out of every other page's bundle.
const Profile = lazy(() => import("@/pages/Profile"));

function RouteFallback() {
  return (
    <div className="flex justify-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

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
              <Route
                path="/profile"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <Profile />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
