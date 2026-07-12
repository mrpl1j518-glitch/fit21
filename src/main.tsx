import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyManifestForCurrentPath } from './lib/clientPlanStorage'
import App from './App.tsx'

// Antes de React: iOS lee el manifest al abrir "Agregar a Inicio"
applyManifestForCurrentPath()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
