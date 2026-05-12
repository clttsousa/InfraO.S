"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Trash2, Wand2 } from "lucide-react";
import { createInterventionAction, updateInterventionAction } from "@/app/(protected)/intervencoes/actions";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { Button, ButtonLink, FormHelper, FormHint, FormSection, SelectInput, TextAreaInput, TextInput } from "@/components/shared/ui";
import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import { parseInterventionMessage } from "@/lib/intervention-parser";
import type { InternalUserItem, InterventionDetail, InterventionPointItem } from "@/types";

type EditablePoint = {
  key: string;
  label: string;
  mapsUrl: string;
};

function pointToEditable(point: InterventionPointItem, index: number): EditablePoint {
  return { key: point.id || `point-${index}`, label: point.label, mapsUrl: point.mapsUrl };
}

function createEmptyPoint(index: number): EditablePoint {
  return { key: `new-${Date.now()}-${index}`, label: `Ponto ${String(index + 1).padStart(2, "0")}`, mapsUrl: "" };
}

export function InterventionForm({ intervention, internalUsers, closeHref, mode = "create" }: { intervention?: InterventionDetail | null; internalUsers: InternalUserItem[]; closeHref: string; mode?: "create" | "edit" }) {
  const initialPoints = useMemo(() => {
    if (intervention?.points?.length) return intervention.points.map(pointToEditable);
    return [createEmptyPoint(0)];
  }, [intervention]);

  const formId = mode === "edit" ? "intervention-edit-form" : "intervention-create-form";
  const activeUsers = internalUsers.filter((user) => user.active);
  const [rawMessage, setRawMessage] = useState(intervention?.originalMessage ?? "");
  const [title, setTitle] = useState(intervention?.title ?? "");
  const [type, setType] = useState<string>(intervention?.rawType ?? "TROCA_POSTES");
  const [locationName, setLocationName] = useState(intervention?.locationName === "Não informado" ? "" : intervention?.locationName ?? "");
  const [date, setDate] = useState(intervention?.dateInput ?? "");
  const [startTime, setStartTime] = useState(intervention?.startTimeInput ?? "08:00");
  const [endTime, setEndTime] = useState(intervention?.endTimeInput ?? "17:00");
  const [status, setStatus] = useState<string>(intervention?.rawStatus ?? "PROGRAMADO");
  const [source, setSource] = useState<string>(intervention?.rawSource ?? "WHATSAPP");
  const [notes, setNotes] = useState(intervention?.notes ?? "");
  const [responsibleUserId, setResponsibleUserId] = useState(intervention?.responsibleId ?? "");
  const [points, setPoints] = useState<EditablePoint[]>(initialPoints);

  const applyParser = () => {
    const parsed = parseInterventionMessage(rawMessage);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.type) setType(parsed.type);
    if (parsed.locationName) setLocationName(parsed.locationName);
    if (parsed.date) setDate(parsed.date);
    if (parsed.startTime) setStartTime(parsed.startTime);
    if (parsed.endTime) setEndTime(parsed.endTime);
    if (parsed.source) setSource(parsed.source);
    if (parsed.points.length) {
      setPoints(parsed.points.map((point, index) => ({ key: `parsed-${index}-${point.label}`, label: point.label, mapsUrl: point.mapsUrl })));
    }
  };

  const addPoint = () => setPoints((current) => [...current, createEmptyPoint(current.length)]);
  const removePoint = (key: string) => setPoints((current) => current.length > 1 ? current.filter((point) => point.key !== key) : current);
  const updatePoint = (key: string, field: "label" | "mapsUrl", value: string) => {
    setPoints((current) => current.map((point) => point.key === key ? { ...point, [field]: value } : point));
  };

  const action = mode === "edit" ? updateInterventionAction : createInterventionAction;

  return (
    <form id={formId} action={action} className="space-y-4">
      <FormStateGuard formId={formId} />
      {intervention ? <input type="hidden" name="id" value={intervention.id} /> : null}
      <input type="hidden" name="redirectTo" value={closeHref} />

      <FormHint>Você pode colar a mensagem original do WhatsApp e interpretar os principais dados. Tudo continua editável antes de salvar.</FormHint>

      <FormSection title="Mensagem original" description="Cole aqui o aviso recebido por WhatsApp, e-mail ou outro canal." icon={<Wand2 className="h-4 w-4 text-[var(--primary)]" />}>
        <TextAreaInput label="Mensagem original" name="originalMessage" value={rawMessage} onChange={(event) => setRawMessage(event.target.value)} rows={8} description="O texto fica salvo para consulta futura no detalhe da intervenção." />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={applyParser}><Wand2 className="h-4 w-4" />Interpretar mensagem</Button>
          <Button type="button" variant="ghost" onClick={() => setRawMessage("")}>Limpar texto</Button>
        </div>
      </FormSection>

      <FormSection title="Dados da intervenção" description="Informações principais para agenda operacional e filtros." icon={<MapPin className="h-4 w-4 text-[var(--primary)]" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><TextInput autoFocus label="Título" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Troca de postes — Pirajuba" /></div>
          <SelectInput label="Tipo" name="type" value={type} onChange={(event) => setType(event.target.value)} options={INTERVENTION_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} required />
          <TextInput label="Localidade" name="locationName" value={locationName} onChange={(event) => setLocationName(event.target.value)} required placeholder="Pirajuba" />
          <TextInput label="Data" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Início" name="startTime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            <TextInput label="Fim" name="endTime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          </div>
          <SelectInput label="Status" name="status" value={status} onChange={(event) => setStatus(event.target.value)} options={INTERVENTION_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} required />
          <SelectInput label="Origem" name="source" value={source} onChange={(event) => setSource(event.target.value)} options={INTERVENTION_SOURCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} required />
          <div className="md:col-span-2">
            <SelectInput label="Responsável" name="responsibleUserId" value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)} options={[{ label: "Sem responsável definido", value: "" }, ...activeUsers.map((user) => ({ label: `${user.name} (${user.role === "ADMIN" ? "Admin" : "Operador"})`, value: user.id }))]} description="Opcional nesta versão. Ajuda a filtrar quem acompanha a intervenção." />
          </div>
          <div className="md:col-span-2"><TextAreaInput label="Observações" name="notes" value={notes ?? ""} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Contexto interno, riscos ou combinados da equipe." /></div>
        </div>
      </FormSection>

      <FormSection title="Pontos e localizações" description="Cadastre cada poste, trecho ou local com link do Google Maps." icon={<MapPin className="h-4 w-4 text-[var(--primary)]" />}>
        <div className="space-y-3">
          {points.map((point, index) => (
            <div key={point.key} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.85fr_1.15fr_auto] md:items-end">
                <TextInput label={`Ponto ${index + 1}`} name="pointLabel" value={point.label} onChange={(event) => updatePoint(point.key, "label", event.target.value)} placeholder="POSTE 01 PIRAJUBA" />
                <TextInput label="Link do Maps" name="pointMapsUrl" value={point.mapsUrl} onChange={(event) => updatePoint(point.key, "mapsUrl", event.target.value)} placeholder="https://maps.app.goo.gl/..." />
                <Button type="button" variant="ghost" className="md:mb-0" onClick={() => removePoint(point.key)}><Trash2 className="h-4 w-4" />Remover</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={addPoint}><Plus className="h-4 w-4" />Adicionar ponto</Button>
        </div>
      </FormSection>

      <div className="form-actions-bar">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Pronto para salvar</p>
          <FormHelper>{mode === "edit" ? "As alterações entram no histórico auditável da intervenção." : "A intervenção ficará disponível na lista, filtros e drawer de detalhes."}</FormHelper>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmitButton pendingLabel={mode === "edit" ? "Salvando..." : "Criando..."}>{mode === "edit" ? "Salvar alterações" : "Criar intervenção"}</SubmitButton>
          <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
        </div>
      </div>
    </form>
  );
}
