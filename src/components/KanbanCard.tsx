import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, MapPin } from "lucide-react";

export type Pedido = {
  id: string;
  criado_em: string;
  cliente_nome: string;
  cliente_telefone: string;
  pedidos: string | null;
  status: 'pendente' | 'em_rota' | 'entregue';
  origem: 'ia_n8n' | 'manual' | 'api_externa';
  data_ultima_atualizacao: string;
  numero_vale: number | null;
  entregador: string | null;
  empresa: string | null;
  latitude: number | null;
  longitude: number | null;
  bairro: string | null;
};

interface KanbanCardProps {
  pedido: Pedido;
}

export const KanbanCard = ({ pedido }: KanbanCardProps) => {
  const tempoDecorrido = formatDistanceToNow(new Date(pedido.criado_em), {
    addSuffix: true,
    locale: ptBR,
  });

  const horasDesdeCriacao = differenceInHours(new Date(), new Date(pedido.criado_em));
  const isDelayed = horasDesdeCriacao > 24 && pedido.status !== 'entregue';

  return (
    <Card className={cn("mb-4", isDelayed && "border-red-500 border-2")}>
      <CardHeader>
        <CardTitle>{pedido.cliente_nome}</CardTitle>
        <CardDescription>{pedido.cliente_telefone}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {pedido.entregador && (
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{pedido.entregador}</span>
            </div>
          )}
          {pedido.bairro && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{pedido.bairro}</span>
            </div>
          )}
        </div>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600">Detalhes do Pedido:</p>
          <div className="p-2 mt-1 bg-gray-50 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
            {pedido.pedidos || "Nenhum detalhe fornecido."}
          </div>
        </div>
        <p className="text-xs text-gray-500 text-right">{tempoDecorrido}</p>
      </CardContent>
    </Card>
  );
};