import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono, Sora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { UserSessionProvider } from "@/contexts/UserSessionContext";
import { ReservaProvider } from "@/contexts/ReservaContext";
import { AppHeader } from "@/components/layout/AppHeader";
import "./globals.css";

// Tipografías de ESTACIONARTE: Sora para títulos y cifras, Figtree para texto, JetBrains Mono para patentes y códigos.
const display = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-sora" });
const sans = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "ESTACIONARTE · Encontrá dónde estacionar",
  description: "Buscá estacionamientos con lugar, elegí tu cochera en el plano y reservá pagando la seña o el total.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserSessionProvider>
            <ReservaProvider>
              <AppHeader />
              {children}
            </ReservaProvider>
          </UserSessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
