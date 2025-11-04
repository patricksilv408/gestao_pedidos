import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pedido } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { useUser, UserProfile } from "@/context/SessionProvider";
import { showSuccess, showError } from "@/utils/toast";

type PedidoStatus = 'pendente' | 'em_rota' | 'entregue';
type PedidosPorStatus = Record<PedidoStatus, Pedido[]>;

interface KanbanBoardProps {
  searchTerm: string;
  filterBairro: string;
  filterTempo: string;
}

export const KanbanBoard = ({ searchTerm, filterBairro, filterTempo }: KanbanBoardProps) => {
  const { profile } = useUser();
  const [pedidos, setPedidos] = useState<PedidosPorStatus>({
    pendente: [],
    em_rota: [],
    entregue: [],
  });
  const [entregadores, setEntregadores] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from("pedidos")
          .select("*, entregador:profiles(id, full_name)");

        if (searchTerm) {
          query = query.eq('numero_vale', searchTerm);
        } else {
          if (filterBairro) {
            query = query.ilike('bairro', `%${filterBairro}%`);
          }
          if (filterTempo === 'atrasados') {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            query = query.lt('criado_em', twentyFourHoursAgo).neq('status', 'entregue');
          } else if (filterTempo === 'recentes') {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            query = query.gte('criado_em', twentyFourHoursAgo);
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
        .channel('pedidos')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pedidos' },
          (payload) => {
            setPedidos(currentPedidos => {
              const newPedidosState = JSON.parse(JSON.stringify(currentPedidos));

              switch (payload.eventType) {
                case 'INSERT': {
                  const newPedido = payload.new as Pedido;
                  newPedido.entregador = null;
                  const status = newPedido.status;
                  if (newPedidosState[status]) {
                    newPedidosState[status].push(newPedido);
                  }
                  break;
                }
                case 'UPDATE': {
                  const updatedPedido = payload.new as Pedido;
                  const oldStatus = (payload.old as Pedido)?.status;
                  const newStatus = updatedPedido.status;

                  if (updatedPedido.entregador_id) {
                      const entregadorProfile = entregadores.find(e => e.id === updatedPedido.entregador_id);
                      updatedPedido.entregador = entregadorProfile ? { id: entregadorProfile.id, full_name: entregadorProfile.full_name } : null;
                  } else {
                      updatedPedido.entregador = null;
                  }

                  if (oldStatus && newPedidosState[oldStatus]) {
                    newPedidosState[oldStatus] = newPedidosState[oldStatus].filter((p: Pedido) => p.id !== updatedPedido.id);
                  }
                  
                  if (newPedidosState[newStatus]) {
                    const existingIndex = newPedidosState[newStatus].findIndex((p: Pedido) => p.id === updatedPedido.id);
                    if (existingIndex > -1) {
                      newPedidosState[newStatus][existingIndex] = updatedPedido;
                    } else {
                      newPedidosState[newStatus].push(updatedPedido);
                    }
                  }
                  break;
                }
                case 'DELETE': {
                  const deletedPedido = payload.old as Pedido;
                  const status = deletedPedido.status;
                  if (newPedidosState[status]) {
                    newPedidosState[status] = newPedidosState[status].filter((p: Pedido) => p.id !== deletedPedido.id);
                  }
                  break;
                }
                default:
                  break;
              }
              
              Object.keys(newPedidosState).forEach(status => {
                  newPedidosState[status as PedidoStatus].sort((a: Pedido, b: Pedido) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
              });

              return newPedidosState;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, searchTerm, filterBairro, filterTempo, entregadores]);

  const handleStatusChange = async (pedido: Pedido, newStatus: PedidoStatus) => {
    const oldStatus = pedido.status;

    setPedidos(prev => {
      const newPedidosState = { ...prev };
      newPedidosState[oldStatus] = newPedidosState[oldStatus].filter(p => p.id !== pedido.id);
      const updatedList = [...newPedidosState[newStatus], { ...pedido, status: newStatus }];
      updatedList.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
      newPedidosState[newStatus] = updatedList;
      return newPedidosState;
    });

    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedido.id);

    if (error) {
      showError("Falha ao atualizar o status do pedido.");
      console.error(error);
      // Revert state on error
      setPedidos(prev => {
        const revertedState = { ...prev };
        revertedState[newStatus] = revertedState[newStatus].filter(p => p.id !== pedido.id);
        revertedState[oldStatus] = [...revertedState[oldStatus], pedido];
        revertedState[oldStatus].sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
        return revertedState;
      });
    }
  };

  const handleAssignEntregador = async (pedido: Pedido, entregadorId: string | null) => {
    const oldPedidos = { ...pedidos };
    const status = pedido.status;

    const newEntregador = entregadores.find(e => e.id === entregadorId) || null;
    const newEntregadorProfile = newEntregador ? { id: newEntregador.id, full_name: newEntregador.full_name } : null;

    setPedidos(prev => {
        const newPedidosState = { ...prev };
        newPedidosState[status] = newPedidosState[status].map(p => 
            p.id === pedido.id 
            ? { ...p, entregador_id: entregadorId, entregador: newEntregadorProfile } 
            : p
        );
        return newPedidosState;
    });

    const { error } = await supabase
        .from('pedidos')
        .update({ entregador_id: entregadorId })
        .eq('id', pedido.id);

    if (error) {
        showError("Falha ao atribuir entregador.");
        console.error(error);
        setPedidos(oldPedidos);
    } else {
        showSuccess("Entregador atribuído com sucesso.");
    }
  };

  if (loading) return <div className="text-center p-8">Carregando pedidos...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-8">
      <KanbanColumn id="pendente" title="Pendente" pedidos={pedidos.pendente} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} />
      <KanbanColumn id="em_rota" title="Em Rota de Entrega" pedidos={pedidos.em_rota} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} />
      <KanbanColumn id="entregue" title="Entregue" pedidos={pedidos.entregue} entregadores={entregadores} handleStatusChange={handleStatusChange} handleAssignEntregador={handleAssignEntregador} />
    </div>
  );
};