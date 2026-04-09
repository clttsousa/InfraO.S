import * as XLSX from "xlsx";
import { formatDateTime, formatHours } from "@/lib/format";
import { mapReportStatusLabel } from "@/lib/data";
import { sanitizeExternalHttpUrl } from "@/lib/url-safety";
import type { ReportsData, ServiceOrderItem } from "@/types";

export function createOrdersWorkbook(orders: ServiceOrderItem[]) {
  const rows = orders.map((order) => ({
    "Número da O.S.": order.number,
    Cliente: order.clientName ?? "Sem cliente",
    "Código do cliente": order.clientCode ?? "",
    Endereço: order.address ?? "",
    Localização: sanitizeExternalHttpUrl(order.locationLink) ?? "",
    "Técnico principal": order.assignedTechnician,
    "Técnicos de apoio": order.supportTechnicians.map((item) => item.name).join(", ") || "",
    "Equipe resumida": order.teamSummary,
    "Responsável interno": order.internalOwner,
    Prioridade: order.priority,
    Status: order.status,
    Prazo: order.deadline,
    "Atrasada": order.isLate ? "Sim" : "Não",
    "Vence hoje": order.isDueToday ? "Sim" : "Não",
    "Sem atualização": order.isStale ? "Sim" : "Não",
    "Data de abertura": order.openedAt,
    "Usuário da abertura": order.openedBy,
    "Descrição da abertura": order.openingDescription,
    "Observação interna": order.internalNote,
    "Criada em": formatDateTime(order.createdAtIso),
    "Atualizada em": formatDateTime(order.updatedAtIso)
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Aviso: "Nenhuma O.S. encontrada para os filtros aplicados." }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ordens");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function createReportsWorkbook(report: ReportsData) {
  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    { Indicador: "Quantidade total de O.S.", Valor: report.summary.totalOrders },
    { Indicador: "Quantidade de O.S. atrasadas", Valor: report.summary.lateOrders },
    { Indicador: "Finalizadas", Valor: report.summary.finishedOrders },
    { Indicador: "Tempo médio de finalização", Valor: formatHours(report.summary.avgHoursToFinish) }
  ];

  const filterRows = [
    { Filtro: "De", Valor: report.filters.from || "Todos" },
    { Filtro: "Até", Valor: report.filters.to || "Todos" },
    { Filtro: "Técnico envolvido", Valor: report.filters.technicianId || "Todos" },
    { Filtro: "Status", Valor: report.filters.status ? mapReportStatusLabel(report.filters.status) : "Todos" },
    { Filtro: "Prioridade", Valor: report.filters.priority ? mapReportStatusLabel(report.filters.priority) : "Todas" }
  ];

  const statusRows = report.byStatus.map((item) => ({ Status: mapReportStatusLabel(item.label), Total: item.total }));
  const priorityRows = report.byPriority.map((item) => ({ Prioridade: mapReportStatusLabel(item.label), Total: item.total }));
  const technicianRows = report.byTechnician.map((item) => ({
    Técnico: item.technicianName,
    "Total de O.S.": item.totalOrders,
    Finalizadas: item.finishedOrders,
    Atrasadas: item.lateOrders,
    Pendentes: item.pendingOrders,
    "Tempo médio": formatHours(item.avgHoursToFinish),
    Eficiência: `${item.totalOrders > 0 ? Math.round((item.finishedOrders / item.totalOrders) * 100) : 0}%`
  }));

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Resumo");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filterRows), "Filtros");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(statusRows.length ? statusRows : [{ Aviso: "Sem dados no filtro atual." }]),
    "Por status"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(priorityRows.length ? priorityRows : [{ Aviso: "Sem dados no filtro atual." }]),
    "Por prioridade"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(technicianRows.length ? technicianRows : [{ Aviso: "Sem dados no filtro atual." }]),
    "Por técnico"
  );

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}
