# Discovery y post-mortem — FIT21 MVP

Documento de cierre del ciclo de construcción del MVP (julio 2026). Resume el **por qué**, las **épicas**, las **historias** implementadas, los **fixes** relevantes y las **lecciones** para la siguiente fase.

---

## 1. Contexto y visión

### Problema

Claudia (coach FIT21) necesitaba entregar rutinas y planes de alimentación personalizados a un grupo pequeño de clientas, sin depender de WhatsApp para el contenido diario ni de una app store.

### Solución elegida

- **PWA web** (React + Firebase) desplegada en Vercel
- Cada clienta recibe un **link personal** por WhatsApp (`/plan/nombre-id`)
- La clienta **no hace login**; el coach sí (Firebase Auth)
- Instalación en pantalla de inicio (Android Chrome / iPhone Safari)

### Usuarios

| Rol | Acceso | Objetivo |
|-----|--------|----------|
| **Coach** | `/coach` (email + contraseña) | Gestionar clientas, planes, ciclo y comunicación |
| **Clienta** | Link único `/plan/...` | Ver rutina/nutrición, marcar avance, feedback |

### Alcance del MVP (logrado)

- Dashboard coach con listado de clientas
- Editor de rutina y nutrición por día (Lun–Dom)
- Biblioteca de ejercicios reutilizable
- Ciclo de constancia de **28 días** con avance visual
- Notificaciones coach → clienta
- Feedback de clientas
- PWA instalable (Android e iOS con matices)
- Seguridad endurecida en Firestore rules

### Fuera de alcance (explícito)

- App en Play Store / App Store (planeado a futuro)
- Login de clientas
- Pagos / suscripciones
- Multi-coach (SaaS)
- Programación automática de inicio de ciclo

---

## 2. Épicas e historias

### Épica 1 — Fundación del producto

| ID | Historia | Estado |
|----|----------|--------|
| E1-H1 | Como coach quiero crear clientas y obtener su link personal | ✅ |
| E1-H2 | Como clienta quiero abrir mi link y ver mi nombre y plan | ✅ |
| E1-H3 | Como coach quiero editar rutina por día de la semana | ✅ |
| E1-H4 | Como coach quiero editar plan de alimentación por día | ✅ |
| E1-H5 | Como usuaria quiero instalar la app en mi celular (PWA) | ✅ |

**Commits clave:** `9950b9a`, `c85fde0`, `21beab7`

---

### Épica 2 — Identidad y experiencia coach

| ID | Historia | Estado |
|----|----------|--------|
| E2-H1 | Como coach quiero una UI profesional acorde a la marca FIT21 | ✅ |
| E2-H2 | Como coach quiero biblioteca de ejercicios con GIFs (Drive, etc.) | ✅ |
| E2-H3 | Como coach quiero ver estado de cada clienta (rutina, última edición) | ✅ |
| E2-H4 | Como coach quiero metas resumidas (rutina, nutrición, kcal) por clienta | ✅ |
| E2-H5 | Como coach quiero confirmación al salir con cambios sin guardar | ✅ |

**Commits clave:** `6ed2e4c`, `22ffa89`, `8de44b3`

---

### Épica 3 — Experiencia clienta y constancia

| ID | Historia | Estado |
|----|----------|--------|
| E3-H1 | Como clienta quiero navegar entre días y ver fecha en español | ✅ |
| E3-H2 | Como clienta quiero marcar “hoy completé mi rutina” | ✅ |
| E3-H3 | Como clienta quiero ver avance del ciclo (28 días + semana) | ✅ |
| E3-H4 | Como clienta quiero celebración al completar hitos (1, 7, 14, 21, 28) | ✅ |
| E3-H5 | Como clienta quiero enviar feedback a mi coach | ✅ |
| E3-H6 | Como clienta quiero ver notificaciones del coach | ✅ |
| E3-H7 | Como clienta quiero ayuda contextual (? ) sobre la UI | ✅ |

**Commits clave:** `b52bf64`, `f04b18d`, `bca3a68`, `bf0456e`

---

### Épica 4 — Ciclo de 28 días (lógica de negocio)

| ID | Historia | Estado |
|----|----------|--------|
| E4-H1 | Como sistema quiero contar días completados (máx. 28 por ciclo) | ✅ |
| E4-H2 | Como coach quiero **iniciar** el ciclo cuando yo decida (no automático) | ✅ |
| E4-H3 | Como clienta sin ciclo iniciado quiero **preview** del plan sin contador | ✅ |
| E4-H4 | Como coach quiero reiniciar ciclo y ver avance en dashboard | ✅ |
| E4-H5 | Tras día 28, la clienta puede seguir marcando días fuera del contador | ✅ |
| E4-H6 | Solo el coach reinicia el ciclo (sin auto-reset al abrir dashboard) | ✅ |

**Commits clave:** `8059745`, `23c49a4`, `bf0456e`

---

### Épica 5 — PWA e instalación móvil

| ID | Historia | Estado |
|----|----------|--------|
| E5-H1 | Como clienta Android quiero instalar desde Chrome con mi plan | ✅ |
| E5-H2 | Como clienta iPhone quiero instalar desde Safari con mi plan | ✅ (fix jul 2026) |
| E5-H3 | Como clienta quiero hints según navegador (WhatsApp, Safari, Chrome) | ✅ |
| E5-H4 | Manifest dinámico por plan (`/api/manifest`) sin `start_url` fijo a `/` | ✅ |

**Commits clave:** `0761371`

**Lección iOS:** Chrome en iPhone **no** instala PWAs; Safari + “Agregar a pantalla de inicio” es obligatorio.

---

### Épica 6 — Seguridad y calidad

| ID | Historia | Estado |
|----|----------|--------|
| E6-H1 | Como operador quiero rules Firestore por rol (coach vs anónimo) | ✅ |
| E6-H2 | Como operador quiero allowlist de emails coach | ✅ |
| E6-H3 | Como operador quiero validar hosts de media (GIFs) | ✅ |
| E6-H4 | Como desarrollador quiero tests unitarios en lógica crítica | ✅ (31 tests) |
| E6-H5 | Como operador quiero App Check opcional (reCAPTCHA v3) | ✅ (config lista) |

**Commits clave:** `2c0d6a4`, `dcfafd4`

---

## 3. Fixes y bugs relevantes (post-mortem)

| # | Síntoma | Causa raíz | Solución | Commit |
|---|---------|------------|----------|--------|
| 1 | Coach veía 7/28 en texto pero grilla vacía (Rosita sin rutina) | `buildDailyCompletion` exigía `cycleStartedAt` | Inferir inicio desde `weekProgress`; chip separado de avance vs rutina | `23c49a4` |
| 2 | iPhone abría `/` al instalar PWA | `start_url: '/'` en manifest + blob ignorado por Safari | `/api/manifest` HTTP; quitar `start_url` fijo; pointer en localStorage | `0761371` |
| 3 | Wendy en “día 2” antes del lunes real | Ciclo autoiniciaba al guardar rutina / abrir coach | Coach pulsa “Iniciar ciclo”; preview sin checkbox hasta entonces | `8059745` |
| 4 | Auto-reset del ciclo al día 29 | `ensureActiveCycle` reiniciaba solo en dashboard | Eliminado auto-reset; banner post-28; reinicio manual coach | `bf0456e` |
| 5 | Borrado de rutina restauraba plan legacy | Fallback a doc `nutrition/{clientId}` antiguo | Dejar de restaurar legacy; “vaciar día” explícito | `371e6d8` |
| 6 | Build roto en Vercel | Variable TS sin uso | Limpieza de código | `5aa07a8` |
| 7 | Desborde horizontal en móvil | Logo/media sin límites | CSS constrain | `c4c6270` |

---

## 4. Lecciones aprendidas

### Producto

1. **El link personal es el producto** para clientas; la landing `/` es solo entrada secundaria.
2. **El coach debe controlar el inicio del ciclo** — las clientas no deben “empezar solas” al recibir el link.
3. **iPhone ≠ Android** en instalación; la infografía de onboarding es necesaria.

### Técnica

1. **Firebase es la única fuente de verdad**; `localStorage` solo para routing PWA (`clientId`), no datos de entrenamiento.
2. **Las rules de Firestore** son parte del producto, no un apéndice.
3. **Manifest PWA en iOS** requiere manifest servido por HTTP, no `blob:`.
4. **Tests unitarios** en `dates`, `clientSlug`, `planContent`, `mediaUrl` pagan dividendos en refactors.

### Operación

1. Desplegar **rules + app** juntos cuando cambie permisos.
2. Iconos PWA viejos en iOS **no se auto-reparan**; la clienta debe reinstalar.
3. Verificar deploy Vercel: commit en `main` → status `Vercel: success` en GitHub.

---

## 5. Métricas del MVP (julio 2026)

| Métrica | Valor |
|---------|-------|
| Commits en `main` (desde inicio) | ~20 |
| Archivos fuente TS/TSX | ~36 |
| Tests automatizados | 31 (6 archivos) |
| Colecciones Firestore | 10+ |
| Usuarias piloto | Pocas (WhatsApp) |
| Producción | Vercel + Firebase |

---

## 6. Próximos candidatos (backlog post-MVP)

Prioridad sugerida para documentar en roadmap:

1. Política de privacidad pública (requisito Play Store)
2. TWA / Google Play (empaquetar PWA)
3. Cloud Function para `progressCount` (anti-trampa total)
4. Onboarding coach: tour o checklist primera clienta
5. Multi-coach / organizaciones (SaaS)
6. Magic link o código para clientas (menos dependencia del link manual)
