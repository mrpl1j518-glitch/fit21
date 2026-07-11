# Seguridad FIT21

Checklist operativa después de desplegar las reglas endurecidas.

## 1. Desactivar registro público (obligatorio)

1. Abre [Firebase Console](https://console.firebase.google.com) → proyecto **fit21-eb8d4**
2. **Authentication** → **Settings** (engranaje) → **User actions**
3. Desactiva **Enable create (sign-up)** / registro por email si aparece
4. En **Sign-in method** → Email/Password: deja habilitado el login, pero no permitas que cualquiera se registre
5. Crea usuarios coach solo desde **Authentication → Users → Add user**

Sin esto, cualquier cuenta Auth nueva podría ser coach mientras `coachEmails()` esté vacía.

## 2. Allowlist de correo coach

### En la app (UI)

En `.env` / `.env.local` y en Vercel → Environment Variables:

```bash
VITE_COACH_EMAILS=tu-correo@dominio.com
```

Varios correos: separados por coma.

### En Firestore Rules

Edita `coachEmails()` en `firestore.rules` con el mismo correo:

```
function coachEmails() {
  return ['tu-correo@dominio.com'];
}
```

Cuando la lista **tiene** correos, solo esos (o `coaches/{uid}` / claim `coach:true`) son coach.
Cuando está **vacía**, cualquier usuario Auth existente sigue siendo coach (modo bootstrap).

Luego:

```bash
npx firebase-tools deploy --only firestore:rules
```

### Opción alternativa: doc `coaches/{uid}`

1. Inicia sesión una vez y copia tu UID en Authentication → Users
2. Firestore → crea colección `coaches` → documento con ID = tu UID (puede ir vacío `{}`)
3. Las rules solo permiten leer tu propio doc; write está cerrado (solo Console/Admin)

### Custom claim (avanzado)

Con Admin SDK: `auth.setCustomUserClaims(uid, { coach: true })`.
Las rules ya aceptan `request.auth.token.coach == true`.

## 3. App Check (reCAPTCHA v3)

1. [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → crea sitio **reCAPTCHA v3**
2. Dominios: `localhost`, `fit21-amber.vercel.app`, tu dominio
3. Copia el **site key** a:

```bash
VITE_RECAPTCHA_SITE_KEY=...
```

4. Firebase Console → **App Check** → registra la app web con ese provider
5. Cuando veas tokens OK en debug, activa **Enforce** en Firestore

Hasta Enforce, App Check protege de forma gradual (el cliente ya inicializa el provider si hay site key).

## 4. Qué cerraron las rules

| Área | Antes | Ahora |
|------|--------|--------|
| `clients` / `routines` / `nutrition` | read total (list) | **get** público, **list** solo coach |
| `cycleStartedAt` | update anónimo | solo coach |
| `clientNotifications` | create/update público | coach escribe; clienta solo `lastReadAt` |
| `weekProgress` | create/update libre | client existe + docId fecha + ≤7 bools + ≤1 key (clienta) |
| `progressCount` | cualquier 0–28 | clienta solo **+/- 1**; coach reset libre |
| `feedback` | create libre | exige que `clientId` exista |

## 5. Cloud Function (siguiente paso, opcional)

Para `progressCount` a prueba de trampas totales, mover el incremento a una Callable Function con Admin SDK.
Las rules actuales ya mitigan saltos de 0→28 en un solo write.
