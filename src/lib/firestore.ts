import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from './firebase';
import { normalizeMediaUrl } from './mediaUrl';
import { slugifyName } from './clientSlug';
import { daysSinceDate, formatDateKey, startOfTodayIso } from './dates';
import { CYCLE_DAYS } from '../types';
import type {
  Client,
  ClientCoachMeta,
  ClientCoachOverview,
  LibraryExercise,
  NutritionPlan,
  Routine,
  WeekProgress,
  ProgressCount,
  ClientNotification,
  ClientNotificationsDoc,
  ClientFeedback,
} from '../types';

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado. Revisa tu archivo .env');
  return db;
}

export function generateClientId(): string {
  return nanoid(10);
}

export function subscribeClients(onData: (clients: Record<string, Client>) => void): Unsubscribe {
  return onSnapshot(collection(requireDb(), 'clients'), (snap) => {
    const data: Record<string, Client> = {};
    snap.forEach((d) => {
      data[d.id] = d.data() as Client;
    });
    onData(data);
  });
}

/** Lectura puntual de una clienta (más rápido que suscribir toda la colección). */
export async function getClient(clientId: string): Promise<Client | null> {
  const snap = await getDoc(doc(requireDb(), 'clients', clientId));
  return snap.exists() ? (snap.data() as Client) : null;
}

/** Suscripción a un solo documento de clienta. */
export function subscribeClient(
  clientId: string,
  onData: (client: Client | null) => void
): Unsubscribe {
  return onSnapshot(doc(requireDb(), 'clients', clientId), (snap) => {
    onData(snap.exists() ? (snap.data() as Client) : null);
  });
}

export async function createClient(clientId: string, name: string) {
  await setDoc(doc(requireDb(), 'clients', clientId), {
    name,
    slug: slugifyName(name),
    createdAt: new Date().toISOString(),
  });
}

export async function updateClientName(clientId: string, name: string) {
  await setDoc(
    doc(requireDb(), 'clients', clientId),
    { name, slug: slugifyName(name) },
    { merge: true }
  );
}

export async function deleteClient(clientId: string) {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, 'clients', clientId));
}

export function subscribeRoutine(
  clientId: string,
  dayIndex: number,
  onData: (routine: Routine | null) => void
): Unsubscribe {
  const docId = `${clientId}_${dayIndex}`;
  return onSnapshot(doc(requireDb(), 'routines', docId), (snap) => {
    onData(snap.exists() ? (snap.data() as Routine) : null);
  });
}

export async function saveRoutine(
  clientId: string,
  dayIndex: number,
  routine: Routine
) {
  const firestore = requireDb();
  const docId = `${clientId}_${dayIndex}`;
  const ref = doc(firestore, 'routines', docId);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const existing = snap.exists() ? (snap.data() as Routine) : null;
  const payload: Routine = {
    ...routine,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await setDoc(ref, payload);
  if (routine.exercises.length > 0) {
    await ensureClientCycleStarted(clientId);
  }
  await setDoc(doc(firestore, 'routineHistory', nanoid()), {
    clientId,
    dayIndex,
    exercises: routine.exercises,
    dayName: routine.dayName ?? '',
    comment: routine.comment ?? '',
    savedAt: now,
  });
}

export function subscribeNutrition(
  clientId: string,
  dayIndex: number,
  onData: (plan: NutritionPlan | null) => void
): Unsubscribe {
  const firestore = requireDb();
  const dayRef = doc(firestore, 'nutrition', `${clientId}_${dayIndex}`);
  const legacyRef = doc(firestore, 'nutrition', clientId);

  let dayPlan: NutritionPlan | null = null;
  let legacyPlan: NutritionPlan | null = null;
  let dayExists = false;
  let dayReady = false;
  let legacyReady = false;

  const emit = () => {
    if (!dayReady || !legacyReady) return;
    // Si ya existe doc del día (aunque esté vacío), NO volver al plan legacy
    onData(dayExists ? dayPlan : legacyPlan);
  };

  const unsubDay = onSnapshot(dayRef, (snap) => {
    dayExists = snap.exists();
    dayPlan = snap.exists() ? (snap.data() as NutritionPlan) : null;
    dayReady = true;
    emit();
  });

  const unsubLegacy = onSnapshot(legacyRef, (snap) => {
    legacyPlan = snap.exists() ? (snap.data() as NutritionPlan) : null;
    legacyReady = true;
    emit();
  });

  return () => {
    unsubDay();
    unsubLegacy();
  };
}

export async function saveNutrition(
  clientId: string,
  dayIndex: number,
  plan: NutritionPlan
) {
  const firestore = requireDb();
  const docId = `${clientId}_${dayIndex}`;
  const ref = doc(firestore, 'nutrition', docId);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const existing = snap.exists() ? (snap.data() as NutritionPlan) : null;
  const payload: NutritionPlan = {
    ...plan,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await setDoc(ref, payload);
  // Si había un plan “global” viejo, lo limpiamos para que no reaparezca
  try {
    await deleteDoc(doc(firestore, 'nutrition', clientId));
  } catch {
    // ok si no existía
  }
  await setDoc(doc(firestore, 'nutritionHistory', nanoid()), {
    clientId,
    dayIndex,
    meals: plan.meals,
    planName: plan.planName ?? '',
    objective: plan.objective ?? '',
    dietType: plan.dietType ?? '',
    calories: plan.calories ?? '',
    savedAt: now,
  });
}

export async function clearNutritionDay(clientId: string, dayIndex: number) {
  const empty: NutritionPlan = {
    planName: '',
    objective: '',
    dietType: '',
    calories: '',
    meals: [],
  };
  await saveNutrition(clientId, dayIndex, empty);
}

export async function clearRoutineDay(clientId: string, dayIndex: number) {
  await saveRoutine(clientId, dayIndex, {
    dayName: '',
    comment: '',
    classification: '',
    level: '',
    exercises: [],
  });
}

export function subscribeWeekProgress(
  clientId: string,
  weekStart: string,
  onData: (progress: WeekProgress) => void
): Unsubscribe {
  const docId = `${clientId}_${weekStart}`;
  return onSnapshot(doc(requireDb(), 'weekProgress', docId), (snap) => {
    onData(snap.exists() ? (snap.data() as WeekProgress) : {});
  });
}

export async function setDayComplete(
  clientId: string,
  weekStart: string,
  dateKey: string,
  complete: boolean,
  previousComplete: boolean
) {
  const firestore = requireDb();
  const docId = `${clientId}_${weekStart}`;
  await setDoc(
    doc(firestore, 'weekProgress', docId),
    { [dateKey]: complete },
    { merge: true }
  );

  if (complete && !previousComplete) {
    await incrementProgressCount(clientId, 1);
  } else if (!complete && previousComplete) {
    await incrementProgressCount(clientId, -1);
  }
}

async function incrementProgressCount(clientId: string, delta: number) {
  const firestore = requireDb();
  const ref = doc(firestore, 'progressCount', clientId);
  return new Promise<void>((resolve, reject) => {
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        unsub();
        const current = snap.exists() ? (snap.data() as ProgressCount).count : 0;
        const next = Math.max(0, Math.min(CYCLE_DAYS, current + delta));
        try {
          await setDoc(ref, { count: next }, { merge: true });
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      reject
    );
  });
}

export function subscribeProgressCount(
  clientId: string,
  onData: (count: number) => void
): Unsubscribe {
  return onSnapshot(doc(requireDb(), 'progressCount', clientId), (snap) => {
    onData(snap.exists() ? (snap.data() as ProgressCount).count : 0);
  });
}

async function getEarliestRoutineCreatedAt(clientId: string): Promise<string | null> {
  const firestore = requireDb();
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const snap = await getDoc(doc(firestore, 'routines', `${clientId}_${i}`));
    if (!snap.exists()) continue;
    const routine = snap.data() as Routine;
    if (routine.createdAt && routine.exercises.length > 0) {
      dates.push(routine.createdAt);
    }
  }

  if (dates.length === 0) return null;
  return dates.sort()[0];
}

async function ensureClientCycleStarted(clientId: string) {
  const firestore = requireDb();
  const ref = doc(firestore, 'clients', clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const client = snap.data() as Client;
  if (client.cycleStartedAt) return;
  await setDoc(ref, { cycleStartedAt: startOfTodayIso() }, { merge: true });
}

async function resetClientCycle(clientId: string) {
  const firestore = requireDb();
  await setDoc(doc(firestore, 'progressCount', clientId), { count: 0 });

  const weekProgressSnap = await getDocs(collection(firestore, 'weekProgress'));
  await Promise.all(
    weekProgressSnap.docs
      .filter((entry) => entry.id.startsWith(`${clientId}_`))
      .map((entry) => deleteDoc(entry.ref))
  );

  await setDoc(
    doc(firestore, 'clients', clientId),
    { cycleStartedAt: startOfTodayIso() },
    { merge: true }
  );
}

/** Reinicia el ciclo si ya pasaron 28 días desde el inicio. Migra cycleStartedAt si falta. */
export async function ensureActiveCycle(clientId: string): Promise<Client | null> {
  const firestore = requireDb();
  const ref = doc(firestore, 'clients', clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  let client = snap.data() as Client;
  let cycleStartedAt = client.cycleStartedAt;

  if (!cycleStartedAt) {
    cycleStartedAt = (await getEarliestRoutineCreatedAt(clientId)) ?? undefined;
    if (cycleStartedAt) {
      await setDoc(ref, { cycleStartedAt }, { merge: true });
      client = { ...client, cycleStartedAt };
    } else {
      return client;
    }
  }

  if (daysSinceDate(cycleStartedAt) >= CYCLE_DAYS) {
    await resetClientCycle(clientId);
    const refreshed = await getDoc(ref);
    return refreshed.exists() ? (refreshed.data() as Client) : null;
  }

  return client;
}

export interface ClientPlanMeta {
  hasRoutine: boolean;
  routineCreatedAt: string | null;
  routineUpdatedAt: string | null;
  hasNutrition: boolean;
  nutritionCreatedAt: string | null;
  nutritionUpdatedAt: string | null;
}

function hasRoutineContent(routine: Routine | null): boolean {
  return Boolean(routine && routine.exercises.length > 0);
}

function hasNutritionContent(plan: NutritionPlan | null): boolean {
  if (!plan) return false;
  if ((plan.planName ?? '').trim()) return true;
  if ((plan.objective ?? '').trim()) return true;
  if ((plan.dietType ?? '').trim()) return true;
  if ((plan.calories ?? '').trim()) return true;
  return plan.meals.some(
    (meal) =>
      (meal.mealName ?? '').trim() ||
      meal.foods.some((food) => (food.name ?? '').trim() || (food.equivalents ?? '').trim())
  );
}

function earliestDate(dates: (string | undefined | null)[]): string | null {
  const valid = dates.filter((value): value is string => Boolean(value));
  if (valid.length === 0) return null;
  return valid.sort()[0];
}

function latestDate(dates: (string | undefined | null)[]): string | null {
  const valid = dates.filter((value): value is string => Boolean(value));
  if (valid.length === 0) return null;
  return valid.sort().reverse()[0];
}

function buildClientPlanMeta(
  routines: (Routine | null)[],
  nutritionPlans: (NutritionPlan | null)[]
): ClientPlanMeta {
  const activeRoutines = routines.filter(hasRoutineContent) as Routine[];
  const activeNutrition = nutritionPlans.filter(hasNutritionContent) as NutritionPlan[];

  return {
    hasRoutine: activeRoutines.length > 0,
    routineCreatedAt: earliestDate(activeRoutines.map((routine) => routine.createdAt)),
    routineUpdatedAt: latestDate(activeRoutines.map((routine) => routine.updatedAt ?? routine.createdAt)),
    hasNutrition: activeNutrition.length > 0,
    nutritionCreatedAt: earliestDate(activeNutrition.map((plan) => plan.createdAt)),
    nutritionUpdatedAt: latestDate(activeNutrition.map((plan) => plan.updatedAt ?? plan.createdAt)),
  };
}

export function subscribeAllRoutinesForClient(
  clientId: string,
  onData: (hasAny: boolean) => void
): Unsubscribe {
  return subscribeClientPlanMeta(clientId, (meta) => onData(meta.hasRoutine));
}

export function subscribeClientPlanMeta(
  clientId: string,
  onData: (meta: ClientPlanMeta) => void
): Unsubscribe {
  const firestore = requireDb();
  const unsubs: Unsubscribe[] = [];
  const routines: (Routine | null)[] = Array(7).fill(null);
  const nutritionPlans: (NutritionPlan | null)[] = Array(7).fill(null);
  let legacyNutrition: NutritionPlan | null = null;
  let legacyReady = false;
  const dayReady = Array(7).fill(false);
  const routineReady = Array(7).fill(false);

  const emit = () => {
    if (!legacyReady || dayReady.some((ready) => !ready) || routineReady.some((ready) => !ready)) {
      return;
    }
    const plans = legacyNutrition ? [...nutritionPlans, legacyNutrition] : nutritionPlans;
    onData(buildClientPlanMeta(routines, plans));
  };

  for (let i = 0; i < 7; i++) {
    const routineUnsub = onSnapshot(doc(firestore, 'routines', `${clientId}_${i}`), (snap) => {
      routines[i] = snap.exists() ? (snap.data() as Routine) : null;
      routineReady[i] = true;
      emit();
    });
    unsubs.push(routineUnsub);

    const nutritionUnsub = onSnapshot(doc(firestore, 'nutrition', `${clientId}_${i}`), (snap) => {
      nutritionPlans[i] = snap.exists() ? (snap.data() as NutritionPlan) : null;
      dayReady[i] = true;
      emit();
    });
    unsubs.push(nutritionUnsub);
  }

  const legacyUnsub = onSnapshot(doc(firestore, 'nutrition', clientId), (snap) => {
    legacyNutrition = snap.exists() ? (snap.data() as NutritionPlan) : null;
    legacyReady = true;
    emit();
  });
  unsubs.push(legacyUnsub);

  return () => unsubs.forEach((unsub) => unsub());
}

export function subscribeLibraryExercises(
  onData: (items: Record<string, LibraryExercise>) => void
): Unsubscribe {
  return onSnapshot(collection(requireDb(), 'library-exercises'), (snap) => {
    const data: Record<string, LibraryExercise> = {};
    snap.forEach((d) => {
      data[d.id] = d.data() as LibraryExercise;
    });
    onData(data);
  });
}

export async function saveLibraryExercise(
  id: string | null,
  exercise: Omit<LibraryExercise, 'createdAt'> & { createdAt?: string }
) {
  const firestore = requireDb();
  const docId = id ?? nanoid(10);
  const payload: LibraryExercise = {
    name: exercise.name.trim(),
    mediaUrl: normalizeMediaUrl(exercise.mediaUrl),
    muscleGroup: exercise.muscleGroup?.trim() || '',
    createdAt: exercise.createdAt ?? new Date().toISOString(),
  };
  await setDoc(doc(firestore, 'library-exercises', docId), payload, { merge: true });
  return docId;
}

export async function deleteLibraryExercise(id: string) {
  await deleteDoc(doc(requireDb(), 'library-exercises', id));
}

const MAX_NOTIFICATIONS = 10;

export async function pushClientNotification(clientId: string, text: string) {
  const firestore = requireDb();
  const ref = doc(firestore, 'clientNotifications', clientId);
  const entry: ClientNotification = {
    id: nanoid(8),
    text,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const snap = await getDoc(ref);
  const existing = snap.exists()
    ? ((snap.data() as ClientNotificationsDoc).messages ?? [])
    : [];

  const messages = [entry, ...existing].slice(0, MAX_NOTIFICATIONS);
  await setDoc(ref, { messages }, { merge: true });
}

export function subscribeClientNotifications(
  clientId: string,
  onData: (messages: ClientNotification[]) => void
): Unsubscribe {
  return onSnapshot(doc(requireDb(), 'clientNotifications', clientId), (snap) => {
    const data = snap.exists() ? (snap.data() as ClientNotificationsDoc) : { messages: [] };
    onData((data.messages ?? []).slice(0, MAX_NOTIFICATIONS));
  });
}

export async function markNotificationsRead(clientId: string) {
  const firestore = requireDb();
  const ref = doc(firestore, 'clientNotifications', clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const messages = ((snap.data() as ClientNotificationsDoc).messages ?? []).map((m) => ({
    ...m,
    read: true,
  }));
  await setDoc(ref, { messages }, { merge: true });
}

export async function submitClientFeedback(
  clientId: string,
  clientName: string,
  rating: number,
  message: string
) {
  const firestore = requireDb();
  const id = nanoid(10);
  const payload: ClientFeedback = {
    clientId,
    clientName,
    rating,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(firestore, 'feedback', id), payload);
}

export function subscribeFeedback(
  onData: (items: (ClientFeedback & { id: string })[]) => void
): Unsubscribe {
  return onSnapshot(collection(requireDb(), 'feedback'), (snap) => {
    const items: (ClientFeedback & { id: string })[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as ClientFeedback) });
    });
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onData(items);
  });
}

function uniqueNonEmpty(values: (string | undefined)[]): string {
  return [...new Set(values.map((v) => (v ?? '').trim()).filter(Boolean))].join(' · ');
}

function buildDailyCompletion(
  cycleStartedAt: string | null,
  progressByDate: Record<string, boolean>
): boolean[] {
  if (!cycleStartedAt) return Array(CYCLE_DAYS).fill(false);

  const start = new Date(cycleStartedAt);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: CYCLE_DAYS }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return Boolean(progressByDate[formatDateKey(date)]);
  });
}

function aggregateCoachMetaFromPlans(
  routines: (Routine | null)[],
  nutritionPlans: (NutritionPlan | null)[]
): ClientCoachMeta {
  const activeRoutines = routines.filter(hasRoutineContent) as Routine[];
  const activeNutrition = nutritionPlans.filter(hasNutritionContent) as NutritionPlan[];

  const routineParts = uniqueNonEmpty(
    activeRoutines.flatMap((routine) => [routine.classification, routine.level])
  );
  const nutritionParts = uniqueNonEmpty(
    activeNutrition.flatMap((plan) => [plan.objective, plan.dietType])
  );
  const calories = uniqueNonEmpty(activeNutrition.map((plan) => plan.calories));

  return {
    routineGoal: routineParts,
    nutritionGoal: nutritionParts,
    calories: calories.split(' · ')[0] ?? '',
  };
}

export async function syncClientCoachMetaFromPlans(clientId: string) {
  const firestore = requireDb();
  const routines: (Routine | null)[] = [];
  const nutritionPlans: (NutritionPlan | null)[] = [];

  for (let i = 0; i < 7; i++) {
    const routineSnap = await getDoc(doc(firestore, 'routines', `${clientId}_${i}`));
    routines.push(routineSnap.exists() ? (routineSnap.data() as Routine) : null);

    const nutritionSnap = await getDoc(doc(firestore, 'nutrition', `${clientId}_${i}`));
    nutritionPlans.push(nutritionSnap.exists() ? (nutritionSnap.data() as NutritionPlan) : null);
  }

  const aggregated = aggregateCoachMetaFromPlans(routines, nutritionPlans);
  const clientSnap = await getDoc(doc(firestore, 'clients', clientId));
  const existing = clientSnap.exists() ? (clientSnap.data() as Client).coachMeta : undefined;

  const coachMeta: ClientCoachMeta = {
    routineGoal: aggregated.routineGoal || existing?.routineGoal || '',
    nutritionGoal: aggregated.nutritionGoal || existing?.nutritionGoal || '',
    calories: aggregated.calories || existing?.calories || '',
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(firestore, 'clients', clientId), { coachMeta }, { merge: true });
}

export async function updateClientCoachMeta(clientId: string, meta: Partial<ClientCoachMeta>) {
  const firestore = requireDb();
  const ref = doc(firestore, 'clients', clientId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as Client).coachMeta : undefined;

  await setDoc(
    ref,
    {
      coachMeta: {
        ...existing,
        ...meta,
        updatedAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );
}

export function subscribeClientCoachOverview(
  clientId: string,
  onData: (overview: ClientCoachOverview) => void
): Unsubscribe {
  const firestore = requireDb();
  const unsubs: Unsubscribe[] = [];

  let client: Client | null = null;
  let progressCount = 0;
  let routines: (Routine | null)[] = Array(7).fill(null);
  let nutritionPlans: (NutritionPlan | null)[] = Array(7).fill(null);
  let progressByDate: Record<string, boolean> = {};
  const routineReady = Array(7).fill(false);
  const nutritionReady = Array(7).fill(false);
  let clientReady = false;
  let progressReady = false;
  let weeksReady = false;

  const emit = () => {
    if (
      !clientReady ||
      !progressReady ||
      !weeksReady ||
      routineReady.some((ready) => !ready) ||
      nutritionReady.some((ready) => !ready)
    ) {
      return;
    }

    const aggregated = aggregateCoachMetaFromPlans(routines, nutritionPlans);
    const coachMeta = client?.coachMeta;
    const cycleStartedAt = client?.cycleStartedAt ?? null;
    const activeRoutineDays = routines.filter(hasRoutineContent).length;

    onData({
      progressCount,
      cycleStartedAt,
      cycleDay: cycleStartedAt
        ? Math.min(daysSinceDate(cycleStartedAt) + 1, CYCLE_DAYS)
        : 1,
      activeRoutineDays,
      routineGoal: coachMeta?.routineGoal || aggregated.routineGoal || '',
      nutritionGoal: coachMeta?.nutritionGoal || aggregated.nutritionGoal || '',
      calories: coachMeta?.calories || aggregated.calories || '',
      dailyCompletion: buildDailyCompletion(cycleStartedAt, progressByDate),
    });
  };

  unsubs.push(
    onSnapshot(doc(firestore, 'clients', clientId), (snap) => {
      client = snap.exists() ? (snap.data() as Client) : null;
      clientReady = true;
      emit();
    })
  );

  unsubs.push(
    onSnapshot(doc(firestore, 'progressCount', clientId), (snap) => {
      progressCount = snap.exists() ? (snap.data() as ProgressCount).count : 0;
      progressReady = true;
      emit();
    })
  );

  unsubs.push(
    onSnapshot(collection(firestore, 'weekProgress'), (snap) => {
      const merged: Record<string, boolean> = {};
      snap.forEach((entry) => {
        if (!entry.id.startsWith(`${clientId}_`)) return;
        const data = entry.data() as WeekProgress;
        Object.entries(data).forEach(([dateKey, value]) => {
          if (typeof value === 'boolean') merged[dateKey] = value;
        });
      });
      progressByDate = merged;
      weeksReady = true;
      emit();
    })
  );

  for (let i = 0; i < 7; i++) {
    unsubs.push(
      onSnapshot(doc(firestore, 'routines', `${clientId}_${i}`), (snap) => {
        routines[i] = snap.exists() ? (snap.data() as Routine) : null;
        routineReady[i] = true;
        emit();
      })
    );
    unsubs.push(
      onSnapshot(doc(firestore, 'nutrition', `${clientId}_${i}`), (snap) => {
        nutritionPlans[i] = snap.exists() ? (snap.data() as NutritionPlan) : null;
        nutritionReady[i] = true;
        emit();
      })
    );
  }

  return () => unsubs.forEach((unsub) => unsub());
}
