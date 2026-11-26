import { useLocation } from "react-router-dom";

export function useOperationBase() {
  return useLocation().pathname.startsWith("/app/") ? "/app" : "/admin";
}
