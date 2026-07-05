"use client";

interface VentaPrintButtonProps {
  className?: string;
}

export default function VentaPrintButton({ className = "" }: VentaPrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`}
    >
      Imprimir comprobante
    </button>
  );
}
