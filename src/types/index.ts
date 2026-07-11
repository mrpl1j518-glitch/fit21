export type ExerciseTag = '' | 'calentamiento' | 'principal' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  mediaUrl?: string;
  sets?: string;
  reps?: string;
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
