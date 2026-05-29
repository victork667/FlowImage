import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const location = useLocation();
  const { configured, loading, user } = useAuth();

  if (!configured) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading) {
    return (
      <div className="app-gradient grid min-h-screen place-items-center px-4 text-ink">
        <div className="glass-panel max-w-sm p-6 text-center">
          <div className="text-lg font-black text-violet-950">FlowImage</div>
          <div className="mt-2 text-sm font-bold text-steel">Carregando sessao</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
