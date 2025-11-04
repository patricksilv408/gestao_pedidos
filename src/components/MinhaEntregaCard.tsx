import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pedido } from "./KanbanCard";
import { MapPin, MessageSquare, Map, Building2, Ticket, CheckCircle, AlertTriangle, PlayCircle, Phone } from 'lucide-react';
import { NaoEntregueDialog } from "./NaoEntregueDialog";

interface MinhaEntregaCardProps {
    pedido: Pedido;
    onStatusChange: (pedidoId: string, newStatus: 'em_rota' | 'entregue') => void;
    onSuccess: () => void;
}

export const MinhaEntregaCard = ({ pedido, onStatusChange, onSuccess }: MinhaEntregaCardProps) => {
    const cleanPhoneNumber = (phone: string) => phone.replace(/\D/g, '');

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{pedido.cliente_nome}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{pedido.cliente_telefone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-gray-600">
                    {pedido.bairro && (
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{pedido.bairro}</span>
                        </div>
                    )}
                    {pedido.empresa && (
                        <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{pedido.empresa}</span>
                        </div>
                    )}
                    {pedido.numero_vale && (
                        <div className="flex items-center">
                            <Ticket className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Vale: {pedido.numero_vale}</span>
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Detalhes do Pedido:</p>
                    <div className="p-2 mt-1 bg-gray-50 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                        {pedido.pedidos || "Nenhum detalhe fornecido."}
                    </div>
                </div>
                 <div className="flex items-center gap-2 w-full pt-2">
                    {pedido.latitude && pedido.longitude && (
                        <Button variant="outline" size="sm" asChild className="flex-1">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${pedido.latitude},${pedido.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                <Map className="w-4 h-4 mr-2" />
                                Ver no Mapa
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`https://wa.me/${cleanPhoneNumber(pedido.cliente_telefone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`tel:${cleanPhoneNumber(pedido.cliente_telefone)}`} className="flex items-center justify-center">
                            <Phone className="w-4 h-4 mr-2" />
                            Ligar
                        </a>
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {pedido.status === 'pendente' && (
                    <Button onClick={() => onStatusChange(pedido.id, 'em_rota')}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Iniciar Entrega
                    </Button>
                )}
                {pedido.status === 'em_rota' && (
                    <>
                        <Button onClick={() => onStatusChange(pedido.id, 'entregue')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Entrega
                        </Button>
                        <NaoEntregueDialog pedidoId={pedido.id} onSuccess={onSuccess}>
                            <Button variant="destructive">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Reportar Problema
                            </Button>
                        </NaoEntregueDialog>
                    </>
                )}
            </CardFooter>
        </Card>
    );
};