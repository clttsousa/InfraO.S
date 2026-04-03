import { BarChart3, Palette, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { FeedbackMessage } from "@/components/shared/ui";
import { getPublicRuntimeChecks } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

const highlights = [
  { icon: ShieldCheck, title: "Acesso protegido", description: "Sessões revogáveis, trilha de auditoria e políticas de acesso por perfil para operação interna." },
  { icon: BarChart3, title: "Operação visível", description: "Dashboard, alertas e filtros rápidos para manter ordens críticas sempre em evidência." },
  { icon: Palette, title: "Marca aplicada", description: "Interface refinada com tema adaptável, favicon próprio e identidade visual mais consistente." }
];

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");
  const params = (await searchParams) ?? {};
  const success = typeof params.success === "string" ? decodeURIComponent(params.success) : "";
  const envCheck = getPublicRuntimeChecks();

  return (
    <div className="app-shell-bg login-page-grid flex min-h-screen items-center justify-center px-4 py-8 md:px-6">
      <div className="login-page-shell grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="brand-hero-panel hidden overflow-hidden rounded-[1.8rem] border border-[var(--border)] p-7 shadow-[var(--shadow-md)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandLogo size="lg" subtitle="Gestão visual de ordens, equipes e alertas" />
            <h2 className="app-title mt-8 max-w-xl text-[2.35rem] font-semibold leading-tight">Uma base mais bonita e pronta para subir sem perder o foco na operação.</h2>
            <p className="app-text-secondary mt-4 max-w-2xl text-base leading-7">O InfraOS chega na v3.2 com identidade visual mais forte, acabamento de interface, branding consistente e uma experiência mais profissional para a equipe.</p>
          </div>
          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="hero-highlight-card rounded-[1.25rem] border border-[var(--border)] p-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon className="h-5 w-5" /></span>
                  <h3 className="app-title mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="app-text-secondary mt-2 text-sm leading-6">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
        <div className="flex min-w-0 items-center justify-center lg:justify-end">
          <div className="w-full max-w-[30rem] space-y-4">
            {success ? <div className="w-full"><FeedbackMessage type="success">{success}</FeedbackMessage></div> : null}
            {!envCheck.ok ? <div className="w-full"><FeedbackMessage type="error">{envCheck.message}</FeedbackMessage></div> : null}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
