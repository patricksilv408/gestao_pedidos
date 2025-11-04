import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Package, Clock, Truck, CheckCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pedido } from "@/components/KanbanCard";
import { EntregasPorEntregadorChart } from "../components/charts/EntregasPorEntregadorChart";
import { EntregasPorEmpresaChart } from "../components/charts/EntregasPorEmpresaChart";
import { EntregasAoLongoDoTempoChart } from "../components/charts/EntregasAoLongoDoTempoChart";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560"];

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEntregador, setSelectedEntregador] = useState("todos");
  const [selectedEmpresa, setSelectedEmpresa] = useState("todas");
  const [entregadores, setEntregadores] = useState<UserProfile[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiltersData = async () => {
      const { data: entregadoresData, error: entregadoresError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "entregador");
      if (entregadoresError) console.error("Error fetching entregadores:", entregadoresError);
      else setEntregadores(entregadoresData || []);

      const { data: empresasData, error: empresasError } = await supabase.rpc("get_distinct_empresas");
      if (empresasError) console.error("Error fetching empresas:", empresasError);
      else {
        const empresaNames = empresasData.map((item: { empresa: string }) => item.empresa);
        setEmpresas(empresaNames || []);
      }
    };
    fetchFiltersData();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      let query = supabase.from("pedidos").select("*, entregador:profiles(full_name)");

      if (dateRange?.from) {
        query = query.gte('criado_em', dateRange.from.toISOString());
        const toDate = dateRange.to || dateRange.from;
        query = query.lte('criado_em', endOfDay(toDate).toISOString());
      }
      if (selectedEntregador !== "todos") {
        query = query.eq("entregador_id", selectedEntregador);
      }
      if (selectedEmpresa !== "todas") {
        query = query.eq("empresa", selectedEmpresa);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData([]);
      } else {
        setDashboardData(data as Pedido[] || []);
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [dateRange, selectedEntregador, selectedEmpresa]);

  const kpis = useMemo(() => {
    return {
      total: dashboardData.length,
      pendentes: dashboardData.filter(p => p.status === 'pendente').length,
      emRota: dashboardData.filter(p => p.status === 'em_rota').length,
      entregues: dashboardData.filter(p => p.status === 'entregue').length,
    };
  }, [dashboardData]);

  const chartData = useMemo(() => {
    const entregas = dashboardData.filter(p => p.status === 'entregue');

    const porEntregador = Object.entries(
      entregas.reduce((acc, p) => {
        const name = p.entregador?.full_name || 'Não Atribuído';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, total]) => ({ name, total }));

    const porEmpresa = Object.entries(
      entregas.reduce((acc, p) => {
        const name = p.empresa || 'Outras';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));

    const aoLongoDoTempo = Object.entries(
      entregas.reduce((acc, p) => {
        const date = format(new Date(p.data_ultima_atualizacao), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, total]) => ({ date: format(new Date(date), 'dd/MM'), total }));

    return { porEntregador, porEmpresa, aoLongoDoTempo };
  }, [dashboardData]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Meu Dashboard</h1>

      <div className="flex flex-wrap items-center gap-4 p-4 border bg-gray-50 rounded-lg">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>{format(dateRange.from, "dd/MM/y", { locale: ptBR })} - {format(dateRange.to, "dd/MM/y", { locale: ptBR })}</>
                ) : (
                  format(dateRange.from, "dd/MM/y", { locale: ptBR })
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus />
          </PopoverContent>
        </Popover>

        <Select value={selectedEntregador} onValueChange={setSelectedEntregador}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por Entregador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Entregadores</SelectItem>
            {entregadores.map((e) => (<SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Empresas</SelectItem>
            {empresas.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
            </div>
          </div>
          <div className="lg:col-span-2"><Skeleton className="h-[400px]" /></div>
          <div className="lg:col-span-1"><Skeleton className="h-[400px]" /></div>
          <div className="lg:col-span-3"><Skeleton className="h-[400px]" /></div>
        </div>
      ) : dashboardData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.total}</div>
                  <p className="text-xs text-muted-foreground">Total de pedidos no período</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.pendentes}</div>
                  <p className="text-xs text-muted-foreground">Pedidos aguardando rota</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Rota</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.emRota}</div>
                  <p className="text-xs text-muted-foreground">Pedidos em rota de entrega</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregues</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.entregues}</div>
                  <p className="text-xs text-muted-foreground">Pedidos entregues com sucesso</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <EntregasAoLongoDoTempoChart data={chartData.aoLongoDoTempo} />
          </div>
          <div className="lg:col-span-1">
            <EntregasPorEmpresaChart data={chartData.porEmpresa} />
          </div>
          <div className="lg:col-span-3">
            <EntregasPorEntregadorChart data={chartData.porEntregador} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
            <p>Nenhum dado encontrado para os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;