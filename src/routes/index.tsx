import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Audit from "../pages/Audit";
import BeneficiaryPortal from "../pages/BeneficiaryPortal";
import Clients from "../pages/Clients";
import Contemplated from "../pages/Contemplated";
import Dashboard from "../pages/Dashboard";
import GmailIntegration from "../pages/GmailIntegration";
import IntegrationsOverview from "../pages/IntegrationsOverview";
import Login from "../pages/Login";
import Notifications from "../pages/Notifications";
import Register from "../pages/Register";
import Users from "../pages/Users";
import WhatsAppIntegration from "../pages/WhatsAppIntegration";
import { getUserType, isAuthenticated } from "../services/auth";

type UserType = "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";

function homeForUser() {
  if (!isAuthenticated()) return "/login";
  const userType = getUserType();
  if (userType === "CLIENTE") return "/portal";
  if (userType === "ADMINISTRADOR" || userType === "FUNCIONARIO") {
    return "/admin/dashboard";
  }
  return "/login";
}

function ProtectedRoute({
  children,
  allowedTypes,
}: {
  children: ReactNode;
  allowedTypes?: UserType[];
}) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const userType = getUserType();
  if (allowedTypes && (!userType || !allowedTypes.includes(userType))) {
    return <Navigate to={homeForUser()} replace />;
  }
  return children;
}

function SessionExpiryRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleSessionExpired() {
      navigate("/login", {
        replace: true,
        state: { sessionExpired: true },
      });
    }

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [navigate]);

  return null;
}

function AppRouteContent() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={homeForUser()} replace />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedTypes={["CLIENTE"]}>
            <BeneficiaryPortal />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contemplados"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Contemplated />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clientes"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/auditoria"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Audit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <IntegrationsOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes/gmail"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <GmailIntegration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes/whatsapp"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <WhatsAppIntegration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integracoes/notificacoes"
        element={
          <ProtectedRoute allowedTypes={["ADMINISTRADOR", "FUNCIONARIO"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionExpiryRedirect />
      <AppRouteContent />
    </BrowserRouter>
  );
}
