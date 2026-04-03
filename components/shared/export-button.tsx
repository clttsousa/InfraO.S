"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";

export type ExportFormat = "excel" | "csv" | "json" | "pdf";

export function ExportButton<T extends Record<string, unknown>>({ data, filename = "export", formats = ["excel", "csv", "json"], columns }: { data: T[]; filename?: string; formats?: ExportFormat[]; columns?: (keyof T)[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { success, error } = useNotifications();

  const downloadFile = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getHeaders = () => columns || (Object.keys(data[0] || {}) as (keyof T)[]);

  const exportToCSV = () => {
    try {
      const headers = getHeaders();
      const csv = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((col) => {
              const value = row[col];
              if (typeof value === "string" && value.includes(",")) return `"${value}"`;
              return String(value ?? "");
            })
            .join(",")
        )
      ].join("\n");
      downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
      success("Arquivo CSV exportado com sucesso!");
    } catch {
      error("Erro ao exportar CSV.");
    }
  };

  const exportToJSON = () => {
    try {
      downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json;charset=utf-8");
      success("Arquivo JSON exportado com sucesso!");
    } catch {
      error("Erro ao exportar JSON.");
    }
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");
      const headers = getHeaders();
      const sheet = XLSX.utils.json_to_sheet(
        data.map((row) => headers.reduce((acc, col) => ({ ...acc, [String(col)]: row[col] }), {} as Record<string, unknown>))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Dados");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      success("Arquivo Excel exportado com sucesso!");
    } catch {
      error("Erro ao exportar Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen((prev) => !prev)} disabled={isExporting || data.length === 0} className="btn-base btn-secondary btn-md">
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isExporting ? "Exportando..." : "Exportar"}
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="app-panel absolute right-0 top-full z-50 mt-2 min-w-52 border p-2">
            {formats.includes("excel") ? <button type="button" onClick={() => { void exportToExcel(); setIsOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]">📊 Exportar como Excel</button> : null}
            {formats.includes("csv") ? <button type="button" onClick={() => { exportToCSV(); setIsOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]">📄 Exportar como CSV</button> : null}
            {formats.includes("json") ? <button type="button" onClick={() => { exportToJSON(); setIsOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]">&#123;&#125; Exportar como JSON</button> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
