import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pedido } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { useUser, UserProfile } from "@/context/SessionProvider";
import { showError } from "@/utils/toast";

type PedidoStatus = 'pendente' | 'em_rota' | 'entregue' | 'nao_entregue';
type PedidosPorStatus = Record<PedidoStatus, Pedido[]>;

interface KanbanBoardProps {
  searchTerm: string;
  searchPhone: string;
  searchAddress: string;
  filterTempo: string;
  filterStatus: string;
}

export const KanbanBoard = ({ searchTerm, searchPhone, searchAddress, filterTempo, filterStatus }: KanbanBoardProps) => {
  const { profile } = useUser();
  const [pedidos, setPedidos] = useState<PedidosPorStatus>({
    pendente: [],
    em_rota: [],
    entregue: [],
    nao_entregue: [],
  });
  const [entregadores, setEntregadores] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from("pedidos")
        .select("*, entregador:profiles(id, full_name)");

      if (searchTerm) {
        const valeNumber = parseInt(searchTerm, 10);
        if (!isNaN(valeNumber)) {
          query = query.eq('numero_vale', valeNumber);
        } else {
          setPedidos({ pendente: [], em_rota: [], entregue: [], nao_entregue: [] });
          setLoading(false);
          return;
        }
      } else if (searchPhone) {
        query = query.ilike('cliente_telefone', `%${searchPhone}%`);
      } else {
        if (searchAddress) {
          query = query.ilike('bairro', `%${searchAddress}%`);
        }

        if (filterTempo === 'atrasados') {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.lt('criado_em', twentyFourHoursAgo);
          if (!searchAddress) {
            query = query.neq('status', 'entregue');
          }
        } else if (filterTempo === 'recentes') {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('criado_em', twentyFourHoursAgo);
        }

        if (filterStatus !== 'todos') {
          query = query.eq('status', filterStatus);
        }
      }

      const { data, error } = await query.order("criado_em", { ascending: true });

      if (error) throw error;

      const pedidosPorStatus = (data || []).reduce<PedidosPorStatus>(
        (acc, pedido) => {
          const status = pedido.status as PedidoStatus;
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(pedido as Pedido);
          return acc;
        },
        { pendente: [], em_rota: [], entregue: [], nao_entregue: [] }
      );
      setPedidos(pedidosPorStatus);
    } catch (err: any) {
      const errorMessage = "Falha ao buscar os pedidos.";
      setError(errorMessage);
      showError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile, searchTerm, searchPhone, searchAddress, filterTempo, filterStatus]);

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'gestor')) {
      const fetchEntregadores = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'entregador');
        if (error) {
          console.error("Error fetching entregadores:", error);
          showError("Falha ao buscar entregadores.");
        } else {
          setEntregadores(data || []);
        }
      };
      fetchEntregadores();
    }
  }, [profile]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('pedidos-kanban')
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
  }, [profile, fetchPedidos]);

  const handleStatusChange = async (pedido: Pedido, newStatus: PedidoStatus) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedido.id);

    if (error) {
      showError("Falha ao atualizar o status do pedido.");
      console.error(error);
    }
  };

  const handleAssignEntregador = async (pedido: Pedido, entregadorId: string | null) => {
    const { error } = await supabase
        .from('pedidos')
        .update({ entregador_id: entregadorId })
        .eq('id', pedido.id);

    if (error) {
        showError("Falha ao atribuir entregador.");
        console.error(error);
    }
  };

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-8">
      <KanbanColumn id="pendente" title="Pendente" pedidos={pedidos.pendente} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} onSuccess={fetchPedidos} />
      <KanbanColumn id="em_rota" title="Em Rota de Entrega" pedidos={pedidos.em_rota} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} onSuccess={fetchPedidos} />
      <KanbanColumn id="entregue" title="Entregue" pedidos={pedidos.entregue} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} onSuccess={fetchPedidos} />
      <KanbanColumn id="nao_entregue" title="Não Entregue" pedidos={pedidos.nao_entregue} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} onSuccess={fetchPedidos} />
    </div>
  );
};