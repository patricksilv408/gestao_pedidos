import { useUser } from "@/context/SessionProvider";
import { Navigate } from "react-router-dom";
import Layout from "./Layout";

export const ProtectedRoute = () => {
  const { session, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};