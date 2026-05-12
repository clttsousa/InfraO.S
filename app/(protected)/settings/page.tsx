import Link from "next/link";
import { Activity, ImageIcon, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader, Surface } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DeviceNotificationSettings } from "@/components/pwa/device-notification-settings";
import { AdminPreferencesPanel } from "@/components/settings/admin-preferences-panel";
import { BrandLogo } from "@/components/shared/brand-logo";
import { requireAdmin } from "@/lib/session";
import { getSystemHealth } from "@/lib/system-health";

export default async function SettingsPage() {
  await requireAdmin();
  const health = await getSystemHealth();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Configurações" }]} showHome />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Surface className="p-5">
            <PageHeader title="Configurações" description="Ajustes administrativos, preferências de operação e validações de ambiente." actions={<Link href="/profile" className="btn-base btn-secondary btn-md">Meu acesso</Link>} />
          </Surface>
          <AdminPreferencesPanel />
          <Surface className="p-5">
            <DeviceNotificationSettings />
          </Surface>
        </div>
        <div className="space-y-6">
          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Saúde do ambiente</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><Activity className="h-4 w-4 text-[var(--primary)]" />Ambiente</div><div className="mt-1">{health.environment.message}</div></div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><ShieldCheck className="h-4 w-4 text-[var(--primary)]" />Banco</div><div className="mt-1">{health.database.message}</div></div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Endpoint rápido disponível em <span className="font-medium">/api/health</span> para checagem pós-deploy.</div>
            </div>
          </Surface>

          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Identidade aplicada</h3>
            <div className="brand-preview-card mt-4 rounded-[1.4rem] border border-[var(--border)] p-5">
              <BrandLogo size="lg" subtitle="Marca principal do painel" />
              <p className="app-text-secondary mt-4 text-sm leading-6">Marca aplicada no painel, login e navegação principal.</p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><ImageIcon className="h-4 w-4 text-[var(--primary)]" />Favicon</div>Ícone próprio aplicado no app.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><LayoutTemplate className="h-4 w-4 text-[var(--primary)]" />Navegação</div>Marca aplicada em sidebar, topbar e login.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--primary)]" />Acabamento</div>Mais clareza visual nas filas e filtros.</div>
              </div>
            </div>
          </Surface>

          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Checklist pré-subida</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Aplicar <span className="font-medium">database/09_upgrade_v2_9.sql</span> e <span className="font-medium">database/11_saved_order_views.sql</span>.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Executar <span className="font-medium">npm run typecheck</span> e <span className="font-medium">npm run build</span> antes do deploy.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Validar login, filtros salvos, exportações, lifecycle da O.S. e permissões administrativas.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Revisar <span className="font-medium">README.md</span> e <span className="font-medium">docs/ROADMAP_V37_APLICADO.md</span> para o passo a passo atualizado.</div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
