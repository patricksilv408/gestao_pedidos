import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KanbanCard, Pedido } from "./KanbanCard";

export const KanbanBoard = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .order("criado_em", { ascending: true });

        if (error) {
          throw error;
        }

        setPedidos(data || []);
      } catch (err: any) {
        setError("Falha ao buscar os pedidos. Tente novamente mais tarde.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const emRota = pedidos.filter((p) => p.status === 'em_rota');
  const entregues = pedidos.filter((p) => p.status === 'entregue');

  if (loading) {
    return <div className="text-center p-8">Carregando pedidos...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-8">
      {/* Coluna Pendente */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4 text-center">
          Pendente ({pendentes.length})
        </h2>
        <div>
          {pendentes.map((pedido) => (
            <KanbanCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      </div>

      {/* Coluna Em Rota */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4 text-center">
          Em Rota de Entrega ({emRota.length})
        </h2>
        <div>
          {emRota.map((pedido) => (
            <KanbanCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      </div>

      {/* Coluna Entregue */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4 text-center">
          Entregue ({entregues.length})
        </h2>
        <div>
          {entregues.map((pedido) => (
            <KanbanCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      </div>
    </div>
  );
};