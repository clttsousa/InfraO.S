"use client";

import React, { useState } from "react";
import { Calendar, X } from "lucide-react";

export function DatePicker({ label, value, onChange, minDate, maxDate, error, disabled = false }: { label?: string; value: string; onChange: (date: string) => void; minDate?: Date; maxDate?: Date; error?: string; disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(selected.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => i);

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label> : null}
      <div className="relative">
        <div className="input-base flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="AAAA-MM-DD"
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          />
          {value ? (
            <button type="button" onClick={() => onChange("")} className="btn-base btn-ghost btn-sm h-8 w-8 rounded-lg p-0 text-[var(--text-tertiary)]">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isOpen ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="app-panel absolute left-0 top-full z-50 mt-2 w-80 border p-4">
              <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="btn-base btn-ghost btn-sm">←</button>
                <h3 className="text-sm font-semibold capitalize text-[var(--text-primary)]">
                  {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </h3>
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="btn-base btn-ghost btn-sm">→</button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-[var(--text-tertiary)]">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((i) => <div key={`empty-${i}`} />)}
                {days.map((day) => {
                  const selectedValue = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split("T")[0];
                  const isSelected = value === selectedValue;
                  const isDisabled = isDateDisabled(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className="rounded-lg p-2 text-sm"
                      style={{
                        background: isSelected ? "var(--primary)" : "transparent",
                        color: isSelected ? "white" : isDisabled ? "var(--text-tertiary)" : "var(--text-primary)",
                        opacity: isDisabled ? 0.45 : 1
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}

export function DateRangePicker({ label, startDate, endDate, onStartDateChange, onEndDateChange, error }: { label?: string; startDate: string; endDate: string; onStartDateChange: (date: string) => void; onEndDateChange: (date: string) => void; error?: string }) {
  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label> : null}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <DatePicker value={startDate} onChange={onStartDateChange} maxDate={endDate ? new Date(endDate) : undefined} />
        <span className="px-2 text-center text-sm text-[var(--text-tertiary)]">até</span>
        <DatePicker value={endDate} onChange={onEndDateChange} minDate={startDate ? new Date(startDate) : undefined} />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
