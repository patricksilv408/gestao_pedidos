import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pedido } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { useUser, UserProfile } from "@/context/SessionProvider";
import { showError } from "@/utils/toast";

type PedidoStatus = 'pendente' | 'em_rota' | 'entregue';
type PedidosPorStatus = Record<PedidoStatus, Pedido[]>;

export const KanbanBoard = () => {
  const { profile } = useUser();
  const [pedidos, setPedidos] = useState<PedidosPorStatus>({
    pendente: [],
    em_rota: [],
    entregue: [],
  });
  const [entregadores, setEntregadores] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, entregador:profiles(id, full_name)")
        .order("criado_em", { ascending: true });

      if (error) throw error;

      const pedidosPorStatus = (data || []).reduce<PedidosPorStatus>(
        (acc, pedido) => {
          acc[pedido.status as PedidoStatus].push(pedido as Pedido);
          return acc;
        },
        { pendente: [], em_rota: [], entregue: [] }
      );
      setPedidos(pedidosPorStatus);
    } catch (err: any)      {
      setError("Falha ao buscar os pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchPedidos();

      if (profile.role === 'admin' || profile.role === 'gestor') {
        const fetchEntregadores = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'entregador');
          if (error) console.error("Error fetching entregadores:", error);
          else setEntregadores(data || []);
        };
        fetchEntregadores();
      }

      const channel = supabase
        .channel('public:pedidos')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pedidos' },
          () => {
            fetchPedidos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const handleStatusChange = async (pedido: Pedido, newStatus: PedidoStatus) => {
    const oldPedidos = pedidos;
    const oldStatus = pedido.status;

    // Atualização Otimista
    setPedidos(prev => {
      const newPedidosState = { ...prev };
      newPedidosState[oldStatus] = newPedidosState[oldStatus].filter(p => p.id !== pedido.id);
      newPedidosState[newStatus] = [...newPedidosState[newStatus], { ...pedido, status: newStatus }];
      return newPedidosState;
    });

    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedido.id);

    if (error) {
      showError("Falha ao atualizar o status do pedido.");
      console.error(error);
      // Reverte em caso de erro
      setPedidos(oldPedidos);
    }
  };

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-8">
      <KanbanColumn id="pendente" title="Pendente" pedidos={pedidos.pendente} entregadores={entregadores} handleStatusChange={handleStatusChange} />
      <KanbanColumn id="em_rota" title="Em Rota de Entrega" pedidos={pedidos.em_rota} entregadores={entregadores} handleStatusChange={handleStatusChange} />
      <KanbanColumn id="entregue" title="Entregue" pedidos={pedidos.entregue} entregadores={entregadores} handleStatusChange={handleStatusChange} />
    </div>
  );
};