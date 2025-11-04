import { useState, useEffect, ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Pedido } from "./KanbanCard";

const formSchema = z.object({
  cliente_nome: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }),
  cliente_telefone: z.string().min(8, {
    message: "O telefone deve ter pelo menos 8 caracteres.",
  }),
  bairro: z.string().optional().transform(val => val || null),
  pedidos: z.string().optional().transform(val => val || null),
});

interface PedidoDetalhesDialogProps {
  pedido: Pedido;
  children: ReactNode;
  onSuccess: () => void;
}

export const PedidoDetalhesDialog = ({ pedido, children, onSuccess }: PedidoDetalhesDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_nome: "",
      cliente_telefone: "",
      bairro: "",
      pedidos: "",
    },
  });

  useEffect(() => {
    if (open && pedido) {
      form.reset({
        cliente_nome: pedido.cliente_nome,
        cliente_telefone: pedido.cliente_telefone,
        bairro: pedido.bairro || "",
        pedidos: pedido.pedidos || "",
      });
    }
  }, [open, pedido, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from("pedidos")
      .update(values)
      .eq("id", pedido.id);

    if (error) {
      showError("Falha ao atualizar o pedido.");
      console.error(error);
    } else {
      showSuccess("Pedido atualizado com sucesso!");
      onSuccess();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cliente_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (99) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores, 123, Centro" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pedidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes do Pedido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os itens do pedido aqui..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};