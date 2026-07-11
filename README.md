# FIT21

App web para entrenamiento personal de la marca **FIT21** — *Constancia que transforma*.

Rutinas y planes de alimentación personalizados, sin app store ni login para las clientas.

## Stack

- React + Vite + TypeScript
- Firebase Firestore + Authentication (coach)
- Despliegue en Vercel
- PWA (agregar a pantalla de inicio)

## Rutas

| Ruta | Quién | Descripción |
|------|-------|-------------|
| `/` | Público | Landing; banner “Continuar mi plan” si hay sesión recordada |
| `/coach` | Coach | Dashboard protegido con email/contraseña |
| `/coach/client/:id` | Coach | Editar rutina y nutrición por día |
| `/coach/biblioteca` | Coach | Biblioteca de ejercicios |
| `/plan/:clientId` | Clienta | Vista personal (link único, con slug amigable opcional) |

## Setup local

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com) y habilita **Firestore** y **Authentication** (Email/Password).
2. Copia las credenciales web a `.env` (ver `.env.example`).
3. Despliega reglas de Firestore:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add   # selecciona tu proyecto
   firebase deploy --only firestore:rules
   ```
4. Instala y corre:
   ```bash
   npm install
   npm run dev
   ```

## Variables de entorno

Configurar en `.env` local y en Vercel:

- `VITE_FIREBASE_*` — credenciales del SDK web de Firebase

El coach entra con **Email/Password** de Firebase Authentication.

## Seguridad Firestore

- Escritura de clientas, rutinas, nutrición, biblioteca e historial: solo usuario autenticado (coach)
- Lectura de planes: pública vía link personal (`/plan/{clientId}`)
- Progreso (`weekProgress`, `progressCount`): la clienta puede marcar días sin cuenta
- Borrado de `weekProgress` y notificaciones: solo coach

## Colecciones Firestore

- `library-exercises` — catálogo reutilizable `{ name, mediaUrl, muscleGroup }`
- `clients` — `{ name, slug, createdAt, cycleStartedAt, coachMeta? }`
- `routines` — `{clientId}_{dayIndex}: { exercises, dayName, level, classification, ... }`
- `nutrition` — `{clientId}_{dayIndex}` o legacy `{clientId}`
- `weekProgress` — `{clientId}_{weekStart}: { "YYYY-MM-DD": boolean }`
- `progressCount` — `{clientId}: { count }` (ciclo de **28 días**)
- `clientNotifications` — notificaciones para la clienta
- `feedback` — opiniones de clientas
- `routineHistory` / `nutritionHistory` — copias con `savedAt` en cada guardado (respaldo)

## Despliegue

Push a `main` en GitHub → Vercel despliega automáticamente.

Producción: https://fit21-amber.vercel.app

Reemplaza `public/fit21-logo.png` con el logo oficial si tienes una versión mejor.
