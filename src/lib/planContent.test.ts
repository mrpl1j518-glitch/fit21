import { describe, expect, it } from 'vitest';
import { hasNutritionContent, hasRoutineContent } from './planContent';
import type { NutritionPlan, Routine } from '../types';

const emptyRoutine = (): Routine => ({
  dayName: '',
  exercises: [],
});

const emptyNutrition = (): NutritionPlan => ({
  planName: '',
  meals: [],
});

describe('hasRoutineContent', () => {
  it('es false sin ejercicios', () => {
    expect(hasRoutineContent(emptyRoutine())).toBe(false);
    expect(hasRoutineContent(null)).toBe(false);
  });

  it('es true con al menos un ejercicio', () => {
    expect(
      hasRoutineContent({
        ...emptyRoutine(),
        exercises: [{ id: '1', name: 'Sentadilla', tag: 'principal' }],
      })
    ).toBe(true);
  });
});

describe('hasNutritionContent', () => {
  it('es false en plan vacío', () => {
    expect(hasNutritionContent(emptyNutrition())).toBe(false);
    expect(hasNutritionContent(null)).toBe(false);
  });

  it('detecta metadatos del plan', () => {
    expect(hasNutritionContent({ ...emptyNutrition(), calories: '2000' })).toBe(true);
    expect(hasNutritionContent({ ...emptyNutrition(), objective: 'Definición' })).toBe(true);
  });

  it('detecta comidas y alimentos', () => {
    expect(
      hasNutritionContent({
        ...emptyNutrition(),
        meals: [{ id: 'm1', mealName: 'Desayuno', foods: [] }],
      })
    ).toBe(true);

    expect(
      hasNutritionContent({
        ...emptyNutrition(),
        meals: [
          {
            id: 'm1',
            mealName: '',
            foods: [{ id: 'f1', name: 'Avena', equivalents: '' }],
          },
        ],
      })
    ).toBe(true);
  });
});
