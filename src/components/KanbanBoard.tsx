import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pedido } from "./KanbanCard";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { showError } from "@/utils/toast";
import { useUser, UserProfile } from "@/context/SessionProvider";

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      // RLS garante que cada usuário veja apenas os pedidos permitidos
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
    } catch (err: any) {
      setError("Falha ao buscar os pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchPedidos();

      // Admins e Gestores podem ver a lista de entregadores para atribuir pedidos
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const originalStatus = active.data.current?.sortable.containerId as PedidoStatus;
    const newStatus = over.id as PedidoStatus;
    
    if (!originalStatus || originalStatus === newStatus) return;

    const pedidoId = active.id as string;
    
    // Otimistic update
    const originalPedidosState = JSON.parse(JSON.stringify(pedidos));
    setPedidos(currentPedidos => {
      const sourceColumn = currentPedidos[originalStatus];
      const destColumn = currentPedidos[newStatus];
      const activeIndex = sourceColumn.findIndex(p => p.id === pedidoId);
      if (activeIndex === -1) return currentPedidos;
      const [movedItem] = sourceColumn.splice(activeIndex, 1);
      movedItem.status = newStatus;
      destColumn.push(movedItem);
      return { ...currentPedidos, [originalStatus]: sourceColumn, [newStatus]: destColumn };
    });

    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedidoId);

    if (error) {
      showError("Falha ao atualizar o status do pedido.");
      console.error("Supabase update error:", error);
      setPedidos(originalPedidosState); // Revert on error
    }
  };

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-8">
        <KanbanColumn id="pendente" title="Pendente" pedidos={pedidos.pendente} entregadores={entregadores} />
        <KanbanColumn id="em_rota" title="Em Rota de Entrega" pedidos={pedidos.em_rota} entregadores={entregadores} />
        <KanbanColumn id="entregue" title="Entregue" pedidos={pedidos.entregue} entregadores={entregadores} />
      </div>
    </DndContext>
  );
};