import { parseBrazilianDateTimeToIso } from "@/lib/format";
import type { ParsedServiceOrderInput, ParserFieldFeedback } from "@/types";

function cleanValue(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

const PARSER_FIELD_LABELS: Array<{ key: keyof ParsedServiceOrderInput; label: string }> = [
  { key: "orderNumber", label: "Número da O.S." },
  { key: "openedAt", label: "Data de abertura" },
  { key: "openedBy", label: "Usuário da abertura" },
  { key: "openingDescription", label: "Descrição" },
  { key: "clientCode", label: "Código do cliente" },
  { key: "clientName", label: "Nome do cliente" },
  { key: "address", label: "Endereço" },
  { key: "locationLink", label: "Localização" }
];

export function parseServiceOrderText(rawText: string): ParsedServiceOrderInput {
  const text = rawText.replace(/\r/g, "").trim();
  if (!text) return {};

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const joined = lines.join("\n");

  const orderNumber = cleanValue(
    joined.match(/ordem\s+de\s+servi[cç]o\s*(?:n[ºo]?\s*)?:?\s*([0-9]{6,})/i)?.[1] ||
      joined.match(/o\.s\.\s*(?:n[ºo]?\s*)?:?\s*([0-9]{6,})/i)?.[1]
  );

  const openedAtRaw = cleanValue(
    joined.match(/data\s+de\s+abertura\s*:?\s*([^\n]+)/i)?.[1] ||
      joined.match(/abertura\s*:?\s*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/i)?.[1]
  );

  const openedBy = cleanValue(
    joined.match(/usu[aá]rio\s+da\s+abertura\s*:?\s*([^\n]+)/i)?.[1] ||
      joined.match(/aberta\s+por\s*:?\s*([^\n]+)/i)?.[1]
  );

  const openingDescription = cleanValue(
    joined.match(/descri[cç][aã]o\s+da\s+abertura\s*:?\s*([^\n]+)/i)?.[1] ||
      joined.match(/descri[cç][aã]o\s+abertura\s*:?\s*([^\n]+)/i)?.[1] ||
      joined.match(/descri[cç][aã]o\s*:?\s*([^\n]+)/i)?.[1]
  );

  const clientLine = cleanValue(joined.match(/cliente\s*:?\s*([^\n]+)/i)?.[1]);
  let clientCode: string | undefined;
  let clientName: string | undefined;

  if (clientLine) {
    const coded = clientLine.match(/\(?([0-9]{2,})\)?\s+(.+)/);
    if (coded) {
      clientCode = cleanValue(coded[1]);
      clientName = cleanValue(coded[2]);
    } else {
      clientName = clientLine;
    }
  }

  let address = cleanValue(
    joined.match(/endere[cç]o\s*:?\s*([^\n]+)/i)?.[1] || joined.match(/local\s*:?\s*([^\n]+)/i)?.[1]
  );

  if (!address) {
    const clientIndex = lines.findIndex((line) => /^cliente\s*:/i.test(line));
    if (clientIndex >= 0) {
      const nextLine = lines[clientIndex + 1];
      if (
        nextLine &&
        !/^(localiza[cç][aã]o|descri[cç][aã]o|data|usu[aá]rio|ordem)/i.test(nextLine)
      ) {
        address = cleanValue(nextLine);
      }
    }
  }

  const locationLink = cleanValue(
    joined.match(/localiza[cç][aã]o\s*:?\s*([^\n]+)/i)?.[1] ||
      joined.match(/(https?:\/\/\S+|maps\.app\.goo\.gl\/\S+)/i)?.[1]
  );

  return {
    orderNumber,
    openedAt: parseBrazilianDateTimeToIso(openedAtRaw),
    openedBy,
    openingDescription,
    clientCode,
    clientName,
    address,
    locationLink
  };
}

export function buildParserFeedback(parsed: ParsedServiceOrderInput): ParserFieldFeedback[] {
  return PARSER_FIELD_LABELS.map((field) => ({
    key: field.key,
    label: field.label,
    value: parsed[field.key],
    status: parsed[field.key] ? "recognized" : "missing"
  }));
}
