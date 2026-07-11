import { useEffect, useState } from 'react';
import { CoachProgressChart } from './CoachProgressChart';
import { updateClientCoachMeta } from '../lib/firestore';
import type { ClientCoachOverview } from '../types';
import './ClientOverviewPanel.css';

interface ClientOverviewPanelProps {
  clientId: string;
  overview?: ClientCoachOverview;
}

export function ClientOverviewPanel({ clientId, overview }: ClientOverviewPanelProps) {
  const [editing, setEditing] = useState(false);
  const [routineGoal, setRoutineGoal] = useState('');
  const [nutritionGoal, setNutritionGoal] = useState('');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!overview || editing) return;
    setRoutineGoal(overview.routineGoal);
    setNutritionGoal(overview.nutritionGoal);
    setCalories(overview.calories);
  }, [overview, editing]);

  if (!overview) return null;

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await updateClientCoachMeta(clientId, {
        routineGoal: routineGoal.trim(),
        nutritionGoal: nutritionGoal.trim(),
        calories: calories.trim(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-overview">
      <div className="client-overview__stats">
        <span className="client-overview__chip">
          {overview.activeRoutineDays}/7 días con rutina
        </span>
        {overview.calories && (
          <span className="client-overview__chip client-overview__chip--cal">
            {overview.calories} kcal
          </span>
        )}
      </div>

      {editing ? (
        <div className="client-overview__edit">
          <label>
            Meta rutina
            <input
              value={routineGoal}
              onChange={(e) => setRoutineGoal(e.target.value)}
              placeholder="Ej. Ganancia muscular · Intermedio"
            />
          </label>
          <label>
            Meta nutrición
            <input
              value={nutritionGoal}
              onChange={(e) => setNutritionGoal(e.target.value)}
              placeholder="Ej. Definición · Mediterránea"
            />
          </label>
          <label>
            Calorías del plan
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="Ej. 1800"
            />
          </label>
          <div className="client-overview__edit-actions">
            <button
              type="button"
              className="btn btn--small btn--primary"
              onClick={handleSaveMeta}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar meta'}
            </button>
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="client-overview__meta">
          <p>
            <strong>Meta rutina:</strong> {overview.routineGoal || 'Sin definir'}
          </p>
          <p>
            <strong>Meta nutrición:</strong> {overview.nutritionGoal || 'Sin definir'}
          </p>
          <button
            type="button"
            className="btn btn--text client-overview__edit-btn"
            onClick={() => setEditing(true)}
          >
            Editar meta
          </button>
        </div>
      )}

      <CoachProgressChart
        dailyCompletion={overview.dailyCompletion}
        progressCount={overview.progressCount}
        cycleDay={overview.cycleDay}
      />
    </div>
  );
}
