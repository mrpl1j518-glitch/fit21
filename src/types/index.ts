export type ExerciseTag =
  | ''
  | 'calentamiento'
  | 'estiramiento'
  | 'principal'
  | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  mediaUrl?: string;
  sets?: string;
  reps?: string;
  restMin?: string;
  restSec?: string;
  /** @deprecated prefer restMin/restSec; se mantiene por compatibilidad */
  rest?: string;
  notes?: string;
  tag?: ExerciseTag;
  /** v2: referencia opcional a library-exercises */
  libraryExerciseId?: string;
}

export interface Routine {
  dayName?: string;
  comment?: string;
  classification?: string;
  level?: string;
  exercises: Exercise[];
}

export interface Food {
  id: string;
  name: string;
  photoUrl?: string;
  equivalents?: string;
  /** v2: referencia opcional a library-foods */
  libraryFoodId?: string;
}

export interface Meal {
  id: string;
  mealName: string;
  foods: Food[];
}

export interface NutritionPlan {
  planName?: string;
  objective?: string;
  dietType?: string;
  meals: Meal[];
}

export interface Client {
  name: string;
  createdAt?: string;
}

export interface WeekProgress {
  [date: string]: boolean;
}

export interface ProgressCount {
  count: number;
}

export interface RoutineHistoryEntry {
  clientId: string;
  dayIndex: number;
  exercises: Exercise[];
  dayName?: string;
  comment?: string;
  savedAt: string;
}

export interface NutritionHistoryEntry {
  clientId: string;
  meals: Meal[];
  planName?: string;
  objective?: string;
  dietType?: string;
  savedAt: string;
}

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export const CLASSIFICATIONS = [
  'Aumento de fuerza',
  'Ganancia muscular',
  'Adaptación muscular',
  'Pérdida de peso',
] as const;

export const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'] as const;

export const EXERCISE_TAGS: { value: ExerciseTag; label: string }[] = [
  { value: '', label: 'Sin etiqueta' },
  { value: 'calentamiento', label: 'Calentamiento' },
  { value: 'estiramiento', label: 'Estiramiento' },
  { value: 'principal', label: 'Principal' },
  { value: 'cardio', label: 'Cardio' },
];

export const NUTRITION_OBJECTIVES = [
  'Volumen',
  'Definición',
  'Mantenimiento',
  'Rendimiento deportivo',
  'Mejorar salud general',
  'Control glucémico',
] as const;

export const DIET_TYPES = [
  'General',
  'Vegana',
  'Vegetariana',
  'Cetogénica',
  'Paleo',
  'Mediterránea',
  'DASH',
] as const;

export const MEAL_PRESETS = ['Desayuno', 'Comida', 'Cena', 'Snack'] as const;

export function formatRest(ex: Exercise): string {
  if (ex.restMin || ex.restSec) {
    const m = ex.restMin || '0';
    const s = ex.restSec || '0';
    if (m !== '0' && s !== '0') return `${m} min ${s} s`;
    if (m !== '0') return `${m} min`;
    if (s !== '0') return `${s} s`;
  }
  return ex.rest || '';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
