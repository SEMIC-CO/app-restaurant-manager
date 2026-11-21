import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Si se probó la PWA en dev antes de desactivar devOptions, el SW viejo puede
// seguir controlando la página y sirviendo index.html en caché. Se da de baja
// una sola vez para que el HMR vuelva a mostrar los cambios.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
