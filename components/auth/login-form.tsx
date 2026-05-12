"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button, FeedbackMessage, Surface } from "@/components/shared/ui";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useNotifications } from "@/components/providers/notification-provider";
import { validateEmail, validateRequired } from "@/lib/validators";
import { BrandLogo } from "@/components/shared/brand-logo";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { success, error } = useNotifications();

  const emailError = useMemo(() => {
    if (!email) return "";
    return validateEmail(email).error ?? "";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "";
    return validateRequired(password, "Senha").error ?? "";
  }, [password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const emailValidation = validateEmail(email);
    const passwordValidation = validateRequired(password, "Senha");

    if (!emailValidation.isValid) {
      const message = emailValidation.error ?? "Email inválido.";
      setErrorMessage(message);
      error(message);
      return;
    }

    if (!passwordValidation.isValid) {
      const message = passwordValidation.error ?? "Senha obrigatória.";
      setErrorMessage(message);
      error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message ?? "Não foi possível autenticar.";
        setErrorMessage(message);
        error(message);
        setIsSubmitting(false);
        return;
      }

      success("Login realizado com sucesso!", {
        action: { label: "Ir para o dashboard", onClick: () => router.push("/dashboard") }
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      const message = "Falha ao conectar com o servidor.";
      setErrorMessage(message);
      error(message);
      setIsSubmitting(false);
    }
  }

  return (
    <Surface className="login-premium-card w-full overflow-hidden p-5 shadow-[var(--shadow-md)] md:p-8">
      <div className="login-theme-control" aria-label="Alternar tema">
        <ThemeToggle />
      </div>

      <header className="login-premium-header text-center">
        <div className="mx-auto flex justify-center">
          <BrandLogo size="lg" subtitle="Painel interno" className="justify-center" />
        </div>
        <h2 className="app-title mt-6 text-[2rem] font-semibold tracking-[-0.045em] md:text-[2.35rem]">Entrar no InfraOS</h2>
        <p className="mx-auto mt-2 max-w-[22rem] text-sm leading-6 text-[var(--text-secondary)]">
          Acesse o painel operacional com sua conta autorizada.
        </p>
      </header>

      <div className="login-security-line mt-6">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--primary)]" />
        <span>Acesso nominal, restrito e auditado por perfil.</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">E-mail</span>
          <div className="login-input-wrap input-base flex items-center gap-2 rounded-2xl px-3.5 py-3 focus-within:ring-0" style={{ borderColor: emailError ? "var(--danger)" : undefined }}>
            <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="voce@empresa.com"
              className="w-full border-0 bg-transparent text-sm outline-none"
              autoComplete="email"
              autoFocus
            />
          </div>
          {emailError ? <p className="mt-1.5 text-xs text-[var(--danger)]">{emailError}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">Senha</span>
          <div className="login-input-wrap input-base flex items-center gap-2 rounded-2xl px-3.5 py-3 focus-within:ring-0" style={{ borderColor: passwordError ? "var(--danger)" : undefined }}>
            <LockKeyhole className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              className="w-full border-0 bg-transparent text-sm outline-none"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="btn-base btn-ghost btn-sm h-9 w-9 rounded-xl p-0"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError ? <p className="mt-1.5 text-xs text-[var(--danger)]">{passwordError}</p> : null}
        </label>

        {errorMessage ? (
          <FeedbackMessage type="error" title="Falha no acesso">
            {errorMessage}
          </FeedbackMessage>
        ) : null}

        <Button type="submit" className="login-submit-button mt-2 w-full justify-center" loading={isSubmitting}>
          <span>{isSubmitting ? "Entrando..." : "Entrar no painel"}</span>
          {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-[var(--text-tertiary)]">
        Problemas para acessar? Solicite liberação ou redefinição ao administrador.
      </p>
    </Surface>
  );
}
