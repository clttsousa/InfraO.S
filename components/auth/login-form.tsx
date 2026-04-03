"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message ?? "Não foi possível autenticar.";
        setErrorMessage(message);
        error(message);
        setIsSubmitting(false);
        return;
      }
      success("Login realizado com sucesso!", { action: { label: "Ir para o dashboard", onClick: () => router.push("/dashboard") } });
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
    <Surface className="login-surface w-full max-w-[30rem] overflow-hidden p-6 shadow-[var(--shadow-md)] md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <BrandLogo size="md" subtitle="Painel interno de infraestrutura" />
          <p className="app-eyebrow mt-5 text-xs font-medium">InfraOS v3.2</p>
          <h1 className="app-title mt-2 text-3xl font-semibold">Entrar no sistema</h1>
          <p className="app-text-secondary mt-2 text-sm leading-6">Ambiente interno com sessão protegida, auditoria de ações, tema claro/escuro e identidade visual refinada para operação diária.</p>
        </div>
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="app-text-secondary mb-1.5 block text-sm font-medium">E-mail</span>
          <div className="input-base flex items-center gap-2 rounded-xl px-3 py-2.5 focus-within:ring-0" style={{ borderColor: emailError ? "var(--danger)" : undefined }}>
            <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@empresa.com" className="w-full border-0 bg-transparent text-sm outline-none" autoComplete="email" />
          </div>
          {emailError ? <p className="mt-1 text-xs text-[var(--danger)]">{emailError}</p> : null}
        </label>
        <label className="block">
          <span className="app-text-secondary mb-1.5 block text-sm font-medium">Senha</span>
          <div className="input-base flex items-center gap-2 rounded-xl px-3 py-2.5 focus-within:ring-0" style={{ borderColor: passwordError ? "var(--danger)" : undefined }}>
            <LockKeyhole className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Sua senha" className="w-full border-0 bg-transparent text-sm outline-none" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="btn-base btn-ghost btn-sm h-8 w-8 rounded-lg p-0" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError ? <p className="mt-1 text-xs text-[var(--danger)]">{passwordError}</p> : null}
        </label>
        {errorMessage ? <FeedbackMessage type="error">{errorMessage}</FeedbackMessage> : null}
        <Button type="submit" className="mt-2 w-full" loading={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar"}</Button>
      </form>
      <div className="app-surface-muted mt-6 rounded-[1.25rem] p-4 text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]"><ShieldCheck className="h-4 w-4 text-[var(--primary)]" />Acesso controlado</div>
        <p className="mt-2 leading-6">As credenciais iniciais não ficam mais expostas na interface. Solicite criação, redefinição ou troca de acesso diretamente ao administrador do sistema.</p>
        <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">Em produção, utilize contas nominais e altere senhas provisórias no primeiro acesso em <span className="font-medium">Meu acesso</span>.</p>
      </div>
    </Surface>
  );
}
