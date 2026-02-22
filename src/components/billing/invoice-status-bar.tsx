import { MapPin } from 'lucide-react';

interface BranchInfo {
  name: string;
  supportPhone: string;
}

interface InvoiceStatusBarProps {
  isOnline: boolean;
  lastSync: string;
  branch: BranchInfo;
}

/**
 * Status bar showing system status and branch info
 */
export function InvoiceStatusBar({ isOnline, lastSync, branch }: InvoiceStatusBarProps) {
  return (
    <div className="flex items-center justify-between border-t bg-slate-800 px-6 py-3 text-white">
      {/* Left: System status */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isOnline ? 'Sistema en línea' : 'Sistema offline'}</span>
        </div>
        <span className="text-slate-400">|</span>
        <span className="text-slate-400">Última sincronización: {lastSync}</span>
      </div>

      {/* Right: Branch info */}
      <div className="flex items-center gap-4 text-sm">
        <div className="rounded bg-slate-700 px-3 py-1">
          <p className="text-xs text-slate-400">LOCAL DE ORIGEN</p>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">{branch.name}</span>
          </div>
        </div>
        <span className="text-slate-400">Soporte Técnico: {branch.supportPhone}</span>
      </div>
    </div>
  );
}
