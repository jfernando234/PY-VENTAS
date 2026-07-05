"use client";

import { internalSecondaryButtonClassName } from "@/components/internal/internal-ui";

interface VentaPrintButtonProps {
  className?: string;
}

export default function VentaPrintButton({ className = "" }: VentaPrintButtonProps) {
  return (
    <button type="button" onClick={() => window.print()} className={`${internalSecondaryButtonClassName} ${className}`}>
      Imprimir comprobante
    </button>
  );
}
