import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";

import Login from "./pages/Login";
import RoomsNew from "./pages/RoomsNew";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";

export default function App() {
  const { init, user, ready } = useAuth();

  useEffect(() => { init(); }, [init]);

  if (!ready) return null; 

  const authed = !!user?.isAdmin;

  return (
    <BrowserRouter key={authed ? "in" : "out"}>
      <Header />
      {authed ? (
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/new"
            element={
              <ProtectedRoute>
                <RoomsNew />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      )}
    </BrowserRouter>
  );
}
