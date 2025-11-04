import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/SessionProvider';
import { Pedido } from '@/components/KanbanCard';
import { MinhaEntregaCard } from '@/components/MinhaEntregaCard';
import { HistoricoEntregaCard } from '@/components/HistoricoEntregaCard';
import { showSuccess, showError } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subDays } from 'date-fns';

const MinhasEntregas = () => {
    const { profile } = useUser();
    const [pedidosAtuais, setPedidosAtuais] = useState<Pedido[]>([]);
    const [pedidosHistorico, setPedidosHistorico] = useState<Pedido[]>([]);
    const [loadingAtuais, setLoadingAtuais] = useState(true);
    const [loadingHistorico, setLoadingHistorico] = useState(true);

    const fetchPedidosAtuais = async () => {
        if (!profile) return;
        setLoadingAtuais(true);
        const { data, error } = await supabase
            .from('pedidos')
            .select('*, entregador:profiles(id, full_name)')
            .eq('entregador_id', profile.id)
            .in('status', ['pendente', 'em_rota'])
            .order('criado_em', { ascending: true });

        if (error) {
            showError("Falha ao buscar entregas atuais.");
            console.error(error);
        } else {
            setPedidosAtuais(data as Pedido[] || []);
        }
        setLoadingAtuais(false);
    };

    const fetchPedidosHistorico = async () => {
        if (!profile) return;
        setLoadingHistorico(true);
        const fortyEightHoursAgo = subDays(new Date(), 2).toISOString();

        const { data, error } = await supabase
            .from('pedidos')
            .select('*, entregador:profiles(id, full_name)')
            .eq('entregador_id', profile.id)
            .or(`status.eq.nao_entregue,and(status.eq.entregue,data_ultima_atualizacao.gte.${fortyEightHoursAgo})`)
            .order('data_ultima_atualizacao', { ascending: false });

        if (error) {
            showError("Falha ao buscar histórico de entregas.");
            console.error(error);
        } else {
            setPedidosHistorico(data as Pedido[] || []);
        }
        setLoadingHistorico(false);
    };

    useEffect(() => {
        if (profile) {
            fetchPedidosAtuais();
            fetchPedidosHistorico();
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
            (payload) => {
                const changedStatus = (payload.new as Pedido)?.status;
                if (changedStatus === 'pendente' || changedStatus === 'em_rota') {
                    fetchPedidosAtuais();
                } else {
                    fetchPedidosAtuais();
                    fetchPedidosHistorico();
                }
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

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Minhas Entregas</h1>
            <Tabs defaultValue="atuais" className="w-full max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="atuais">Atuais</TabsTrigger>
                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="atuais" className="mt-4">
                    {loadingAtuais ? (
                        <p className="text-center text-gray-500">Carregando entregas atuais...</p>
                    ) : pedidosAtuais.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhuma entrega pendente ou em rota.</p>
                    ) : (
                        <div className="space-y-4">
                            {pedidosAtuais.map(pedido => (
                                <MinhaEntregaCard 
                                    key={pedido.id} 
                                    pedido={pedido} 
                                    onStatusChange={handleUpdateStatus}
                                    onSuccess={() => {
                                        fetchPedidosAtuais();
                                        fetchPedidosHistorico();
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="historico" className="mt-4">
                    {loadingHistorico ? (
                        <p className="text-center text-gray-500">Carregando histórico...</p>
                    ) : pedidosHistorico.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhum histórico encontrado.</p>
                    ) : (
                        <div className="space-y-4">
                            {pedidosHistorico.map(pedido => (
                                <HistoricoEntregaCard key={pedido.id} pedido={pedido} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MinhasEntregas;