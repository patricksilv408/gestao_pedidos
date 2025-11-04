import { KanbanCard, Pedido } from "./KanbanCard";
import { UserProfile } from "@/context/SessionProvider";

interface KanbanColumnProps {
  id: string;
  title: string;
  pedidos: Pedido[];
  entregadores: UserProfile[];
}

export const KanbanColumn = ({ id, title, pedidos, entregadores }: KanbanColumnProps) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-center">
        {title} ({pedidos.length})
      </h2>
      <div className="flex-grow min-h-[100px]">
        {pedidos.map((pedido) => (
          <KanbanCard key={pedido.id} pedido={pedido} entregadores={entregadores} />
        ))}
      </div>
    </div>
  );
};