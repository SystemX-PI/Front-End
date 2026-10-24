import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Landing from "../pages/Landing";
import PlatformApp from "../pages/PlatformApp";
import { isAuthenticated } from "../services/auth";
function SessionListener() {
 const navigate=useNavigate();
 useEffect(()=> { const handler=()=>navigate("/login",{replace:true,state:{sessionExpired:true}}); window.addEventListener("auth:session-expired",handler); return()=>window.removeEventListener("auth:session-expired",handler); },[navigate]);
 return null;
}
export default function AppRoutes() {
 return <BrowserRouter><SessionListener/><Routes>
  <Route path="/" element={<Landing/>}/>
  <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
  <Route path="/forgot-password" element={<ForgotPassword/>}/>
  <Route path="/app/*" element={isAuthenticated()?<PlatformApp/>:<Navigate to="/login" replace/>}/>
  <Route path="/integracoes/whatsapp" element={<Navigate to="/app/whatsapp" replace/>}/>
  <Route path="/integracoes/gmail" element={<Navigate to="/app/gmail" replace/>}/>
  <Route path="/integracoes/*" element={<Navigate to="/app/integracoes" replace/>}/>
  <Route path="*" element={<Navigate to={isAuthenticated()?"/app":"/"} replace/>}/>
 </Routes></BrowserRouter>;
}
