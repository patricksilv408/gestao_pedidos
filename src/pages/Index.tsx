import { KanbanBoard } from "@/components/KanbanBoard";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold text-center">Quadro de Pedidos Kanban</h1>
      </header>
      <main>
        <KanbanBoard />
      </main>
    </div>
  );
};

export default Index;