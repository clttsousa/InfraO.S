import { ClipboardPen, Sparkles, Wand2 } from "lucide-react";
import { createServiceOrderAction } from "@/app/(protected)/orders/actions";
import { SupportTechnicianSelector } from "@/components/orders/support-technician-selector";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { Button, ButtonLink, FeedbackMessage, FormHelper, FormHint, FormSection, SelectInput, Surface, TextAreaInput, TextInput } from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS } from "@/lib/constants";
import { getInternalUserDirectory, getTechnicianDirectory } from "@/lib/data";
import { buildParserFeedback, parseServiceOrderText } from "@/lib/order-parser";
import { requireSession } from "@/lib/session";
import { decodeSearchParamMessage } from "@/lib/search-param-feedback";

function getStringValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getParserDescription(base: string, parsed?: string) {
  return parsed ? `${base} · preenchido automaticamente pelo parser.` : base;
}

export default async function NewOrderPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const rawText = getStringValue(params.rawText);
  const success = getStringValue(params.success);
  const error = getStringValue(params.error);
  const parsed = rawText ? parseServiceOrderText(rawText) : {};
  const parserFeedback = buildParserFeedback(parsed);
  const recognized = parserFeedback.filter((item) => item.status === "recognized");
  const missing = parserFeedback.filter((item) => item.status === "missing");
  const session = await requireSession();
  const [technicians, internalUsers] = await Promise.all([getTechnicianDirectory(), getInternalUserDirectory()]);
  const activeTechnicians = technicians.filter((technician) => technician.active);
  const activeUsers = internalUsers.filter((user) => user.active);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Ordens", href: "/orders" }, { label: "Nova O.S." }]} showHome />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-6">
          <Surface className="p-5">
            <div>
              <h2 className="app-title text-2xl font-semibold">Nova O.S.</h2>
              <p className="app-text-secondary mt-2 text-sm leading-6">Cadastro guiado para operação real, com parser opcional, melhor agrupamento visual e proteção contra perda acidental de dados.</p>
            </div>

            <form method="get" className="mt-5 space-y-4">
              <FormSection title="Interpretar texto bruto" description="Cole a O.S. recebida por WhatsApp, e-mail ou sistema legado para preencher os campos principais automaticamente." icon={<Wand2 className="h-4 w-4 text-[var(--primary)]" />}>
                <TextAreaInput label="Texto bruto da O.S. (opcional)" name="rawText" defaultValue={rawText} rows={12} description="O parser tenta reconhecer número, abertura, cliente, endereço e localização." />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="submit">Interpretar texto</Button>
                  <ButtonLink href="/orders/new" variant="secondary">Limpar parser</ButtonLink>
                </div>
              </FormSection>
            </form>

            {rawText ? (
              <div className="parser-feedback-panel mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)]/68 p-4 text-sm text-[var(--text-secondary)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Leitura do parser</p>
                    <p className="mt-1 leading-6">{recognized.length} campo(s) reconhecido(s) automaticamente. Revise o que ficou faltando antes de salvar.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="badge-base badge-success">{recognized.length} reconhecidos</span>
                    <span className="badge-base badge-secondary">{missing.length} pendentes</span>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {recognized.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Campos reconhecidos</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {recognized.map((field) => <span key={field.key} className="parser-chip parser-chip-success">{field.label}</span>)}
                      </div>
                    </div>
                  ) : null}
                  {missing.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Conferir manualmente</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {missing.map((field) => <span key={field.key} className="parser-chip parser-chip-muted">{field.label}</span>)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-5 app-surface-muted rounded-[1.25rem] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)]">Exemplos suportados pelo parser</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-6">
                <li>Ordem de Serviço nº 002526090185254969</li>
                <li>Data de Abertura: 31/03/2026 18:52:54</li>
                <li>Usuário da Abertura: João Vitor dos Reis</li>
                <li>Descrição da Abertura: O.S. de infra devido à CTO sem sinal</li>
                <li>Cliente: (130682) SHAYANE APARECIDA DE SOUSA</li>
                <li>Endereço: BLOCO 3 AP 103</li>
                <li>Localização: maps.app.goo.gl/p1SgNS6vdF7V4G547</li>
              </ul>
            </div>
          </Surface>
        </div>

        <Surface className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="app-title text-lg font-semibold">Cadastro manual da O.S.</h3>
              <p className="app-text-secondary mt-1 text-sm leading-6">Formulário premium com foco em preenchimento rápido, leitura melhor e menor chance de erro operacional.</p>
            </div>
            {rawText ? <span className="badge-base badge-success">Parser aplicado</span> : null}
          </div>

          {success ? <FeedbackMessage type="success">{decodeSearchParamMessage(success)}</FeedbackMessage> : null}
          {error ? <FeedbackMessage type="error">{decodeSearchParamMessage(error)}</FeedbackMessage> : null}
          <FormHint>Os campos obrigatórios aparecem primeiro. Se você sair da página com alterações, o navegador avisa.</FormHint>

          <form id="order-create-form" action={createServiceOrderAction} className="mt-5 space-y-4">
            <FormStateGuard formId="order-create-form" />
            <input type="hidden" name="rawInput" value={rawText} />

            <FormSection title="Dados principais" description="Informações centrais da ordem e do cliente." icon={<ClipboardPen className="h-4 w-4 text-[var(--primary)]" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput autoFocus label="Número da O.S." name="orderNumber" defaultValue={parsed.orderNumber ?? ""} required description={getParserDescription("Identificador único usado na operação.", parsed.orderNumber)} className={parsed.orderNumber ? "field-autofilled" : ""} />
                <TextInput label="Data de abertura" name="openedAt" type="datetime-local" defaultValue={parsed.openedAt?.slice(0, 16) ?? ""} description={getParserDescription("Pode ficar em branco se não veio no texto original.", parsed.openedAt)} className={parsed.openedAt ? "field-autofilled" : ""} />
                <TextInput label="Usuário da abertura" name="openedBy" defaultValue={parsed.openedBy ?? ""} description={getParserDescription("Pessoa que abriu a ordem na origem.", parsed.openedBy)} className={parsed.openedBy ? "field-autofilled" : ""} />
                <TextInput label="Código do cliente" name="clientCode" defaultValue={parsed.clientCode ?? ""} description={getParserDescription("Opcional, mas ajuda na busca futura.", parsed.clientCode)} className={parsed.clientCode ? "field-autofilled" : ""} />
                <div className="md:col-span-2"><TextInput label="Nome do cliente" name="clientName" defaultValue={parsed.clientName ?? ""} description={getParserDescription("Use o nome exatamente como veio da abertura para facilitar rastreio.", parsed.clientName)} className={parsed.clientName ? "field-autofilled" : ""} /></div>
                <div className="md:col-span-2"><TextInput label="Endereço" name="addressText" defaultValue={parsed.address ?? ""} description={getParserDescription("Inclua bloco/apto/local de atendimento quando existir.", parsed.address)} className={parsed.address ? "field-autofilled" : ""} /></div>
                <div className="md:col-span-2"><TextInput label="Localização" name="locationLink" defaultValue={parsed.locationLink ?? ""} description={getParserDescription("Use apenas link http:// ou https:// (ex.: Google Maps ou Maps App).", parsed.locationLink)} className={parsed.locationLink ? "field-autofilled" : ""} /></div>
                <div className="md:col-span-2"><TextAreaInput label="Descrição da abertura" name="openingDescription" defaultValue={parsed.openingDescription ?? ""} rows={4} required description={getParserDescription("Descreva a dor do cliente e o contexto inicial da ocorrência.", parsed.openingDescription)} className={parsed.openingDescription ? "field-autofilled" : ""} /></div>
              </div>
            </FormSection>

            <FormSection title="Tratativa interna" description="Defina responsáveis e prioridade antes de salvar." icon={<Sparkles className="h-4 w-4 text-[var(--primary)]" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectInput label="Técnico responsável" name="technicianId" defaultValue="" options={[{ label: "Selecione um técnico", value: "" }, ...activeTechnicians.map((technician) => ({ label: technician.name, value: technician.id }))]} description="Responsável principal pela execução. Os apoios ficam logo abaixo." />
                <SelectInput label="Responsável interno" name="internalOwnerId" defaultValue={session.id} options={activeUsers.map((user) => ({ label: `${user.name} (${user.role === "ADMIN" ? "Admin" : "Operador"})`, value: user.id }))} required description="Obrigatório para que a ordem entre na operação com dono claro." />
                <SelectInput label="Prioridade" name="priority" defaultValue="MEDIA" options={ORDER_PRIORITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} description="Prioridade influencia leitura visual e foco do time." />
                <TextInput label="Prazo" name="deadlineAt" type="datetime-local" description="Preencha quando houver SLA, agenda ou compromisso com o cliente." />
              </div>
              <div className="mt-4">
                <SupportTechnicianSelector technicians={activeTechnicians} />
              </div>
              <div className="mt-4">
                <TextAreaInput label="Observação interna" name="internalNote" rows={4} description="Use para combinações internas, dependências ou risco de atendimento." />
              </div>
            </FormSection>

            <div className="form-actions-bar">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Pronto para salvar</p>
                <FormHelper>A ordem será criada como aberta e já entra no histórico auditável.</FormHelper>
              </div>
              <div className="flex flex-wrap gap-2">
                <SubmitButton pendingLabel="Salvando O.S....">Salvar O.S.</SubmitButton>
                <ButtonLink href="/orders" variant="secondary">Voltar para lista</ButtonLink>
              </div>
            </div>
          </form>
        </Surface>
      </div>
    </div>
  );
}
