import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pedido } from "./KanbanCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';

interface HistoricoEntregaCardProps {
    pedido: Pedido;
}

export const HistoricoEntregaCard = ({ pedido }: HistoricoEntregaCardProps) => {
    const isDelivered = pedido.status === 'entregue';
    const updateDate = format(new Date(pedido.data_ultima_atualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    return (
        <Card className={cn("w-full", !isDelivered && "bg-red-50 border-red-200")}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{pedido.cliente_nome}</CardTitle>
                        <CardDescription>{pedido.cliente_telefone}</CardDescription>
                    </div>
                    {isDelivered ? (
                        <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Entregue
                        </div>
                    ) : (
                        <div className="flex items-center text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Não Entregue
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {pedido.bairro && (
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{pedido.bairro}</span>
                    </div>
                )}
                {!isDelivered && pedido.motivo_nao_entrega && (
                    <div>
                        <p className="text-sm font-medium text-red-700">Motivo:</p>
                        <div className="p-2 mt-1 bg-red-100 rounded-md text-sm text-red-900 whitespace-pre-wrap">
                            {pedido.motivo_nao_entrega}
                        </div>
                    </div>
                )}
                <p className="text-xs text-gray-500 text-right">
                    Atualizado em: {updateDate}
                </p>
            </CardContent>
        </Card>
    );
};