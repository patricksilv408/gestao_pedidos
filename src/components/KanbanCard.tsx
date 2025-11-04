import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Trash2, UserPlus, Map, MessageSquare, AlertCircle } from "lucide-react";
import { useUser, UserProfile } from "@/context/SessionProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PedidoDetalhesDialog } from "./PedidoDetalhesDialog";

export type Pedido = {
  id: string;
  criado_em: string;
  cliente_nome: string;
  cliente_telefone: string;
  pedidos: string | null;
  status: 'pendente' | 'em_rota' | 'entregue' | 'nao_entregue';
  origem: 'ia_n8n' | 'manual' | 'api_externa';
  data_ultima_atualizacao: string;
  numero_vale: number | null;
  entregador: { id: string; full_name: string } | null;
  empresa: string | null;
  latitude: number | null;
  longitude: number | null;
  bairro: string | null;
  entregador_id: string | null;
  motivo_nao_entrega: string | null;
};

interface KanbanCardProps {
  pedido: Pedido;
  entregadores: UserProfile[];
  handleStatusChange: (pedido: Pedido, newStatus: Pedido['status']) => void;
  handleAssignEntregador: (pedido: Pedido, entregadorId: string | null) => void;
  onSuccess: () => void;
}

const statusOptions: Pedido['status'][] = ['pendente', 'em_rota', 'entregue', 'nao_entregue'];
const statusLabels: Record<Pedido['status'], string> = {
  pendente: 'Mover para Pendente',
  em_rota: 'Mover para Em Rota',
  entregue: 'Mover para Entregue',
  nao_entregue: 'Mover para Não Entregue',
};

export const KanbanCard = ({ pedido, entregadores, handleStatusChange, handleAssignEntregador, onSuccess }: KanbanCardProps) => {
  const { profile } = useUser();

  const tempoDecorrido = formatDistanceToNow(new Date(pedido.criado_em), {
    addSuffix: true,
    locale: ptBR,
  });

  const horasDesdeCriacao = differenceInHours(new Date(), new Date(pedido.criado_em));
  const isDelayed = horasDesdeCriacao > 24 && pedido.status !== 'entregue';
  const isUrgente = horasDesdeCriacao > 1 && horasDesdeCriacao <= 24 && pedido.status === 'pendente';

  const handleDelete = async () => {
    const { error } = await supabase.from('pedidos').delete().eq('id', pedido.id);
    if (error) {
      showError("Falha ao deletar o pedido.");
      console.error(error);
    } else {
      showSuccess("Pedido deletado com sucesso.");
    }
  };

  const handleAssign = (entregadorId: string) => {
    const newEntregadorId = entregadorId === 'unassigned' ? null : entregadorId;
    handleAssignEntregador(pedido, newEntregadorId);
  };

  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'gestor';

  const cardComponent = (
    <Card className={cn(
      "mb-4 flex flex-col",
      isDelayed && "border-red-500 border-2",
      isUrgente && "border-yellow-500 border-2",
      pedido.status === 'nao_entregue' && "bg-red-50 border-red-200"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{pedido.cliente_nome}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{pedido.cliente_telefone}</CardDescription>
          </div>
          {profile?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o pedido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{pedido.entregador?.full_name || "Não atribuído"}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {pedido.bairro && <Badge variant="secondary">{pedido.bairro}</Badge>}
            {pedido.empresa && <Badge variant="outline">{pedido.empresa}</Badge>}
            {pedido.numero_vale && <Badge>Vale: {pedido.numero_vale}</Badge>}
          </div>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'gestor') && (
          <div className="mb-4">
            <Select onValueChange={handleAssign} defaultValue={pedido.entregador_id || undefined}>
              <SelectTrigger>
                <UserPlus className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Atribuir entregador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Desatribuir</SelectItem>
                {entregadores.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600">Detalhes do Pedido:</p>
          <div className="p-2 mt-1 bg-gray-50 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
            {pedido.pedidos || "Nenhum detalhe fornecido."}
          </div>
        </div>

        {pedido.motivo_nao_entrega && pedido.status === 'pendente' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            <span className="font-bold">Falha na Entrega:</span> {pedido.motivo_nao_entrega}
          </div>
        )}

        {pedido.status === 'nao_entregue' && pedido.motivo_nao_entrega && (
          <div className="mb-4">
            <p className="text-sm font-medium text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Motivo da Não Entrega:
            </p>
            <div className="p-2 mt-1 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 whitespace-pre-wrap">
              {pedido.motivo_nao_entrega}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-right">{tempoDecorrido}</p>
      </CardContent>
      {(profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'entregador') && (
        <CardFooter className="pt-4 border-t flex flex-col gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">Mudar Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
              {statusOptions
                .filter(status => status !== pedido.status)
                .map(status => (
                  <DropdownMenuItem key={status} onClick={() => handleStatusChange(pedido, status)}>
                    {statusLabels[status]}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2 w-full">
            {pedido.latitude && pedido.longitude && (
                <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                        <Map className="w-4 h-4 mr-2" />
                        Localização
                    </a>
                </Button>
            )}
            <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={`https://wa.me/${cleanPhoneNumber(pedido.cliente_telefone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                </a>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );

  if (!canEdit) {
    return cardComponent;
  }

  return (
    <PedidoDetalhesDialog pedido={pedido} onSuccess={onSuccess}>
      <div className="cursor-pointer">
        {cardComponent}
      </div>
    </PedidoDetalhesDialog>
  );
};