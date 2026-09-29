import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GmailIntegration from "../pages/GmailIntegration";
import IntegrationsOverview from "../pages/IntegrationsOverview";
import Login from "../pages/Login";
import Notifications from "../pages/Notifications";
import Register from "../pages/Register";
import WhatsAppIntegration from "../pages/WhatsAppIntegration";
import { isAuthenticated } from "../services/auth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated() ? "/integracoes" : "/login"}
              replace
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Navigate to="/integracoes" replace />} />
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
