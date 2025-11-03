import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard, Pedido } from "./KanbanCard";
import { UserProfile } from "@/context/SessionProvider";

interface SortableKanbanCardProps {
  pedido: Pedido;
  entregadores: UserProfile[];
}

export const SortableKanbanCard = ({ pedido, entregadores }: SortableKanbanCardProps) => {
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
      <KanbanCard pedido={pedido} entregadores={entregadores} />
    </div>
  );
};