import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/SessionProvider';
import { Pedido } from '@/components/KanbanCard';
import { MinhaEntregaCard } from '@/components/MinhaEntregaCard';
import { showSuccess, showError } from '@/utils/toast';

const MinhasEntregas = () => {
    const { profile } = useUser();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPedidos = async () => {
        if (!profile) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('pedidos')
            .select('*, entregador:profiles(id, full_name)')
            .eq('entregador_id', profile.id)
            .in('status', ['pendente', 'em_rota'])
            .order('criado_em', { ascending: true });

        if (error) {
            showError("Falha ao buscar entregas.");
            console.error(error);
        } else {
            setPedidos(data as Pedido[] || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (profile) {
            fetchPedidos();
        }
    }, [profile]);

    useEffect(() => {
        if (!profile) return;
        const channel = supabase.channel(`minhas-entregas-${profile.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'pedidos', 
                filter: `entregador_id=eq.${profile.id}` 
            },
            () => {
                fetchPedidos();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        }
    }, [profile]);

    const handleUpdateStatus = async (pedidoId: string, status: 'em_rota' | 'entregue') => {
        const { error } = await supabase
            .from('pedidos')
            .update({ status })
            .eq('id', pedidoId);

        if (error) {
            showError("Falha ao atualizar o status do pedido.");
        } else {
            showSuccess(`Status do pedido atualizado com sucesso.`);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Carregando suas entregas...</div>;
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Minhas Entregas</h1>
            {pedidos.length === 0 ? (
                <p className="text-center text-gray-500">Você não tem nenhuma entrega pendente ou em rota.</p>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {pedidos.map(pedido => (
                        <MinhaEntregaCard 
                            key={pedido.id} 
                            pedido={pedido} 
                            onStatusChange={handleUpdateStatus}
                            onSuccess={fetchPedidos}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MinhasEntregas;