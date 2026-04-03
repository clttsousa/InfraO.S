import Link from "next/link";
import { changeOwnPasswordAction } from "@/app/(protected)/users/actions";
import { FeedbackMessage, PageHeader, Surface, TextInput } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
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
      <PageHeader eyebrow="Conta" title="Meu acesso" description="Altere a sua própria senha sem depender do administrador." actions={<Link href="/dashboard" className="btn-base btn-secondary btn-md">Voltar ao dashboard</Link>} />
      <Surface className="max-w-2xl p-5">
        <div className="mb-4 text-sm text-[var(--text-secondary)]">Usuário atual: <span className="font-semibold text-[var(--text-primary)]">{session.name}</span> · {session.email}</div>
        <form action={changeOwnPasswordAction} className="space-y-4">
          <TextInput label="Senha atual" name="currentPassword" type="password" required />
          <TextInput label="Nova senha" name="newPassword" type="password" required />
          <TextInput label="Confirmar nova senha" name="confirmPassword" type="password" required />
          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            <button type="submit" className="btn-base btn-primary btn-md">Alterar senha</button>
            <Link href="/dashboard" className="btn-base btn-secondary btn-md">Cancelar</Link>
          </div>
        </form>
      </Surface>
    </div>
  );
}
