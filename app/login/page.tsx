import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { FeedbackMessage } from "@/components/shared/ui";
import { getPublicRuntimeChecks } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");

  const params = (await searchParams) ?? {};
  const success = typeof params.success === "string" ? decodeURIComponent(params.success) : "";
  const envCheck = getPublicRuntimeChecks();

  return (
    <main className="app-shell-bg login-clean-page min-h-screen overflow-hidden px-4 py-5 md:px-6 md:py-8">
      <div className="login-clean-glow login-clean-glow-primary" aria-hidden="true" />
      <div className="login-clean-glow login-clean-glow-secondary" aria-hidden="true" />
      <section className="relative z-[1] mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[31rem] flex-col justify-center gap-4">
        {success ? (
          <FeedbackMessage type="success" title="Acesso atualizado">
            {success}
          </FeedbackMessage>
        ) : null}
        {!envCheck.ok ? (
          <FeedbackMessage type="error" title="Ambiente incompleto">
            {envCheck.message}
          </FeedbackMessage>
        ) : null}
        <LoginForm />
        <p className="login-clean-footer text-center text-xs leading-5 text-[var(--text-tertiary)]">
          InfraOS · acesso interno restrito · use apenas contas autorizadas.
        </p>
      </section>
    </main>
  );
}
