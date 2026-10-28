"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserSession } from "@/contexts/UserSessionContext";
import { CommonLogo } from "@/components/common/CommonLogo";
import { CommonIcon } from "@/components/common/CommonIcon";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { NombreIcono } from "@/lib/iconos";

const LINKS: { href: string; label: string; icon: NombreIcono }[] = [
  { href: "/", label: "Buscar", icon: "mapa" },
  { href: "/reservas", label: "Mis reservas", icon: "ticket" },
];
const LINK_ABONO: (typeof LINKS)[number] = { href: "/abono", label: "Mi abono", icon: "abono" };

/** Barra superior: logo, navegación y sesión. En el celular la navegación pasa a íconos. */
export function AppHeader() {
  const ruta = usePathname();
  const { usuario } = useUserSession();
  const activo = (href: string) => (href === "/" ? ruta === "/" || ruta.startsWith("/estacionamientos") : ruta.startsWith(href));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-glass backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
        <Link href="/" aria-label="Inicio" className="mr-auto">
          <CommonLogo height={32} />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Principal">
          {/* "Mi abono" solo para quien alquila por mes donde el gestor permite ceder el lugar. */}
          {[...LINKS, ...(usuario?.abonado ? [LINK_ABONO] : [])].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activo(l.href) ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold",
                activo(l.href) ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:text-ink",
              )}
            >
              <CommonIcon name={l.icon} size={18} />
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
          <Link
            href={usuario ? "/reservas" : "/login"}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <CommonIcon name="usuario" size={18} />
            <span className="hidden max-w-[120px] truncate md:inline">{usuario ? usuario.nombre : "Ingresar"}</span>
          </Link>
          {/* En el celular el tema sigue al del sistema: no entra el botón. */}
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
