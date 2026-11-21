import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// import { forceAppUpdate } from "@/utils";
import { registerSW } from "virtual:pwa-register";

declare const __APP_VERSION__: string;

// El service worker puede seguir sirviendo un index.html viejo aunque ya se
// haya desplegado un build nuevo (sw.js cacheado por el proxy o el navegador).
// version.json se pide siempre por red: si no coincide con la versión del
// bundle, se da de baja el SW, se limpian las cachés y se recarga sin caché.

// async function ensureLatestBuild(): Promise<void> {
//   try {
//     const response = await fetch(`/version.json?t=${Date.now()}`, {
//       cache: 'no-store',
//     })
//     if (!response.ok) return

//     const data = (await response.json()) as { version?: string }
//     if (!data.version || data.version === __APP_VERSION__) return

//     // Evita un bucle de recargas si por algún motivo la versión sigue sin coincidir.
//     if (sessionStorage.getItem('app-version-reload') === data.version) return
//     sessionStorage.setItem('app-version-reload', data.version)

//     await forceAppUpdate(data.version)
//   } catch {
//     // Sin conexión o version.json no disponible: sigue el ciclo normal del SW.
//   }
// }

// if (import.meta.env.DEV && 'serviceWorker' in navigator) {
//   // Si se probó la PWA en dev antes de desactivar devOptions, el SW viejo puede
//   // seguir controlando la página y sirviendo index.html en caché. Se da de baja
//   // una sola vez para que el HMR vuelva a mostrar los cambios.
//   void navigator.serviceWorker.getRegistrations().then((registrations) => {
//     registrations.forEach((registration) => void registration.unregister())
//   })
// } else if (import.meta.env.PROD) {
//   // La recarga forzada lleva ?v=... para no pedir el HTML desde la caché HTTP.
//   if (new URLSearchParams(window.location.search).has('v')) {
//     window.history.replaceState(null, '', window.location.pathname + window.location.hash)
//   }
//   void ensureLatestBuild()
// }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW({
  onOfflineReady() {
    console.log("PWA lista para offline");
  },
  onNeedRefresh() {
    console.log("Nueva versión disponible");
  },
});
