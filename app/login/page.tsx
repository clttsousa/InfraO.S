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
    <div className="app-shell-bg login-modern-page min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="login-modern-orb login-modern-orb-primary" aria-hidden="true" />
      <div className="login-modern-orb login-modern-orb-secondary" aria-hidden="true" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center justify-center">
        <div className="relative z-[1] flex w-full items-center justify-center">
          <div className="w-full max-w-[31rem] space-y-4">
            {success ? (
              <div className="w-full">
                <FeedbackMessage type="success" title="Acesso atualizado">
                  {success}
                </FeedbackMessage>
              </div>
            ) : null}
            {!envCheck.ok ? (
              <div className="w-full">
                <FeedbackMessage type="error" title="Ambiente incompleto">
                  {envCheck.message}
                </FeedbackMessage>
              </div>
            ) : null}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
