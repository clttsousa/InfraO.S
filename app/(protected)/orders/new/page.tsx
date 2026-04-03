import { createServiceOrderAction } from "@/app/(protected)/orders/actions";
import { Button, ButtonLink, FeedbackMessage, SelectInput, Surface, TextAreaInput, TextInput } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ORDER_PRIORITY_OPTIONS } from "@/lib/constants";
import { parseServiceOrderText } from "@/lib/order-parser";
import { getInternalUsers, getTechnicians } from "@/lib/data";
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Surface className="p-5">
          <div>
            <h2 className="app-title text-2xl font-semibold">Nova O.S.</h2>
            <p className="app-text-secondary text-sm">Cadastro manual preparado para operação real e pronto para receber dados por texto colado quando disponível.</p>
          </div>

          <form method="get" className="mt-5 space-y-4">
            <TextAreaInput label="Texto bruto da O.S. (opcional)" name="rawText" defaultValue={rawText} rows={12} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Interpretar texto</Button>
              <ButtonLink href="/orders/new" variant="secondary">Limpar parser</ButtonLink>
            </div>
          </form>

          <div className="app-surface-muted mt-5 rounded-[1.25rem] p-4 text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)]">Exemplos suportados pelo parser</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="app-title text-lg font-semibold">Cadastro manual da O.S.</h3>
            <p className="app-text-secondary text-sm">Você pode salvar a ordem totalmente manual ou revisar os campos interpretados.</p>
          </div>
          {rawText ? <span className="badge-base badge-success">Parser aplicado</span> : null}
        </div>

        {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
        {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}

        <form action={createServiceOrderAction} className="mt-5 space-y-4">
          <input type="hidden" name="rawInput" value={rawText} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput label="Número da O.S." name="orderNumber" defaultValue={parsed.orderNumber ?? ""} required />
            <TextInput label="Data de abertura" name="openedAt" type="datetime-local" defaultValue={parsed.openedAt?.slice(0, 16) ?? ""} />
            <TextInput label="Usuário da abertura" name="openedBy" defaultValue={parsed.openedBy ?? ""} />
            <TextInput label="Código do cliente (opcional)" name="clientCode" defaultValue={parsed.clientCode ?? ""} />
            <TextInput label="Nome do cliente (opcional)" name="clientName" defaultValue={parsed.clientName ?? ""} />
            <TextInput label="Localização (opcional)" name="locationLink" defaultValue={parsed.locationLink ?? ""} />
            <div className="md:col-span-2"><TextInput label="Endereço (opcional)" name="addressText" defaultValue={parsed.address ?? ""} /></div>
            <div className="md:col-span-2"><TextAreaInput label="Descrição da abertura" name="openingDescription" defaultValue={parsed.openingDescription ?? ""} rows={4} /></div>
            <SelectInput label="Técnico responsável" name="technicianId" defaultValue={activeTechnicians[0]?.id} options={[{ label: "Selecione um técnico", value: "" }, ...activeTechnicians.map((technician) => ({ label: technician.name, value: technician.id }))]} />
            <SelectInput label="Responsável interno" name="internalOwnerId" defaultValue={session.id} options={activeUsers.map((user) => ({ label: `${user.name} (${user.role === "ADMIN" ? "Admin" : "Operador"})`, value: user.id }))} />
            <SelectInput label="Prioridade" name="priority" defaultValue="MEDIA" options={ORDER_PRIORITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
            <TextInput label="Prazo" name="deadlineAt" type="datetime-local" />
          </div>

          <TextAreaInput label="Observação interna" name="internalNote" rows={4} />

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Salvar O.S.</Button>
            <ButtonLink href="/orders" variant="secondary">Voltar para lista</ButtonLink>
          </div>
        </form>
      </Surface>
      </div>
    </div>
  );
}
