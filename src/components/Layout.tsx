import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Home, LayoutGrid, LogOut, Users } from "lucide-react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { NewOrderDialog } from "./NewOrderDialog";

const Layout = () => {
  const { profile } = useUser();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Layout específico para Entregador
  if (profile?.role === 'entregador') {
    if (location.pathname !== '/minhas-entregas') {
      return <Navigate to="/minhas-entregas" replace />;
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm sticky top-0 z-10">
          <img src="/logo.png" alt="Logo" className="w-24 h-auto" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 h-auto">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate hidden sm:inline">{profile?.full_name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Redireciona admin/gestor se tentarem acessar a página de entregas
  if (profile && location.pathname === '/minhas-entregas') {
    return <Navigate to="/" replace />;
  }

  // Layout padrão para Admin/Gestor
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <img src="/logo.png" alt="Logo" className="w-32 h-auto" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/quadro">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Quadro de Pedidos
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/usuarios">
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{profile?.full_name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex justify-between items-center p-4 border-b">
          <SidebarTrigger />
          <NewOrderDialog />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;