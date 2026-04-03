import Link from "next/link";
import { ImageIcon, LayoutTemplate, Sparkles } from "lucide-react";
import { PageHeader, Surface } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AdminPreferencesPanel } from "@/components/settings/admin-preferences-panel";
import { BrandLogo } from "@/components/shared/brand-logo";
import { requireAdmin } from "@/lib/session";

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Configurações" }]} showHome />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Surface className="p-5">
            <PageHeader title="Configurações" description="Ajustes administrativos, preferências de operação e controles visuais que refinam a experiência do painel." actions={<Link href="/profile" className="btn-base btn-secondary btn-md">Meu acesso</Link>} />
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="font-medium text-[var(--text-primary)]">Sessão revogável</div>Tokens são invalidados quando a senha muda.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="font-medium text-[var(--text-primary)]">Rate limit de login</div>Persistência no banco com fallback local se a migration ainda não foi aplicada.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="font-medium text-[var(--text-primary)]">Auditoria operacional</div>Finalização, cancelamento, reabertura e observações permanecem rastreáveis.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="font-medium text-[var(--text-primary)]">Experiência ajustável</div>Densidade de listagem, cards do dashboard e atalhos ficam configuráveis neste navegador.</div>
            </div>
          </Surface>
          <AdminPreferencesPanel />
        </div>
        <div className="space-y-6">
          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Identidade aplicada</h3>
            <div className="brand-preview-card mt-4 rounded-[1.4rem] border border-[var(--border)] p-5">
              <BrandLogo size="lg" subtitle="Marca principal do painel" />
              <p className="app-text-secondary mt-4 text-sm leading-6">A v3.2 consolida a presença visual do InfraOS com logo na navegação, login refinado, favicon próprio e acabamento de superfícies para deixar o sistema com mais cara de produto final.</p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><ImageIcon className="h-4 w-4 text-[var(--primary)]" />Favicon</div>Ícone próprio adicionado via `app/icon.svg`.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><LayoutTemplate className="h-4 w-4 text-[var(--primary)]" />Sidebar</div>Marca aplicada nas versões expandida, compacta e mobile.</div>
                <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3 text-sm text-[var(--text-secondary)]"><div className="flex items-center gap-2 font-medium text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--primary)]" />Login</div>Entrada com hero visual, copy revisada e acabamento premium.</div>
              </div>
            </div>
          </Surface>
          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Regras administrativas</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Somente equipe interna autenticada acessa o sistema.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Usuários, técnicos e configurações continuam restritos ao administrador.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">As preferências desta tela são aplicadas sem quebrar o fluxo operacional atual.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">O último administrador ativo não pode ser removido nem inativado.</div>
            </div>
          </Surface>
          <Surface className="p-5">
            <h3 className="app-title text-lg font-semibold">Checklist pré-subida</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Aplicar `database/09_upgrade_v2_9.sql` para a proteção persistente de login.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Criar usuários reais e remover senhas provisórias de ambiente de desenvolvimento.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Validar criação, edição, finalização, cancelamento e reabertura de O.S.</div>
              <div className="app-surface-muted rounded-[var(--radius-control)] px-4 py-3">Executar `npm run typecheck` e `npm run build` antes do deploy final.</div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
