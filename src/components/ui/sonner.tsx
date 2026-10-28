"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      richColors
      toastOptions={{ style: { borderRadius: 16, fontFamily: "var(--font-sans)", fontSize: 14 } }}
      {...props}
    />
  );
}

export { Toaster };
