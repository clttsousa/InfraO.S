import { useId } from "react";
import { cn } from "@/components/shared/utils";

type BrandLogoSize = "sm" | "md" | "lg";
type BrandLogoVariant = "full" | "mark";

const sizeMap: Record<BrandLogoSize, { mark: string; title: string; subtitle: string; gap: string }> = {
  sm: { mark: "h-10 w-10 rounded-[1rem]", title: "text-base", subtitle: "text-[11px]", gap: "gap-2.5" },
  md: { mark: "h-12 w-12 rounded-[1.1rem]", title: "text-[1.2rem]", subtitle: "text-xs", gap: "gap-3" },
  lg: { mark: "h-14 w-14 rounded-[1.2rem]", title: "text-[1.45rem]", subtitle: "text-sm", gap: "gap-3.5" }
};

export function BrandLogo({ variant = "full", size = "md", subtitle = "Operação de infraestrutura", className, subtitleClassName, titleClassName }: { variant?: BrandLogoVariant; size?: BrandLogoSize; subtitle?: string; className?: string; subtitleClassName?: string; titleClassName?: string; }) {
  const gradientId = useId();
  const sizes = sizeMap[size];

  return (
    <span className={cn("brand-logo inline-flex items-center", sizes.gap, className)}>
      <span className={cn("brand-mark relative inline-flex shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]", sizes.mark)}>
        <svg viewBox="0 0 64 64" className="h-[76%] w-[76%]" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--secondary)" />
              <stop offset="1" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <path d="M18 22.5C18 18.3579 21.3579 15 25.5 15H38.5C42.6421 15 46 18.3579 46 22.5V31.5C46 35.6421 42.6421 39 38.5 39H33L27.5 45.5C27.0286 46.0572 26.1958 46.0913 25.6808 45.5744C25.4362 45.3291 25.2986 44.9968 25.2986 44.6504V39H25.5C21.3579 39 18 35.6421 18 31.5V22.5Z" fill={`url(#${gradientId})`} fillOpacity="0.18" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
          <circle cx="25" cy="27" r="4.5" fill={`url(#${gradientId})`} />
          <circle cx="39" cy="23" r="3.5" fill="var(--text-primary)" fillOpacity="0.88" />
          <circle cx="38.5" cy="33.5" r="4" fill="var(--primary)" />
          <path d="M28.8 25.5L35.4 23.6" stroke="var(--text-primary)" strokeOpacity="0.82" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28.7 28.9L34.8 31.9" stroke="var(--text-primary)" strokeOpacity="0.82" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42.5 12.5L46 16" stroke="var(--secondary)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M46 12.5L42.5 16" stroke="var(--secondary)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="pointer-events-none absolute inset-[1px] rounded-[calc(1rem-2px)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_52%)]" />
      </span>
      {variant === "full" ? (
        <span className="min-w-0">
          <span className={cn("brand-wordmark block truncate font-semibold leading-none tracking-[-0.04em] text-[var(--text-primary)]", sizes.title, titleClassName)}>
            Infra<span className="bg-[linear-gradient(135deg,var(--secondary),var(--primary))] bg-clip-text text-transparent">OS</span>
          </span>
          <span className={cn("brand-subtitle mt-1 block truncate leading-none text-[var(--text-tertiary)]", sizes.subtitle, subtitleClassName)}>{subtitle}</span>
        </span>
      ) : null}
    </span>
  );
}
