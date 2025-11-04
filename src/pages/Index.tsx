import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBairro, setFilterBairro] = useState("");
  const [filterTempo, setFilterTempo] = useState("todos");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-wrap items-center gap-4 p-4 border-b bg-gray-50">
        <Input
          placeholder="Buscar por Nº do Vale"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filtrar por Bairro"
          value={filterBairro}
          onChange={(e) => setFilterBairro(e.target.value)}
          className="max-w-xs"
          disabled={!!searchTerm}
        />
        <Select
          value={filterTempo}
          onValueChange={setFilterTempo}
          disabled={!!searchTerm}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tempo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Pedidos</SelectItem>
            <SelectItem value="atrasados">Atrasados (&gt; 24h)</SelectItem>
            <SelectItem value="recentes">Recentes (&lt; 24h)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <main className="flex-grow overflow-auto">
        <KanbanBoard
          searchTerm={searchTerm}
          filterBairro={filterBairro}
          filterTempo={filterTempo}
        />
      </main>
    </div>
  );
};

export default Index;