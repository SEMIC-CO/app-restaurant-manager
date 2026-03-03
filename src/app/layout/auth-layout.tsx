interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {children}
        <footer className="mt-8 text-center text-sm text-neutral-500">
          <p className="flex items-center justify-center gap-2">
            <span className="text-base">🧾</span>
            <span>© 2026 RESTAURANT MANAGEMENT</span>
          </p>
          <p className="mt-1 text-xs">SISTEMA DE GESTIÓN DE INVENTARIO/CAJA</p>
        </footer>
      </div>
    </div>
  );
}
