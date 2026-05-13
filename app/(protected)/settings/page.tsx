import Link from "next/link";
import { Activity, BellRing, Database, ImageIcon, LayoutTemplate, LockKeyhole, Palette, ShieldCheck, Smartphone, Sparkles, UserRound } from "lucide-react";
import { PageHeader, Surface } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DeviceNotificationSettings } from "@/components/pwa/device-notification-settings";
import { AdminPreferencesPanel } from "@/components/settings/admin-preferences-panel";
import { InterventionReminderSettingsForm } from "@/components/settings/intervention-reminder-settings-form";
import { SettingsAccordionSection } from "@/components/settings/settings-accordion-section";
import { BrandLogo } from "@/components/shared/brand-logo";
import { requireAdmin } from "@/lib/session";
import { getSystemHealth } from "@/lib/system-health";
import { getInterventionReminderSettings } from "@/lib/server-data/reminder-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const [health, reminderSettings] = await Promise.all([getSystemHealth(), getInterventionReminderSettings()]);

  return (
    <div className="settings-page app-content-fluid space-y-5 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Configurações" }]} showHome />
      <Surface className="p-5">
        <PageHeader title="Configurações" description="Ajustes administrativos reorganizados em seções curtas para o celular, sem perder a visão completa no desktop." actions={<Link href="/profile" className="btn-base btn-secondary btn-md">Meu acesso</Link>} />
      </Surface>

      <div className="settings-accordion-stack">
        <SettingsAccordionSection title="Perfil" description="Dados do acesso atual e atalhos de conta." icon={<UserRound className="h-5 w-5" />} defaultOpen>
          <Surface className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="app-title text-lg font-semibold">Meu acesso</h3>
                <p className="app-text-secondary mt-1 text-sm leading-6">Consulte seus dados de sessão e confirme se o acesso nominal está correto para auditoria.</p>
              </div>
              <Link href="/profile" className="btn-base btn-secondary btn-md">Abrir meu acesso</Link>
            </div>
          </Surface>
        </SettingsAccordionSection>

        <SettingsAccordionSection title="Aparência" description="Tema, densidade e preferências visuais do painel." icon={<Palette className="h-5 w-5" />} defaultOpen={false}>
          <AdminPreferencesPanel />
        </SettingsAccordionSection>

        <SettingsAccordionSection title="Notificações" description="Atalhos para a central e leitura operacional de alertas." icon={<BellRing className="h-5 w-5" />} defaultOpen={false}>
          <Surface className="p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]"><BellRing className="h-4 w-4 text-[var(--primary)]" />Central de notificações</div>
                A V6.18.0 adiciona regras inteligentes, severidade, destinatários, cooldown e preferências por usuário.
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Link href="/notifications" className="app-surface-muted rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--primary)] transition hover:-translate-y-0.5">Abrir central de notificações</Link>
                <Link href="/settings/notifications" className="app-surface-muted rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--primary)] transition hover:-translate-y-0.5">Configurar notificações inteligentes</Link>
              </div>
            </div>
          </Surface>
        </SettingsAccordionSection>

        <SettingsAccordionSection title="PWA / Dispositivo" description="Diagnóstico, ativação e testes de push neste aparelho." icon={<Smartphone className="h-5 w-5" />} defaultOpen={false}>
          <Surface className="p-5">
            <DeviceNotificationSettings />
          </Surface>
        </SettingsAccordionSection>

        <SettingsAccordionSection title="Lembretes" description="Padrões para lembretes configuráveis de intervenções." icon={<BellRing className="h-5 w-5" />} defaultOpen={false}>
          <Surface className="p-5">
            <InterventionReminderSettingsForm settings={reminderSettings} />
          </Surface>
        </SettingsAccordionSection>

        <SettingsAccordionSection title="Segurança" description="Saúde do ambiente, banco e validações essenciais." icon={<LockKeyhole className="h-5 w-5" />} defaultOpen={false}>
          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Saúde do ambiente</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><Activity className="h-4 w-4 text-[var(--primary)]" />Ambiente</div><div className="mt-1">{health.environment.message}</div></div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><ShieldCheck className="h-4 w-4 text-[var(--primary)]" />Banco</div><div className="mt-1">{health.database.message}</div></div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Endpoint rápido disponível em <span className="font-medium">/api/health</span> para checagem pós-deploy.</div>
            </div>
          </Surface>
        </SettingsAccordionSection>

        <SettingsAccordionSection title="Sistema" description="Identidade visual aplicada e checklist de produção." icon={<Database className="h-5 w-5" />} defaultOpen={false}>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Surface className="p-5">
              <h3 className="app-title text-lg font-semibold">Identidade aplicada</h3>
              <div className="brand-preview-card mt-4 rounded-[1.4rem] border border-[var(--border)] p-5">
                <BrandLogo size="lg" subtitle="Marca principal do painel" />
                <p className="app-text-secondary mt-4 text-sm leading-6">Marca aplicada no painel, login e navegação principal.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><ImageIcon className="h-4 w-4 text-[var(--primary)]" />Favicon</div>Ícone próprio aplicado no app.</div>
                  <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><LayoutTemplate className="h-4 w-4 text-[var(--primary)]" />Navegação</div>Marca aplicada em sidebar, topbar e login.</div>
                  <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--primary)]" />Acabamento</div>UX mobile operacional refinada.</div>
                </div>
              </div>
            </Surface>

            <Surface className="p-5">
              <h3 className="app-title text-lg font-semibold">Checklist pré-subida</h3>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Executar <span className="font-medium">npm run typecheck</span> e <span className="font-medium">npm run build</span> antes do deploy.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Validar login, filtros, lifecycle da O.S., intervenções, PWA e permissões administrativas.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Revisar <span className="font-medium">README.md</span>, <span className="font-medium">CHANGELOG.md</span> e <span className="font-medium">V6_18_0_RESUMO.md</span>.</div>
              </div>
            </Surface>
          </div>
        </SettingsAccordionSection>
      </div>
    </div>
  );
}
