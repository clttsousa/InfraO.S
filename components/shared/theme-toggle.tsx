"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setReady(true);
  }, []);

  function applyTheme(next: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("infraos-theme", next);
    setTheme(next);
  }

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      className="btn-base btn-secondary btn-md"
      aria-label={ready ? `Alternar para modo ${next === "dark" ? "escuro" : "claro"}` : "Alternar tema"}
      title={ready ? `Alternar para modo ${next === "dark" ? "escuro" : "claro"}` : "Alternar tema"}
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
    </button>
  );
}
