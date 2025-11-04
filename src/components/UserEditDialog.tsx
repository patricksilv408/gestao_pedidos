import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { UserProfile } from "@/context/SessionProvider";

const formSchema = z.object({
  full_name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  role: z.enum(["admin", "gestor", "entregador"]),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional().or(z.literal('')),
}).refine(data => {
    // Se não for modo de edição (ou seja, é criação), email e senha são obrigatórios
    if (!data.email && !data.password) return true; // Permite edição sem alterar email/senha
    if (data.email && !data.password) return false;
    return true;
}, {
    message: "A senha é obrigatória ao criar um novo usuário com email.",
    path: ["password"],
});

interface UserEditDialogProps {
  user?: UserProfile;
  children: React.ReactNode;
  onSuccess: () => void;
}

export const UserEditDialog = ({ user, children, onSuccess }: UserEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const isEditMode = !!user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      role: "entregador",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          full_name: user.full_name,
          role: user.role,
          email: '',
          password: ''
        });
      } else {
        form.reset({
          full_name: "",
          role: "entregador",
          email: "",
          password: "",
        });
      }
    }
  }, [user, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isEditMode && user) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: values.full_name, role: values.role })
        .eq("id", user.id);

      if (error) {
        showError("Falha ao atualizar usuário.");
        console.error(error);
      } else {
        showSuccess("Usuário atualizado com sucesso!");
        onSuccess();
        setOpen(false);
      }
    } else {
      if (!values.email || !values.password) {
        showError("Email e senha são obrigatórios para novos usuários.");
        return;
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
          }
        }
      });

      if (authError) {
        showError(authError.message);
        console.error(authError);
      } else if (data.user) {
        showSuccess("Usuário criado com sucesso! Verifique o email para confirmação.");
        onSuccess();
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditMode && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="entregador">Entregador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};