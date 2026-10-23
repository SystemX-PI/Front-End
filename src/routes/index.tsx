import { useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import GmailIntegration from "../pages/GmailIntegration";
import IntegrationsOverview from "../pages/IntegrationsOverview";
import Login from "../pages/Login";
import Notifications from "../pages/Notifications";
import Register from "../pages/Register";
import WhatsAppIntegration from "../pages/WhatsAppIntegration";
import { getUserType, isAuthenticated } from "../services/auth";
import Dashboard from "../pages/Dashboard";
import Contemplated from "../pages/Contemplated";
import Clients from "../pages/Clients";
import Users from "../pages/Users";
import Audit from "../pages/Audit";
import BeneficiaryPortal from "../pages/BeneficiaryPortal";

function SessionListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () =>
      navigate("/login", { replace: true, state: { sessionExpired: true } });
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [navigate]);
  return null;
}

function home() {
  return getUserType() === "CLIENTE" ? "/portal" : "/admin/dashboard";
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated() || !getUserType())
    return <Navigate to="/login" replace />;
  return getUserType() === "CLIENTE" ? (
    <Navigate to="/portal" replace />
  ) : (
    children
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionListener />
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated() ? home() : "/login"} replace />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Navigate to={home()} replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contemplados"
          element={
            <ProtectedRoute>
              <Contemplated />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clientes"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auditoria"
          element={
            <ProtectedRoute>
              <Audit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal"
          element={
            !isAuthenticated() || !getUserType() ? (
              <Navigate to="/login" replace />
            ) : getUserType() === "CLIENTE" ? (
              <BeneficiaryPortal />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )
          }
        />
        <Route
          path="/integracoes"
          element={
            <ProtectedRoute>
              <IntegrationsOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integracoes/gmail"
          element={
            <ProtectedRoute>
              <GmailIntegration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integracoes/whatsapp"
          element={
            <ProtectedRoute>
              <WhatsAppIntegration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integracoes/notificacoes"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
