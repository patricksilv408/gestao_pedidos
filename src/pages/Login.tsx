import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useUser } from "@/context/SessionProvider";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { session, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Coluna Esquerda (Gráfica) */}
      <div
        className="hidden md:flex w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />

      {/* Coluna Direita (Formulário) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src="/favicon.png" alt="Logo" className="w-48 h-auto mx-auto mb-4" />
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
    </div>
  );
};

export default Login;