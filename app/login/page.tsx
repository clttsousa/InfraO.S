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
    <div className="app-shell-bg login-modern-page min-h-screen overflow-hidden px-4 py-5 md:px-6 md:py-8">
      <div className="login-modern-orb login-modern-orb-primary" aria-hidden="true" />
      <div className="login-modern-orb login-modern-orb-secondary" aria-hidden="true" />

      <main className="login-shell-grid relative z-[1] mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl items-center gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(27rem,0.75fr)] lg:gap-8">
        <section className="login-hero-panel-v610 hidden min-h-[34rem] flex-col justify-between rounded-[2rem] border border-[var(--border)] p-7 shadow-[var(--shadow-md)] lg:flex">
          <div>
            <div className="login-hero-badge">
              <span className="login-hero-badge-dot" />
              InfraOS · Operação em tempo real
            </div>
            <h1 className="app-title mt-7 max-w-xl text-[3.25rem] font-semibold leading-[0.98] tracking-[-0.065em]">
              Painel limpo para acompanhar ordens, intervenções e alertas.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Acesse com segurança o ambiente interno, consulte pendências críticas e mantenha a equipe sincronizada sem perder histórico operacional.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Realtime", "Atualizações ao vivo"],
              ["PWA", "Alertas no dispositivo"],
              ["Auditoria", "Histórico rastreável"]
            ].map(([title, description]) => (
              <div key={title} className="login-metric-card">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-tertiary)]">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[30rem] lg:max-w-none">
          <div className="space-y-4">
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
          </div>
        </section>
      </main>
    </div>
  );
}
