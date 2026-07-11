import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { MediaPlayer } from '../components/MediaPlayer';
import { ExercisePicker, type PickedExercise } from '../components/ExercisePicker';
import { PlanMeta } from '../components/PlanMeta';
import {
  subscribeClients,
  subscribeRoutine,
  saveRoutine,
  subscribeNutrition,
  saveNutrition,
  clearRoutineDay,
  clearNutritionDay,
  pushClientNotification,
  syncClientCoachMetaFromPlans,
} from '../lib/firestore';
import { formatFirebaseError } from '../lib/mediaUrl';
import {
  DAY_NAMES,
  DAY_SHORT,
  CLASSIFICATIONS,
  LEVELS,
  EXERCISE_TAGS,
  NUTRITION_OBJECTIVES,
  DIET_TYPES,
  MEAL_PRESETS,
  type Exercise,
  type Routine,
  type Meal,
  type Food,
  type NutritionPlan,
} from '../types';
import './CoachClientEdit.css';

type Tab = 'rutina' | 'nutricion';

const emptyRoutine = (): Routine => ({
  dayName: '',
  comment: '',
  classification: '',
  level: '',
  exercises: [],
});

const emptyNutrition = (): NutritionPlan => ({
  planName: '',
  objective: '',
  dietType: '',
  calories: '',
  meals: [],
});

function hasNutritionContent(plan: NutritionPlan): boolean {
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

export function CoachClientEdit() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [tab, setTab] = useState<Tab>('rutina');
  const [dayIndex, setDayIndex] = useState(0);
  const [routine, setRoutine] = useState<Routine>(emptyRoutine());
  const [nutrition, setNutrition] = useState<NutritionPlan>(emptyNutrition());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [routineDirty, setRoutineDirty] = useState(false);
  const [nutritionDirty, setNutritionDirty] = useState(false);
  const [notifyClient, setNotifyClient] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    return subscribeClients((clients) => {
      setClientName(clients[clientId]?.name ?? 'Clienta');
    });
  }, [clientId]);

  useEffect(() => {
    setRoutineDirty(false);
    setNutritionDirty(false);
    setError('');
  }, [dayIndex, tab]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeRoutine(clientId, dayIndex, (data) => {
      if (routineDirty) return;
      setRoutine(data ?? emptyRoutine());
    });
  }, [clientId, dayIndex, routineDirty]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeNutrition(clientId, dayIndex, (data) => {
      if (nutritionDirty) return;
      setNutrition(data ?? emptyNutrition());
    });
  }, [clientId, dayIndex, nutritionDirty]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    const dirty = tab === 'rutina' ? routineDirty : nutritionDirty;
    const sectionLabel = tab === 'rutina' ? 'la rutina' : 'el plan alimenticio';
    if (dirty && !confirm(`¿Descartar cambios en ${sectionLabel} sin guardar?`)) return;
    if (tab === 'rutina') setRoutineDirty(false);
    else setNutritionDirty(false);
    navigate('/coach');
  };

  const handleSaveRoutine = async () => {
    if (!clientId) return;
    setSaving(true);
    setError('');
    try {
      await saveRoutine(clientId, dayIndex, routine);
      if (notifyClient) {
        await pushClientNotification(
          clientId,
          `Tu rutina del ${DAY_NAMES[dayIndex].toLowerCase()} fue actualizada`
        );
        setNotifyClient(false);
      }
      await syncClientCoachMetaFromPlans(clientId);
      setRoutineDirty(false);
      flashSaved();
    } catch (e) {
      setError(formatFirebaseError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNutrition = async () => {
    if (!clientId) return;
    setSaving(true);
    setError('');
    try {
      await saveNutrition(clientId, dayIndex, nutrition);
      if (notifyClient) {
        await pushClientNotification(
          clientId,
          `Tu plan de alimentación del ${DAY_NAMES[dayIndex].toLowerCase()} fue actualizado`
        );
        setNotifyClient(false);
      }
      await syncClientCoachMetaFromPlans(clientId);
      setNutritionDirty(false);
      flashSaved();
    } catch (e) {
      setError(formatFirebaseError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleClearRoutine = async () => {
    if (!clientId) return;
    if (!confirm(`¿Vaciar la rutina de ${DAY_NAMES[dayIndex]}? Se borrarán todos los ejercicios de este día.`)) return;
    setSaving(true);
    setError('');
    try {
      await clearRoutineDay(clientId, dayIndex);
      setRoutine(emptyRoutine());
      setRoutineDirty(false);
      flashSaved();
    } catch (e) {
      setError(formatFirebaseError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleClearNutrition = async () => {
    if (!clientId) return;
    if (!confirm(`¿Vaciar el plan de alimentación de ${DAY_NAMES[dayIndex]}?`)) return;
    setSaving(true);
    setError('');
    try {
      await clearNutritionDay(clientId, dayIndex);
      setNutrition(emptyNutrition());
      setNutritionDirty(false);
      flashSaved();
    } catch (e) {
      setError(formatFirebaseError(e));
    } finally {
      setSaving(false);
    }
  };

  const addFromLibrary = (items: PickedExercise[]) => {
    const newExercises: Exercise[] = items.map((item) => ({
      id: nanoid(),
      name: item.name,
      mediaUrl: item.mediaUrl,
      libraryExerciseId: item.libraryExerciseId,
      sets: '',
      reps: '',
      restMin: '',
      restSec: '',
      notes: '',
      tag: 'principal' as const,
    }));
    setRoutineDirty(true);
    setRoutine((r) => ({ ...r, exercises: [...r.exercises, ...newExercises] }));
  };

  const addManualExercise = () => {
    const exercise: Exercise = {
      id: nanoid(),
      name: '',
      sets: '',
      reps: '',
      restMin: '',
      restSec: '',
      notes: '',
      tag: 'principal',
    };
    setRoutineDirty(true);
    setRoutine((r) => ({ ...r, exercises: [...r.exercises, exercise] }));
  };

  const updateExercise = (id: string, patch: Partial<Exercise>) => {
    setRoutineDirty(true);
    setRoutine((r) => ({
      ...r,
      exercises: r.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const removeExercise = (id: string) => {
    setRoutineDirty(true);
    setRoutine((r) => ({
      ...r,
      exercises: r.exercises.filter((e) => e.id !== id),
    }));
  };

  const moveExercise = (id: string, direction: 'up' | 'down') => {
    setRoutineDirty(true);
    setRoutine((r) => {
      const idx = r.exercises.findIndex((e) => e.id === id);
      if (idx < 0) return r;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= r.exercises.length) return r;
      const exercises = [...r.exercises];
      [exercises[idx], exercises[target]] = [exercises[target], exercises[idx]];
      return { ...r, exercises };
    });
  };

  const addMeal = (preset?: string) => {
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: [...n.meals, { id: nanoid(), mealName: preset ?? '', foods: [] }],
    }));
  };

  const updateMeal = (mealId: string, patch: Partial<Meal>) => {
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m)),
    }));
  };

  const removeMeal = (mealId: string) => {
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: n.meals.filter((m) => m.id !== mealId),
    }));
  };

  const addFood = (mealId: string) => {
    const food: Food = { id: nanoid(), name: '', photoUrl: '', equivalents: '' };
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) =>
        m.id === mealId ? { ...m, foods: [...m.foods, food] } : m
      ),
    }));
  };

  const updateFood = (mealId: string, foodId: string, patch: Partial<Food>) => {
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) =>
        m.id === mealId
          ? { ...m, foods: m.foods.map((f) => (f.id === foodId ? { ...f, ...patch } : f)) }
          : m
      ),
    }));
  };

  const removeFood = (mealId: string, foodId: string) => {
    setNutritionDirty(true);
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) =>
        m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m
      ),
    }));
  };

  if (!clientId) return null;

  return (
    <div className="coach-edit">
      <header className="coach-edit__header">
        <Link to="/coach" className="back-link">← Volver</Link>
        <h1>{clientName}</h1>
      </header>

      <div className="tabs">
        <button
          className={`tab ${tab === 'rutina' ? 'tab--active' : ''}`}
          onClick={() => setTab('rutina')}
        >
          Entrenamiento
        </button>
        <button
          className={`tab ${tab === 'nutricion' ? 'tab--active' : ''}`}
          onClick={() => setTab('nutricion')}
        >
          Plan alimenticio
        </button>
      </div>

      {tab === 'rutina' && (
        <div className="edit-section">
          <div className="day-tabs" role="tablist" aria-label="Día de la semana">
            {DAY_SHORT.map((name, i) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={dayIndex === i}
                className={`day-tab ${dayIndex === i ? 'day-tab--active' : ''}`}
                onClick={() => setDayIndex(i)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="card day-card">
            <p className="day-card__label">{DAY_NAMES[dayIndex]}</p>
            <PlanMeta
              label="Rutina"
              gender="f"
              createdAt={routine.createdAt}
              updatedAt={routine.updatedAt}
              hasContent={routine.exercises.length > 0}
            />

            <label>
              Nombre de la rutina
              <input
                value={routine.dayName ?? ''}
                onChange={(e) => {
                  setRoutineDirty(true);
                  setRoutine((r) => ({ ...r, dayName: e.target.value }));
                }}
                placeholder="Ej. Pierna + glúteo"
              />
            </label>

            <label>
              Comentarios (opcional)
              <textarea
                value={routine.comment ?? ''}
                onChange={(e) => {
                  setRoutineDirty(true);
                  setRoutine((r) => ({ ...r, comment: e.target.value }));
                }}
                placeholder="Instrucciones generales para tu clienta..."
                rows={2}
              />
            </label>

            <div className="field-grid">
              <label>
                Clasificación
                <select
                  value={routine.classification ?? ''}
                  onChange={(e) => {
                    setRoutineDirty(true);
                    setRoutine((r) => ({ ...r, classification: e.target.value }));
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Nivel
                <select
                  value={routine.level ?? ''}
                  onChange={(e) => {
                    setRoutineDirty(true);
                    setRoutine((r) => ({ ...r, level: e.target.value }));
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="exercise-add-row">
              <button type="button" className="btn btn--secondary btn--block" onClick={() => setPickerOpen(true)}>
                + Desde biblioteca
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={addManualExercise}>
                + Agregar manual
              </button>
            </div>
          </div>

          {routine.exercises.length === 0 ? (
            <p className="empty-hint">
              Sin ejercicios para este día. Agrégalos desde la biblioteca o escríbelos a mano (calentamiento, enfriamiento, etc.).
            </p>
          ) : (
            <div className="exercise-list">
              {routine.exercises.map((ex, idx) => (
                <div key={ex.id} className="exercise-card card">
                  <div className="exercise-card__head">
                    <select
                      className="tag-select"
                      value={ex.tag ?? ''}
                      onChange={(e) => updateExercise(ex.id, { tag: e.target.value as Exercise['tag'] })}
                    >
                      {EXERCISE_TAGS.map((t) => (
                        <option key={t.value || 'none'} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span className="exercise-num">{idx + 1}</span>
                    <div className="exercise-card__reorder">
                      <button
                        type="button"
                        className="reorder-btn"
                        onClick={() => moveExercise(ex.id, 'up')}
                        disabled={idx === 0}
                        aria-label={`Subir ejercicio ${idx + 1}`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="reorder-btn"
                        onClick={() => moveExercise(ex.id, 'down')}
                        disabled={idx === routine.exercises.length - 1}
                        aria-label={`Bajar ejercicio ${idx + 1}`}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn--icon-danger"
                      onClick={() => removeExercise(ex.id)}
                      aria-label={`Quitar ejercicio ${idx + 1}`}
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="exercise-fields">
                  <label>
                    Nombre del ejercicio
                    <input
                      value={ex.name}
                      onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                      placeholder="Ej. Caminata en caminadora, estiramiento de cuádriceps..."
                    />
                  </label>
                  {ex.mediaUrl && <MediaPlayer url={ex.mediaUrl} alt={ex.name} compact />}

                  <div className="exercise-fields__group">
                  <p className="field-label">Series y repeticiones</p>
                  <div className="field-row">
                    <label>
                      Series
                      <input
                        value={ex.sets ?? ''}
                        onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Reps
                      <input
                        value={ex.reps ?? ''}
                        onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                      />
                    </label>
                  </div>
                  </div>

                  <div className="exercise-fields__group">
                  <p className="field-label">Descanso entre series</p>
                  <div className="field-row">
                    <label>
                      Min
                      <input
                        value={ex.restMin ?? ''}
                        onChange={(e) => updateExercise(ex.id, { restMin: e.target.value })}
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Seg
                      <input
                        value={ex.restSec ?? ''}
                        onChange={(e) => updateExercise(ex.id, { restSec: e.target.value })}
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                  </div>

                  <label>
                    Notas del ejercicio
                    <textarea
                      value={ex.notes ?? ''}
                      onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
                      rows={2}
                      placeholder="Técnica, tempo, etc."
                    />
                  </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sticky-actions-spacer" aria-hidden />

          <div className="sticky-actions">
            {error && <p className="form-error sticky-error">{error}</p>}
            <label className="notify-client-check">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
              />
              <span>Notificar a la clienta</span>
            </label>
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={handleClearRoutine}
              disabled={saving}
            >
              Vaciar rutina del día
            </button>
            <div className="sticky-actions__row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveRoutine}
                disabled={saving}
              >
                {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar rutina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'nutricion' && (
        <div className="edit-section">
          <div className="day-tabs" role="tablist" aria-label="Día de la semana">
            {DAY_SHORT.map((name, i) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={dayIndex === i}
                className={`day-tab ${dayIndex === i ? 'day-tab--active' : ''}`}
                onClick={() => setDayIndex(i)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="card">
            <p className="day-card__label">Plan · {DAY_NAMES[dayIndex]}</p>
            <PlanMeta
              label="Plan alimenticio"
              gender="m"
              createdAt={nutrition.createdAt}
              updatedAt={nutrition.updatedAt}
              hasContent={hasNutritionContent(nutrition)}
            />
            <label>
              Nombre del plan alimenticio
              <input
                value={nutrition.planName ?? ''}
                onChange={(e) => {
                  setNutritionDirty(true);
                  setNutrition((n) => ({ ...n, planName: e.target.value }));
                }}
                placeholder="Ej. Plan definición semana 1"
              />
            </label>
            <div className="field-grid">
              <label>
                Objetivo
                <select
                  value={nutrition.objective ?? ''}
                  onChange={(e) => {
                    setNutritionDirty(true);
                    setNutrition((n) => ({ ...n, objective: e.target.value }));
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {NUTRITION_OBJECTIVES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de dieta
                <select
                  value={nutrition.dietType ?? ''}
                  onChange={(e) => {
                    setNutritionDirty(true);
                    setNutrition((n) => ({ ...n, dietType: e.target.value }));
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {DIET_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Calorías del día
                <input
                  value={nutrition.calories ?? ''}
                  onChange={(e) => {
                    setNutritionDirty(true);
                    setNutrition((n) => ({ ...n, calories: e.target.value.replace(/[^\d]/g, '') }));
                  }}
                  placeholder="Ej. 2000"
                  inputMode="numeric"
                />
              </label>
            </div>
          </div>

          {nutrition.meals.map((meal) => (
            <div key={meal.id} className="meal-card card">
              <div className="meal-card__head">
                <input
                  className="meal-name-input"
                  value={meal.mealName}
                  onChange={(e) => updateMeal(meal.id, { mealName: e.target.value })}
                  placeholder="Desayuno, comida, cena, snack..."
                  list="meal-presets"
                />
                <button
                  type="button"
                  className="btn btn--icon-danger"
                  onClick={() => removeMeal(meal.id)}
                  aria-label="Quitar comida"
                >
                  Quitar
                </button>
              </div>

              {meal.foods.length === 0 && (
                <p className="empty-hint">No hay alimentos. Agrega el primero.</p>
              )}

              {meal.foods.map((food) => (
                <div key={food.id} className="food-card">
                  <label>
                    Alimento
                    <input
                      value={food.name}
                      onChange={(e) => updateFood(meal.id, food.id, { name: e.target.value })}
                    />
                  </label>
                  <label>
                    Foto (URL)
                    <input
                      value={food.photoUrl ?? ''}
                      onChange={(e) => updateFood(meal.id, food.id, { photoUrl: e.target.value })}
                    />
                  </label>
                  {food.photoUrl && (
                    <MediaPlayer url={food.photoUrl} alt={food.name} compact />
                  )}
                  <label>
                    Equivalentes
                    <textarea
                      value={food.equivalents ?? ''}
                      onChange={(e) => updateFood(meal.id, food.id, { equivalents: e.target.value })}
                      placeholder="1 taza arroz = 2 tortillas = ½ papa mediana"
                      rows={2}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => removeFood(meal.id, food.id)}
                  >
                    Quitar alimento
                  </button>
                </div>
              ))}

              <button type="button" className="btn btn--ghost btn--block" onClick={() => addFood(meal.id)}>
                + Agregar alimento
              </button>
            </div>
          ))}

          <datalist id="meal-presets">
            {MEAL_PRESETS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <div className="meal-presets">
            {MEAL_PRESETS.map((m) => (
              <button key={m} type="button" className="btn btn--ghost btn--small" onClick={() => addMeal(m)}>
                + {m}
              </button>
            ))}
          </div>

          <button type="button" className="btn btn--secondary btn--block" onClick={() => addMeal()}>
            + Agregar sección
          </button>

          <div className="sticky-actions-spacer" aria-hidden />

          <div className="sticky-actions">
            {error && <p className="form-error sticky-error">{error}</p>}
            <label className="notify-client-check">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
              />
              <span>Notificar a la clienta</span>
            </label>
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={handleClearNutrition}
              disabled={saving}
            >
              Vaciar plan del día
            </button>
            <div className="sticky-actions__row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveNutrition}
                disabled={saving}
              >
                {saving ? 'Guardando...' : saved ? '¡Guardado!' : `Guardar plan · ${DAY_NAMES[dayIndex]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addFromLibrary}
        onManual={addManualExercise}
      />
    </div>
  );
}
