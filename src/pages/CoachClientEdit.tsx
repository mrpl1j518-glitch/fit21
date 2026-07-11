import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { MediaPlayer } from '../components/MediaPlayer';
import {
  subscribeClients,
  subscribeRoutine,
  saveRoutine,
  subscribeNutrition,
  saveNutrition,
} from '../lib/firestore';
import { DAY_NAMES, type Exercise, type Routine, type Meal, type Food, type NutritionPlan } from '../types';
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
  meals: [],
});

export function CoachClientEdit() {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientName, setClientName] = useState('');
  const [tab, setTab] = useState<Tab>('rutina');
  const [dayIndex, setDayIndex] = useState(0);
  const [routine, setRoutine] = useState<Routine>(emptyRoutine());
  const [nutrition, setNutrition] = useState<NutritionPlan>(emptyNutrition());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    return subscribeClients((clients) => {
      setClientName(clients[clientId]?.name ?? 'Clienta');
    });
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeRoutine(clientId, dayIndex, (data) => {
      setRoutine(data ?? emptyRoutine());
    });
  }, [clientId, dayIndex]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeNutrition(clientId, (data) => {
      setNutrition(data ?? emptyNutrition());
    });
  }, [clientId]);

  const handleSaveRoutine = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      await saveRoutine(clientId, dayIndex, routine);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNutrition = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      await saveNutrition(clientId, nutrition);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const addExercise = () => {
    const ex: Exercise = {
      id: nanoid(),
      name: '',
      mediaUrl: '',
      sets: '',
      reps: '',
      rest: '',
      notes: '',
      tag: '',
    };
    setRoutine((r) => ({ ...r, exercises: [...r.exercises, ex] }));
  };

  const updateExercise = (id: string, patch: Partial<Exercise>) => {
    setRoutine((r) => ({
      ...r,
      exercises: r.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const removeExercise = (id: string) => {
    setRoutine((r) => ({
      ...r,
      exercises: r.exercises.filter((e) => e.id !== id),
    }));
  };

  const addMeal = () => {
    setNutrition((n) => ({
      ...n,
      meals: [...n.meals, { id: nanoid(), mealName: '', foods: [] }],
    }));
  };

  const updateMeal = (mealId: string, patch: Partial<Meal>) => {
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m)),
    }));
  };

  const removeMeal = (mealId: string) => {
    setNutrition((n) => ({
      ...n,
      meals: n.meals.filter((m) => m.id !== mealId),
    }));
  };

  const addFood = (mealId: string) => {
    const food: Food = { id: nanoid(), name: '', photoUrl: '', equivalents: '' };
    setNutrition((n) => ({
      ...n,
      meals: n.meals.map((m) =>
        m.id === mealId ? { ...m, foods: [...m.foods, food] } : m
      ),
    }));
  };

  const updateFood = (mealId: string, foodId: string, patch: Partial<Food>) => {
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
          Rutina
        </button>
        <button
          className={`tab ${tab === 'nutricion' ? 'tab--active' : ''}`}
          onClick={() => setTab('nutricion')}
        >
          Nutrición
        </button>
      </div>

      {tab === 'rutina' && (
        <div className="edit-section card">
          <div className="day-tabs">
            {DAY_NAMES.map((name, i) => (
              <button
                key={name}
                className={`day-tab ${dayIndex === i ? 'day-tab--active' : ''}`}
                onClick={() => setDayIndex(i)}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>

          <h2>{DAY_NAMES[dayIndex]}</h2>

          <div className="field-grid">
            <label>
              Nombre del día
              <input
                value={routine.dayName ?? ''}
                onChange={(e) => setRoutine((r) => ({ ...r, dayName: e.target.value }))}
                placeholder="Ej. Pierna + glúteo"
              />
            </label>
            <label>
              Clasificación
              <input
                value={routine.classification ?? ''}
                onChange={(e) => setRoutine((r) => ({ ...r, classification: e.target.value }))}
                placeholder="Fuerza, hipertrofia..."
              />
            </label>
            <label>
              Nivel
              <select
                value={routine.level ?? ''}
                onChange={(e) => setRoutine((r) => ({ ...r, level: e.target.value }))}
              >
                <option value="">—</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </label>
          </div>

          <label>
            Comentario general
            <textarea
              value={routine.comment ?? ''}
              onChange={(e) => setRoutine((r) => ({ ...r, comment: e.target.value }))}
              placeholder="Notas para la clienta sobre este día..."
              rows={2}
            />
          </label>

          <div className="exercises-header">
            <h3>Ejercicios</h3>
            <button className="btn btn--small btn--teal" onClick={addExercise}>
              + Ejercicio
            </button>
          </div>

          {routine.exercises.length === 0 ? (
            <p className="empty-state">Sin ejercicios para este día.</p>
          ) : (
            <div className="exercise-list">
              {routine.exercises.map((ex, idx) => (
                <div key={ex.id} className="exercise-card">
                  <div className="exercise-card__head">
                    <span className="exercise-num">#{idx + 1}</span>
                    <button className="btn btn--small btn--danger" onClick={() => removeExercise(ex.id)}>
                      Quitar
                    </button>
                  </div>
                  <label>
                    Nombre
                    <input
                      value={ex.name}
                      onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                    />
                  </label>
                  <label>
                    Link imagen / gif / video
                    <input
                      value={ex.mediaUrl ?? ''}
                      onChange={(e) => updateExercise(ex.id, { mediaUrl: e.target.value })}
                      placeholder="YouTube, Drive, .mp4..."
                    />
                  </label>
                  <MediaPlayer url={ex.mediaUrl} alt={ex.name} compact />
                  <div className="field-row">
                    <label>
                      Series
                      <input
                        value={ex.sets ?? ''}
                        onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                      />
                    </label>
                    <label>
                      Reps
                      <input
                        value={ex.reps ?? ''}
                        onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                      />
                    </label>
                    <label>
                      Descanso
                      <input
                        value={ex.rest ?? ''}
                        onChange={(e) => updateExercise(ex.id, { rest: e.target.value })}
                        placeholder="60s"
                      />
                    </label>
                  </div>
                  <label>
                    Etiqueta
                    <select
                      value={ex.tag ?? ''}
                      onChange={(e) => updateExercise(ex.id, { tag: e.target.value as Exercise['tag'] })}
                    >
                      <option value="">—</option>
                      <option value="calentamiento">Calentamiento</option>
                      <option value="principal">Principal</option>
                      <option value="cardio">Cardio</option>
                    </select>
                  </label>
                  <label>
                    Notas
                    <textarea
                      value={ex.notes ?? ''}
                      onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
                      rows={2}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn--primary btn--block"
            onClick={handleSaveRoutine}
            disabled={saving}
          >
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : `Guardar ${DAY_NAMES[dayIndex]}`}
          </button>
        </div>
      )}

      {tab === 'nutricion' && (
        <div className="edit-section card">
          <div className="field-grid">
            <label>
              Nombre del plan
              <input
                value={nutrition.planName ?? ''}
                onChange={(e) => setNutrition((n) => ({ ...n, planName: e.target.value }))}
              />
            </label>
            <label>
              Objetivo
              <select
                value={nutrition.objective ?? ''}
                onChange={(e) => setNutrition((n) => ({ ...n, objective: e.target.value }))}
              >
                <option value="">—</option>
                <option value="volumen">Volumen</option>
                <option value="definicion">Definición</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </label>
            <label>
              Tipo de dieta
              <select
                value={nutrition.dietType ?? ''}
                onChange={(e) => setNutrition((n) => ({ ...n, dietType: e.target.value }))}
              >
                <option value="">—</option>
                <option value="general">General</option>
                <option value="vegana">Vegana</option>
                <option value="vegetariana">Vegetariana</option>
                <option value="keto">Keto</option>
              </select>
            </label>
          </div>

          <div className="exercises-header">
            <h3>Comidas</h3>
            <button className="btn btn--small btn--pink" onClick={addMeal}>
              + Comida
            </button>
          </div>

          {nutrition.meals.length === 0 ? (
            <p className="empty-state">Sin plan de alimentación aún.</p>
          ) : (
            nutrition.meals.map((meal) => (
              <div key={meal.id} className="meal-card">
                <div className="meal-card__head">
                  <input
                    className="meal-name-input"
                    value={meal.mealName}
                    onChange={(e) => updateMeal(meal.id, { mealName: e.target.value })}
                    placeholder="Desayuno, comida, cena..."
                  />
                  <button className="btn btn--small btn--danger" onClick={() => removeMeal(meal.id)}>
                    Quitar comida
                  </button>
                </div>

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
                        placeholder="1 taza arroz = 2 tortillas..."
                        rows={2}
                      />
                    </label>
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => removeFood(meal.id, food.id)}
                    >
                      Quitar alimento
                    </button>
                  </div>
                ))}

                <button className="btn btn--small btn--teal" onClick={() => addFood(meal.id)}>
                  + Alimento
                </button>
              </div>
            ))
          )}

          <button
            className="btn btn--primary btn--block"
            onClick={handleSaveNutrition}
            disabled={saving}
          >
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar plan de nutrición'}
          </button>
        </div>
      )}
    </div>
  );
}
