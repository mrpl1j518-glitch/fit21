import type { NutritionPlan, Routine } from '../types';

export function hasRoutineContent(routine: Routine | null | undefined): boolean {
  return Boolean(routine && routine.exercises.length > 0);
}

export function hasNutritionContent(plan: NutritionPlan | null | undefined): boolean {
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
