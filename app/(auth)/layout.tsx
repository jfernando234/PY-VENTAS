export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Sistema de Ventas</span>
        </div>

        <div>
          <blockquote className="text-gray-300 text-2xl font-light leading-relaxed mb-6">
            "Gestioná tus ventas, clientes y stock desde un solo lugar."
          </blockquote>
          <div className="flex gap-6 text-sm text-gray-500">
            <span>Ventas</span>
            <span>·</span>
            <span>Inventario</span>
            <span>·</span>
            <span>Reportes</span>
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2025 Sistema de Ventas</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        {children}
      </div>
    </div>
  );
}
