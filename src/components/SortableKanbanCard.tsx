import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard, Pedido } from "./KanbanCard";

interface SortableKanbanCardProps {
  pedido: Pedido;
}

export const SortableKanbanCard = ({ pedido }: SortableKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pedido.id, data: { pedido } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard pedido={pedido} />
    </div>
  );
};