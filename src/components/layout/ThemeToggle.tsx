"use client";

import { useTheme } from "next-themes";
import { CommonButton } from "@/components/common/CommonButton";

/** Alterna el tema. El design system no tiene ícono de sol o luna, así que va con texto. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";
  return (
    <CommonButton color="ghost" size="sm" aria-label="Cambiar tema" onClick={() => setTheme(oscuro ? "light" : "dark")}>
      <span className="dark:hidden">Tema oscuro</span>
      <span className="hidden dark:inline">Tema claro</span>
    </CommonButton>
  );
}
