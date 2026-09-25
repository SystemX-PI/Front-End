import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import { isAuthenticated } from "../services/auth";

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
      <div className="bg-[#161B26] border border-white/10 rounded-3xl p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Dashboard ConsorTech</h1>
        <p className="text-gray-400 mt-2">Placeholder até a Etapa 3.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}