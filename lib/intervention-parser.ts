export type ParsedInterventionPoint = {
  label: string;
  mapsUrl: string;
};

export type ParsedInterventionInput = {
  title?: string;
  type?: string;
  locationName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  source?: string;
  originalMessage?: string;
  points: ParsedInterventionPoint[];
};

function toDateInput(dd: string, mm: string, yyyy: string) {
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeTime(value?: string) {
  if (!value) return undefined;
  const [hour = "", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferType(text: string) {
  const lower = text.toLowerCase();
  if (/troca\s+de\s+postes?|poste/.test(lower)) return "TROCA_POSTES";
  if (/manuten[cç][aã]o\s+el[eé]trica|energia|concession[áa]ria/.test(lower)) return "MANUTENCAO_ELETRICA";
  if (/desligamento\s+programado|queda\s+programada/.test(lower)) return "DESLIGAMENTO_PROGRAMADO";
  if (/obra\s+de\s+terceiros?|terceiros/.test(lower)) return "OBRA_TERCEIROS";
  if (/remanejamento|remanejar/.test(lower)) return "REMANEJAMENTO_REDE";
  return "OUTRO";
}

function inferTitle(type: string, locationName?: string) {
  const typeLabel: Record<string, string> = {
    TROCA_POSTES: "Troca de postes",
    MANUTENCAO_ELETRICA: "Manutenção elétrica",
    DESLIGAMENTO_PROGRAMADO: "Desligamento programado",
    OBRA_TERCEIROS: "Obra de terceiros",
    REMANEJAMENTO_REDE: "Remanejamento de rede",
    OUTRO: "Intervenção programada"
  };

  return `${typeLabel[type] ?? "Intervenção programada"}${locationName ? ` — ${titleCase(locationName)}` : ""}`;
}

function inferLocation(lines: string[]) {
  const pointLine = lines.find((line) => /\bPOSTE\s*\d+/i.test(line));
  const match = pointLine?.match(/\bPOSTE\s*\d+\s+(.+)$/i);
  if (match?.[1]) return titleCase(match[1].trim());

  const knownPlaceLine = lines.find((line) => /\b(PIRAJUBA|UBERABA|CONCEI[ÇC][AÃ]O|CAMPO\s+FLORIDO)\b/i.test(line));
  return knownPlaceLine ? titleCase(knownPlaceLine.trim()) : undefined;
}

function extractPoints(lines: string[]) {
  const points: ParsedInterventionPoint[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (!/\bPOSTE\s*\d+/i.test(line)) continue;

    const nextLink = lines.slice(index + 1).find((candidate) => /https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps|maps\.google\.com)/i.test(candidate));
    points.push({ label: titleCase(line), mapsUrl: nextLink?.trim() ?? "" });
  }

  if (points.length) return points;

  return lines
    .filter((line) => /https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps|maps\.google\.com)/i.test(line))
    .map((mapsUrl, index) => ({ label: `Ponto ${String(index + 1).padStart(2, "0")}`, mapsUrl: mapsUrl.trim() }));
}

export function parseInterventionMessage(rawText: string): ParsedInterventionInput {
  const originalMessage = rawText.trim();
  const lines = originalMessage
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dateMatch = originalMessage.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const timeRangeMatch = originalMessage.match(/(\d{1,2}:\d{2})\s*(?:a|às|as|-|até)\s*(\d{1,2}:\d{2})/i);
  const type = inferType(originalMessage);
  const locationName = inferLocation(lines);
  const points = extractPoints(lines);

  return {
    title: inferTitle(type, locationName),
    type,
    locationName,
    date: dateMatch ? toDateInput(dateMatch[1], dateMatch[2], dateMatch[3]) : undefined,
    startTime: normalizeTime(timeRangeMatch?.[1]),
    endTime: normalizeTime(timeRangeMatch?.[2]),
    source: "WHATSAPP",
    originalMessage,
    points
  };
}
