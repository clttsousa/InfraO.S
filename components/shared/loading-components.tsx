"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading Overlay - Overlay com spinner para operações
 */
export function LoadingOverlay({
  isVisible,
  message = "Carregando...",
}: {
  isVisible: boolean;
  message?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-background rounded-xl p-8 shadow-xl flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader - Placeholder com animação
 */
export function SkeletonLoader({
  count = 1,
  variant = "default",
  className = "",
}: {
  count?: number;
  variant?: "default" | "card" | "table" | "avatar";
  className?: string;
}) {
  const variantClasses = {
    default: "h-10 w-full",
    card: "h-32 w-full",
    table: "h-12 w-full",
    avatar: "h-10 w-10 rounded-full",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${variantClasses[variant]} bg-gradient-to-r from-muted to-muted/50 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Card - Card com skeleton
 */
export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg p-4 border border-border">
          <SkeletonLoader count={2} variant="default" />
          <div className="mt-4">
            <SkeletonLoader count={1} variant="default" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Table - Tabela com skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <SkeletonLoader count={1} variant="default" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-t border-border">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <SkeletonLoader count={1} variant="default" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton Avatar - Avatar com skeleton
 */
export function SkeletonAvatar() {
  return <SkeletonLoader count={1} variant="avatar" />;
}

/**
 * Loading Spinner - Spinner simples
 */
export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary ${className}`} />
  );
}

/**
 * Loading Page - Página inteira carregando
 */
export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
}

/**
 * Progress Bar - Barra de progresso
 */
export function ProgressBar({
  progress,
  showLabel = true,
}: {
  progress: number;
  showLabel?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
      )}
    </div>
  );
}
