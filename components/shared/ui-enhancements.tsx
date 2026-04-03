import React from "react";
/**
 * UI ENHANCEMENTS - Componentes Melhorados para InfraOS
 * 
 * Este arquivo contém extensões e melhorias para os componentes base
 * do InfraOS com design system moderno, animações e micro-interações.
 */

import { ReactNode } from 'react';
import { cn } from '@/components/shared/utils';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

/**
 * Enhanced Button Component
 * Adiciona variantes, loading states e animações
 */
export function ButtonEnhanced({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = 'btn-base disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'px-6 py-3 text-lg h-12',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Enhanced Card Component
 * Adiciona hover effects, variantes e estrutura melhorada
 */
export function CardEnhanced({
  children,
  className = '',
  hoverable = false,
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outline';
}) {
  const variantClasses = {
    default: 'app-surface',
    elevated: 'app-panel',
    outline: 'border-2 border-primary/20 bg-transparent',
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        hoverable && 'hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Enhanced Alert Component
 * Adiciona animações e tipos de alerta melhorados
 */
export function AlertEnhanced({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
}: {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  const alertClasses = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-danger',
    info: 'alert-info',
  };

  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div className={cn(alertClasses[type], 'flex items-start gap-3 animate-slideInDown', className)}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Enhanced Badge Component
 * Adiciona mais variantes e animações
 */
export function BadgeEnhanced({
  children,
  variant = 'neutral',
  animated = false,
}: {
  children: ReactNode;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}) {
  const variantClasses = {
    neutral: 'badge-neutral',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  };

  return (
    <span
      className={cn(
        'badge-base',
        variantClasses[variant],
        animated && 'animate-pulse-soft'
      )}
    >
      {children}
    </span>
  );
}

/**
 * Loading Skeleton Component
 * Placeholder com animação para dados carregando
 */
export function SkeletonLoader({ count = 1, variant = 'default' }: { count?: number; variant?: 'default' | 'card' | 'table' }) {
  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={cn(
        'bg-gradient-to-r from-surface to-surface-muted animate-pulse rounded',
        variant === 'default' && 'h-10 w-full',
        variant === 'card' && 'h-32 w-full',
        variant === 'table' && 'h-12 w-full'
      )}
    />
  ));

  return <div className="space-y-2">{skeletons}</div>;
}

/**
 * Enhanced Input Component
 * Adiciona validação visual e ícones
 */
export function InputEnhanced({
  label,
  error,
  success,
  icon,
  ...props
}: {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="app-text-secondary block text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            'input-base',
            error && 'border-danger focus:border-danger',
            success && 'border-success focus:border-success',
            Boolean(icon) && 'pl-10'
          )}
          {...props}
        />
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-danger" />}
        {success && !error && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/**
 * Toast Notification Component
 * Notificação flutuante com auto-dismiss
 */
export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}) {
  const toastClasses = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'alert-info',
    warning: 'alert-warning',
  };

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={cn(toastClasses[type], 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-slideInUp')}>
      <div className="flex items-center justify-between gap-4">
        <p>{message}</p>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
