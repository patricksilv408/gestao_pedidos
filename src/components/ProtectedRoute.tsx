import { useSession } from "@/context/SessionProvider";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};