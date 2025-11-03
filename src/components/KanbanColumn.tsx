import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard, Pedido } from "./KanbanCard";
import { SortableKanbanCard } from "./SortableKanbanCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  pedidos: Pedido[];
}

export const KanbanColumn = ({ id, title, pedidos }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="bg-gray-100 p-4 rounded-lg flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-center">
        {title} ({pedidos.length})
      </h2>
      <SortableContext
        id={id}
        items={pedidos.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex-grow min-h-[100px]">
          {pedidos.map((pedido) => (
            <SortableKanbanCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};