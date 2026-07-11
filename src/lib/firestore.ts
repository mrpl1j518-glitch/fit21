import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from './firebase';
import { normalizeMediaUrl } from './mediaUrl';
import type {
  Client,
  LibraryExercise,
  NutritionPlan,
  Routine,
  WeekProgress,
  ProgressCount,
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

export async function createClient(clientId: string, name: string) {
  await setDoc(doc(requireDb(), 'clients', clientId), {
    name,
    createdAt: new Date().toISOString(),
  });
}

export async function updateClientName(clientId: string, name: string) {
  await setDoc(doc(requireDb(), 'clients', clientId), { name }, { merge: true });
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
  await setDoc(doc(firestore, 'routines', docId), routine);
  await setDoc(doc(firestore, 'routineHistory', nanoid()), {
    clientId,
    dayIndex,
    exercises: routine.exercises,
    dayName: routine.dayName ?? '',
    comment: routine.comment ?? '',
    savedAt: new Date().toISOString(),
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
  let dayReady = false;
  let legacyReady = false;

  const emit = () => {
    if (!dayReady || !legacyReady) return;
    const dayHasMeals = Boolean(dayPlan && dayPlan.meals.length > 0);
    onData(dayHasMeals ? dayPlan : legacyPlan);
  };

  const unsubDay = onSnapshot(dayRef, (snap) => {
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
  await setDoc(doc(firestore, 'nutrition', docId), plan);
  await setDoc(doc(firestore, 'nutritionHistory', nanoid()), {
    clientId,
    dayIndex,
    meals: plan.meals,
    planName: plan.planName ?? '',
    objective: plan.objective ?? '',
    dietType: plan.dietType ?? '',
    calories: plan.calories ?? '',
    savedAt: new Date().toISOString(),
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
        const next = Math.max(0, Math.min(21, current + delta));
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

export function subscribeAllRoutinesForClient(
  clientId: string,
  onData: (hasAny: boolean) => void
): Unsubscribe {
  const firestore = requireDb();
  const unsubs: Unsubscribe[] = [];
  let routines: (Routine | null)[] = Array(7).fill(null);

  for (let i = 0; i < 7; i++) {
    const unsub = onSnapshot(doc(firestore, 'routines', `${clientId}_${i}`), (snap) => {
      routines[i] = snap.exists() ? (snap.data() as Routine) : null;
      const hasAny = routines.some((r) => r && r.exercises.length > 0);
      onData(hasAny);
    });
    unsubs.push(unsub);
  }

  return () => unsubs.forEach((u) => u());
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
