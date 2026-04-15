"use client";

import { useMemo } from "react";
import { SelectInput, TextAreaInput } from "@/components/shared/ui";

type TemplateOption = {
  label: string;
  value: string;
};

const DEFAULT_TEMPLATE_VALUE = "__none__";

export function OrderNoteTemplate({
  label,
  name,
  required = false,
  rows = 6,
  description,
  templates,
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  description?: string;
  templates: TemplateOption[];
}) {
  const options = useMemo(
    () => [{ label: "Selecionar modelo rápido", value: DEFAULT_TEMPLATE_VALUE }, ...templates],
    [templates],
  );

  return (
    <div className="space-y-3">
      <SelectInput
        label="Modelos rápidos"
        name={`${name}_template`}
        defaultValue={DEFAULT_TEMPLATE_VALUE}
        options={options}
        onChange={(event) => {
          const selected = templates.find((template) => template.value === event.currentTarget.value);
          if (!selected) return;

          const form = event.currentTarget.form;
          if (!form) return;
          const textarea = form.elements.namedItem(name);
          if (!(textarea instanceof HTMLTextAreaElement)) return;

          textarea.value = selected.value;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.focus();
        }}
        description="Use frases padrão para ganhar velocidade e manter consistência operacional."
      />
      <TextAreaInput label={label} name={name} rows={rows} required={required} description={description} />
    </div>
  );
}
