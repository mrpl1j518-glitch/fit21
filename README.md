# FIT21

App web para entrenamiento personal de la marca **FIT21** — *Constancia que transforma*.

Rutinas y planes de alimentación personalizados, sin app store ni login para las clientas.

## Stack

- React + Vite + TypeScript
- Firebase Firestore (plan Spark gratuito)
- Despliegue en Vercel o Netlify
- PWA (agregar a pantalla de inicio)

## Rutas

| Ruta | Quién | Descripción |
|------|-------|-------------|
| `/coach` | Claudia | Dashboard protegido con PIN |
| `/coach/client/:id` | Claudia | Editar rutina y nutrición |
| `/plan/:clientId` | Clienta | Vista personal (link único) |

## Setup local

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com) y habilita **Firestore**.
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

Configurar en `.env` local y en Vercel/Netlify:

- `VITE_FIREBASE_*` — credenciales del SDK web de Firebase

El coach entra con **Email/Password** de Firebase Authentication (no PIN).

## Seguridad Firestore

- Escritura de clientas, rutinas, nutrición, biblioteca e historial: solo usuario autenticado (coach)
- Lectura de planes: pública vía link personal (`/plan/{clientId}`)
- Progreso (`weekProgress`, `progressCount`): la clienta puede marcar días sin cuenta

## Colecciones Firestore

- `library-exercises` — catálogo reutilizable `{ name, mediaUrl, muscleGroup }`
- `clients` — `{clientId}: { name }`
- `routines` — `{clientId}_{dayIndex}: { exercises, dayName, comment, ... }`
- `nutrition` — `{clientId}: { meals, planName, ... }`
- `weekProgress` — `{clientId}_{weekStart}: { "YYYY-MM-DD": boolean }`
- `progressCount` — `{clientId}: { count }` (ciclo de 21 días)
- `routineHistory` / `nutritionHistory` — copias con `savedAt` en cada guardado

## Despliegue

Push a `main` en GitHub → Vercel/Netlify despliega automáticamente.

Reemplaza `public/fit21-logo.png` con el logo oficial si tienes una versión mejor.
