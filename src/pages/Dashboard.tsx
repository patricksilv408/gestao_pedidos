import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/context/SessionProvider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEntregador, setSelectedEntregador] = useState("todos");
  const [selectedEmpresa, setSelectedEmpresa] = useState("todas");
  const [entregadores, setEntregadores] = useState<UserProfile[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);

  useEffect(() => {
    const fetchEntregadores = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "entregador");
      if (error) {
        console.error("Error fetching entregadores:", error);
      } else {
        setEntregadores(data || []);
      }
    };
    fetchEntregadores();
  }, []);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const { data, error } = await supabase.rpc("get_distinct_empresas");
      if (error) {
        console.error("Error fetching empresas:", error);
      } else {
        const empresaNames = data.map((item: { empresa: string }) => item.empresa);
        setEmpresas(empresaNames || []);
      }
    };
    fetchEmpresas();
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Meu Dashboard</h1>

      <div className="flex flex-wrap items-center gap-4 p-4 border-b bg-gray-50 rounded-lg mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/y", { locale: ptBR })
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedEntregador} onValueChange={setSelectedEntregador}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por Entregador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Entregadores</SelectItem>
            {entregadores.map((entregador) => (
              <SelectItem key={entregador.id} value={entregador.id}>
                {entregador.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa} value={empresa}>
                {empresa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Dashboard;