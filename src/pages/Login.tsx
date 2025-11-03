import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession } from "@/context/SessionProvider";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const { session, isLoading } = useSession();

  useEffect(() => {
    document.body.style.backgroundColor = "#f3f4f6";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img src="/logo.png" alt="Logo" className="w-48 h-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Gestão de Pedidos
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: "Seu email",
                password_label: "Sua senha",
                button_label: "Entrar",
                link_text: "Esqueceu sua senha?",
              },
              forgotten_password: {
                email_label: "Seu email",
                button_label: "Enviar instruções",
                link_text: "Lembrou a senha? Voltar para o login",
              },
              sign_up: {
                link_text: "", // Oculta o link de cadastro
              },
            },
          }}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;