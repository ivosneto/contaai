// Preferência de tema do painel autenticado — só local (localStorage), sem
// coluna nova no Supabase: é uma preferência de navegador, não um dado de
// workspace. O site comercial (src/components/marketing/landing-page.tsx)
// NÃO usa nada daqui — ele força seu próprio tema escuro via
// `.marketing-theme`, que sempre vence a cascata independente do que está
// aqui (ver comentário em styles.css).
import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "contaai-theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

function currentDomTheme(): ThemePreference {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: ThemePreference) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Script inline (ver __root.tsx) já aplicou a classe `dark` antes do
 * primeiro paint — isso só sincroniza o estado do React com o que já está
 * no DOM, nunca decide o tema sozinho (evita flash de tema trocado).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(
    () => getStoredTheme() ?? currentDomTheme() ?? (systemPrefersDark() ? "dark" : "light"),
  );

  useEffect(() => {
    setThemeState(currentDomTheme());
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
