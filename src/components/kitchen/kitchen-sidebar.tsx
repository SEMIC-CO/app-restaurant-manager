interface FlavorCount {
  name: string;
  count: number;
  color?: string;
}

interface KitchenSidebarProps {
  totalPending: number;
  flavorCounts: FlavorCount[];
  stationName?: string;
  shiftName?: string;
}

/**
 * Kitchen sidebar showing total pending items and breakdown by flavor
 */
export function KitchenSidebar({ 
  totalPending, 
  flavorCounts, 
  stationName = 'Cocina Principal',
  shiftName = 'Turno Tarde'
}: KitchenSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Total pending header */}
      <div className="p-6">
        <p className="text-sm font-medium uppercase opacity-80">Total a Freír</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-6xl font-bold">{totalPending}</span>
          <span className="text-2xl">u.</span>
        </div>
        <p className="mt-1 text-sm opacity-80">Empanadas pendientes</p>
      </div>

      {/* Flavor breakdown */}
      <div className="flex-1 space-y-1 px-4">
        {flavorCounts.map((flavor) => (
          <div
            key={flavor.name}
            className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3"
          >
            <span className="font-medium">{flavor.name}</span>
            <span className="text-xl font-bold">{flavor.count}</span>
          </div>
        ))}
      </div>

      {/* Station info */}
      <div className="mt-auto border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl">
            🍳
          </div>
          <div>
            <p className="font-semibold">{stationName}</p>
            <p className="text-sm opacity-80">{shiftName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
