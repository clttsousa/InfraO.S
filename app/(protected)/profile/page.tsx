import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { changeOwnPasswordAction } from "@/app/(protected)/users/actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { FeedbackMessage, FormSection, PageHeader, Surface, TextInput } from "@/components/shared/ui";
import { requireSession } from "@/lib/session";

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Meu acesso" }]} showHome />
      {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}
      <PageHeader eyebrow="Conta" title="Meu acesso" description="Altere sua senha e encerre a sessão atual com segurança." actions={<Link href="/dashboard" className="btn-base btn-secondary btn-md">Voltar ao dashboard</Link>} />
      <Surface className="max-w-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
          Usuário atual: <span className="font-semibold text-[var(--text-primary)]">{session.name}</span> · {session.email}
        </div>
        <form id="profile-password-form" action={changeOwnPasswordAction} className="space-y-4">
          <FormStateGuard formId="profile-password-form" />
          <FormSection title="Alteração de senha" description="Preencha os três campos para atualizar seu acesso com segurança." icon={<KeyRound className="h-4 w-4 text-[var(--primary)]" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextInput autoFocus label="Senha atual" name="currentPassword" type="password" required />
              <div className="hidden md:block" />
              <TextInput label="Nova senha" name="newPassword" type="password" required />
              <TextInput label="Confirmar nova senha" name="confirmPassword" type="password" required />
            </div>
          </FormSection>
          <div className="form-actions-bar">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Atualização segura</p>
              <p className="field-hint">O sistema encerra a sessão atual após a troca e exige novo login.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SubmitButton pendingLabel="Alterando senha...">Alterar senha</SubmitButton>
              <Link href="/dashboard" className="btn-base btn-secondary btn-md">Cancelar</Link>
            </div>
          </div>
        </form>
      </Surface>
    </div>
  );
}
