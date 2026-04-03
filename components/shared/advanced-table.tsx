"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Download, Trash2, Eye } from "lucide-react";

export interface Column<T> {
  id: string;
  label: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onDelete?: (row: T) => void;
  onExport?: (data: T[]) => void;
  selectable?: boolean;
  sortable?: boolean;
  loading?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function AdvancedTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  onDelete,
  onExport,
  selectable = false,
  sortable = true,
  loading = false,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Ordenação
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((c) => c.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(
        sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc"
      );
      if (sortDirection === "desc") setSortColumn(null);
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map((row) => row.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Nenhum dado encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium flex-1">
            {selectedRows.size} item(ns) selecionado(s)
          </p>
          {onExport && (
            <button
              onClick={() => {
                const selected = sortedData.filter((row) =>
                  selectedRows.has(row.id)
                );
                onExport(selected);
              }}
              className="btn-base btn-ghost btn-sm flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                const selected = sortedData.find((row) =>
                  selectedRows.has(row.id)
                );
                if (selected) onDelete(selected);
              }}
              className="btn-base btn-danger btn-sm flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletar
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sortedData.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-left font-medium ${
                    column.sortable ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column.id)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && column.sortable && (
                      <div className="flex flex-col gap-0.5">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortColumn === column.id && sortDirection === "asc"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 ${
                            sortColumn === column.id && sortDirection === "desc"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {(onRowClick || onDelete) && <th className="px-4 py-3">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="rounded"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-3">
                    {column.accessor(row)}
                  </td>
                ))}
                {(onRowClick || onDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {onRowClick && (
                        <button
                          onClick={() => onRowClick(row)}
                          className="btn-base btn-ghost btn-sm"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="btn-base btn-danger btn-sm"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
