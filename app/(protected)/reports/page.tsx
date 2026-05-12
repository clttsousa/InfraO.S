import { Download } from "lucide-react";
import { EmptyState, FeedbackMessage, PageHeader, Surface, StatLine } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { buildReportQuery, parseReportFilters } from "@/lib/filter-params";
import { formatReportAvgHours, getReportsData, getTechnicians, mapReportStatusLabel } from "@/lib/data";
import type { ReportFilters, TechnicianItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const filters: ReportFilters = parseReportFilters(params);

  let report = null;
  let technicians: TechnicianItem[] = [];
  let loadError: string | null = null;

  try {
    [report, technicians] = await Promise.all([getReportsData(filters), getTechnicians()]);
  } catch (error) {
    console.error("[infraos] reports load error", error);
    loadError = "Não foi possível carregar os relatórios agora. Revise a conexão com o banco e tente novamente.";
  }

  const exportQuery = buildReportQuery(filters).toString();
  const exportHref = `/api/exports/reports${exportQuery ? `?${exportQuery}` : ""}`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Relatórios" }]} showHome />
      {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}

      <PageHeader
        eyebrow="Gestão"
        title="Relatórios"
        description="Indicadores gerenciais com exportação em Excel respeitando os filtros aplicados na tela."
        actions={<a href={exportHref} className="btn-base btn-secondary btn-md"><Download className="h-4 w-4" />Exportar Excel</a>}
      />

      <form className="app-surface grid grid-cols-1 gap-2 rounded-[var(--radius-panel)] p-4 md:grid-cols-2 xl:grid-cols-6">
        <input name="from" defaultValue={report?.filters.from ?? ""} type="date" className="input-base text-sm outline-none" />
        <input name="to" defaultValue={report?.filters.to ?? ""} type="date" className="input-base text-sm outline-none" />
        <select name="technician" defaultValue={report?.filters.technicianId ?? ""} className="select-base text-sm outline-none">
          <option value="">Técnico envolvido: Todos</option>
          {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
        </select>
        <select name="status" defaultValue={report?.filters.status ?? ""} className="select-base text-sm outline-none">
          <option value="">Status: Todos</option>
          <option value="ABERTA">Aberta</option>
          <option value="ENCAMINHADA">Encaminhada</option>
          <option value="EM_ACOMPANHAMENTO">Em acompanhamento</option>
          <option value="PENDENTE">Pendente</option>
          <option value="FINALIZADA">Finalizada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <select name="priority" defaultValue={report?.filters.priority ?? ""} className="select-base text-sm outline-none">
          <option value="">Prioridade: Todas</option>
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
        <button type="submit" className="btn-base btn-primary btn-md">Aplicar filtros</button>
      </form>

      {!report ? (
        <Surface className="p-5"><EmptyState title="Relatórios indisponíveis" description="A aplicação não conseguiu consultar o banco neste momento." /></Surface>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Surface className="p-5">
              <h3 className="app-title text-lg font-semibold">Indicadores</h3>
              <div className="mt-4">
                <StatLine label="Quantidade total de O.S." value={String(report.summary.totalOrders)} valueClassName="app-number text-[var(--text-primary)]" />
                <StatLine label="Quantidade finalizada" value={String(report.summary.finishedOrders)} valueClassName="app-number text-[var(--success)]" />
                <StatLine label="Quantidade atrasada" value={String(report.summary.lateOrders)} valueClassName="app-number text-[var(--danger)]" />
                <StatLine label="Pendentes" value={String(report.summary.pendingOrders)} valueClassName="app-number text-[var(--warning)]" />
                <StatLine label="Tempo médio de finalização" value={formatReportAvgHours(report.summary.avgHoursToFinish)} />
              </div>
            </Surface>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Surface className="p-5">
                <h3 className="app-title text-lg font-semibold">Por status</h3>
                <div className="mt-4 space-y-2">
                  {report.byStatus.length === 0 ? <EmptyState compact title="Sem dados de status" description="Ajuste o período ou remova filtros para visualizar a distribuição." /> : report.byStatus.map((item) => <div key={item.label} className="border-b border-[var(--border)] py-2.5 last:border-b-0 flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">{mapReportStatusLabel(item.label)}</span><span className="app-number text-sm font-semibold text-[var(--text-primary)]">{item.total}</span></div>)}
                </div>
              </Surface>

              <Surface className="p-5">
                <h3 className="app-title text-lg font-semibold">Por prioridade</h3>
                <div className="mt-4 space-y-2">
                  {report.byPriority.length === 0 ? <EmptyState compact title="Sem dados de prioridade" description="Ajuste os filtros para exibir um recorte com dados." /> : report.byPriority.map((item) => <div key={item.label} className="border-b border-[var(--border)] py-2.5 last:border-b-0 flex items-center justify-between"><span className="text-sm text-[var(--text-secondary)]">{mapReportStatusLabel(item.label)}</span><span className="app-number text-sm font-semibold text-[var(--text-primary)]">{item.total}</span></div>)}
                </div>
              </Surface>
            </div>
          </div>

          <Surface className="overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="app-title text-lg font-semibold">Produtividade por técnico</h3>
              <p className="app-text-secondary text-sm leading-6">Visão de volume, atrasos, pendências e tempo médio considerando ordens como responsável principal ou apoio.</p>
            </div>
            <div className="app-scrollbar overflow-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="table-head">
                  <tr>
                    {['Técnico', 'Total de O.S.', 'Finalizadas', 'Atrasadas', 'Pendentes', 'Tempo médio', 'Eficiência básica'].map((label) => <th key={label} className="px-5 py-3 font-medium">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.byTechnician.length === 0 ? (
                    <tr><td colSpan={7} className="px-0 py-0"><EmptyState compact title="Sem produtividade para mostrar" description="Quando houver dados no filtro atual, a comparação por técnico aparecerá aqui." /></td></tr>
                  ) : report.byTechnician.map((item) => {
                    const efficiency = item.totalOrders > 0 ? Math.round((item.finishedOrders / item.totalOrders) * 100) : 0;
                    return (
                      <tr key={item.technicianId} className={item.lateOrders > 0 ? 'table-row table-row-late' : 'table-row'}>
                        <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{item.technicianName}</td>
                        <td className="app-number px-5 py-3 text-[var(--text-secondary)]">{item.totalOrders}</td>
                        <td className="app-number px-5 py-3 text-[var(--success)]">{item.finishedOrders}</td>
                        <td className="app-number px-5 py-3 text-[var(--danger)]">{item.lateOrders}</td>
                        <td className="app-number px-5 py-3 text-[var(--warning)]">{item.pendingOrders}</td>
                        <td className="px-5 py-3 text-[var(--text-secondary)]">{formatReportAvgHours(item.avgHoursToFinish)}</td>
                        <td className="app-number px-5 py-3 text-[var(--text-secondary)]">{efficiency}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}
