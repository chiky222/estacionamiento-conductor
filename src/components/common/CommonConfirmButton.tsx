"use client";

import { useEffect, useState } from "react";
import { CommonButton, type CommonButtonProps } from "@/components/common/CommonButton";

interface Props extends Omit<CommonButtonProps, "onClick"> {
  onConfirm: () => void;
  confirmLabel?: string;
}

/** Acción destructiva en dos toques: el primero pide confirmación, el segundo ejecuta. */
export function CommonConfirmButton({ onConfirm, confirmLabel = "Tocá otra vez para confirmar", children, ...props }: Props) {
  const [armado, setArmado] = useState(false);
  // Si pasan unos segundos sin el segundo toque, se desarma solo.
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <CommonButton
      {...props}
      onClick={() => {
        if (!armado) return setArmado(true);
        setArmado(false);
        onConfirm();
      }}
    >
      {armado ? confirmLabel : children}
    </CommonButton>
  );
}
