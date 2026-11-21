import { useRegisterSW } from 'virtual:pwa-register/react'

export function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
    // onRegisteredSW(swUrl, r) {
      console.log('Service Worker registrado:', swUrl)
    //   if (r) {
    //     setInterval(() => {
    //       r.update()
    //     }, 60 * 60 * 1000)
    //   }
    },
    onRegisterError(error) {
      console.error('Error al registrar Service Worker:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-white shadow-lg">
      <div>
        {offlineReady ? (
          <span>RestoBar Manager está listo para usarse sin conexión.</span>
        ) : (
          <span>Hay una nueva versión disponible.</span>
        )}
      </div>

      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded bg-[#FF6600] px-3 py-1.5 font-medium text-white hover:bg-orange-600"
        >
          Actualizar
        </button>
      )}

      <button
        onClick={close}
        className="rounded border border-neutral-700 px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800"
      >
        Cerrar
      </button>
    </div>
  )
}