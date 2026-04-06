import { ClipboardPen, Sparkles, Wand2 } from "lucide-react";
import { createServiceOrderAction } from "@/app/(protected)/orders/actions";
import { SupportTechnicianSelector } from "@/components/orders/support-technician-selector";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { Button, ButtonLink, FeedbackMessage, FormHelper, FormHint, FormSection, SelectInput, Surface, TextAreaInput, TextInput } from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS } from "@/lib/constants";
import { getInternalUsers, getTechnicians } from "@/lib/data";
import { parseServiceOrderText } from "@/lib/order-parser";
import { requireSession } from "@/lib/session";

function getStringValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function NewOrderPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const rawText = getStringValue(params.rawText);
  const success = getStringValue(params.success);
  const error = getStringValue(params.error);
  const parsed = rawText ? parseServiceOrderText(rawText) : {};
  const session = await requireSession();
  const [technicians, internalUsers] = await Promise.all([getTechnicians(), getInternalUsers()]);
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

          {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
          {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}
          <FormHint>Os campos obrigatórios aparecem primeiro. Se você sair da página com alterações, o navegador avisa.</FormHint>

          <form id="order-create-form" action={createServiceOrderAction} className="mt-5 space-y-4">
            <FormStateGuard formId="order-create-form" />
            <input type="hidden" name="rawInput" value={rawText} />

            <FormSection title="Dados principais" description="Informações centrais da ordem e do cliente." icon={<ClipboardPen className="h-4 w-4 text-[var(--primary)]" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput autoFocus label="Número da O.S." name="orderNumber" defaultValue={parsed.orderNumber ?? ""} required description="Identificador único usado na operação." />
                <TextInput label="Data de abertura" name="openedAt" type="datetime-local" defaultValue={parsed.openedAt?.slice(0, 16) ?? ""} description="Pode ficar em branco se não veio no texto original." />
                <TextInput label="Usuário da abertura" name="openedBy" defaultValue={parsed.openedBy ?? ""} description="Pessoa que abriu a ordem na origem." />
                <TextInput label="Código do cliente" name="clientCode" defaultValue={parsed.clientCode ?? ""} description="Opcional, mas ajuda na busca futura." />
                <div className="md:col-span-2"><TextInput label="Nome do cliente" name="clientName" defaultValue={parsed.clientName ?? ""} description="Use o nome exatamente como veio da abertura para facilitar rastreio." /></div>
                <div className="md:col-span-2"><TextInput label="Endereço" name="addressText" defaultValue={parsed.address ?? ""} description="Inclua bloco/apto/local de atendimento quando existir." /></div>
                <div className="md:col-span-2"><TextInput label="Localização" name="locationLink" defaultValue={parsed.locationLink ?? ""} description="Pode ser link do Maps ou instrução curta de localização." /></div>
                <div className="md:col-span-2"><TextAreaInput label="Descrição da abertura" name="openingDescription" defaultValue={parsed.openingDescription ?? ""} rows={4} required description="Descreva a dor do cliente e o contexto inicial da ocorrência." /></div>
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
