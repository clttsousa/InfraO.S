"use client";

import { BarChart, PieChart } from "@/components/shared/charts";
import { Surface } from "@/components/shared/ui";
import type { DashboardData } from "@/types";

export function DashboardCharts({ data }: { data: DashboardData }) {
  const ordersByAlert = [
    { label: "Abertas", value: data.stats.abertas },
    { label: "Pendentes", value: data.stats.pendentes },
    { label: "Atrasadas", value: data.stats.atrasadas },
    { label: "Finalizadas hoje", value: data.stats.finalizadasHoje }
  ];

  const ordersByTechnician = data.technicianSummary.slice(0, 6).map((technician) => ({
    label: technician.name.split(" ")[0] || technician.name,
    value: technician.openOrders
  }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Surface className="p-5">
        <BarChart data={ordersByTechnician.length ? ordersByTechnician : [{ label: "Sem dados", value: 0 }]} title="Ordens abertas por técnico" />
      </Surface>
      <Surface className="p-5">
        <PieChart data={ordersByAlert} title="Distribuição operacional" />
      </Surface>
    </div>
  );
}
