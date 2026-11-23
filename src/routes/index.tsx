import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Landing from "../pages/Landing";
import PlatformApp from "../pages/PlatformApp";
import AdminShell from "../components/AdminShell";
import Dashboard from "../pages/Dashboard";
import Clients from "../pages/Clients";
import Registries from "../pages/Registries";
import Contemplated from "../pages/Contemplated";
import Closures from "../pages/Closures";
import Communication from "../pages/Communication";
import ManualDispatch from "../pages/ManualDispatch";
import Audit from "../pages/Audit";
import AdminChannels from "../pages/AdminChannels";
import WidgetChat from "../pages/WidgetChat";
import BeneficiaryPortal from "../pages/BeneficiaryPortal";
import AssistantWidget from "../components/AssistantWidget";
import { getUserType, isBeneficiarySession, sessionHome } from "../services/auth";
import type { ReactNode } from "react";
import { isAuthenticated } from "../services/auth";
function ProtectedApp() {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (isBeneficiarySession() || getUserType() === "FUNCIONARIO") return <Navigate to={sessionHome()} replace />;
    return <PlatformApp />;
}
function DefaultRedirect() {
    if (!isAuthenticated()) return <Navigate to="/" replace />;
    return <Navigate to={sessionHome()} replace />;
}
function RoleRoute({ children, roles }: { children: ReactNode; roles: NonNullable<ReturnType<typeof getUserType>>[] }) {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    const currentRole = getUserType();
    if (!currentRole || !roles.includes(currentRole)) return <AdminShell title="Acesso restrito" subtitle="Permissão necessária"><p role="alert">Seu perfil não tem acesso a esta área.</p><a href={sessionHome()}>Voltar ao meu espaço</a></AdminShell>;
    return children;
}
function SessionListener() {
    const navigate = useNavigate();
    useEffect(() => { const handler = () => navigate("/login", { replace: true, state: { sessionExpired: true } }); window.addEventListener("auth:session-expired", handler); return () => window.removeEventListener("auth:session-expired", handler); }, [navigate]);
    return null;
}
export default function AppRoutes() {
    return <BrowserRouter><SessionListener /><Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/widget" element={<WidgetChat />} />
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/app/*" element={<ProtectedApp />} />
        <Route path="/integracoes/whatsapp" element={<Navigate to="/app/whatsapp" replace />} />
        <Route path="/integracoes/gmail" element={<Navigate to="/app/gmail" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Dashboard /></RoleRoute>} />
        <Route path="/admin/clientes" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Clients /></RoleRoute>} />
        <Route path="/admin/cadastros" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Registries /></RoleRoute>} />
        <Route path="/admin/contemplados" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Contemplated /></RoleRoute>} />
        <Route path="/admin/baixas" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Closures /></RoleRoute>} />
        <Route path="/admin/comunicacao" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Communication /></RoleRoute>} />
        <Route path="/disparo-manual" element={<Navigate to="/admin/disparo-manual" replace />} />
        <Route path="/admin/disparo-manual" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><ManualDispatch /></RoleRoute>} />
        <Route path="/admin/auditoria" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Audit /></RoleRoute>} />
        <Route path="/admin/canais" element={<RoleRoute roles={["ADMINISTRADOR"]}><AdminChannels /></RoleRoute>} />
        <Route path="/admin/usuarios" element={<RoleRoute roles={["ADMINISTRADOR"]}><Registries initial="usuarios" locked /></RoleRoute>} />
        <Route path="/portal" element={<RoleRoute roles={["CLIENTE"]}><BeneficiaryPortal /></RoleRoute>} />
        <Route path="/integracoes/notificacoes" element={<RoleRoute roles={["ADMINISTRADOR", "FUNCIONARIO"]}><Communication /></RoleRoute>} />
        <Route path="/integracoes/*" element={<Navigate to="/app/integracoes" replace />} />
        <Route path="*" element={<DefaultRedirect />} />
    </Routes><AssistantWidget /></BrowserRouter>;
}

