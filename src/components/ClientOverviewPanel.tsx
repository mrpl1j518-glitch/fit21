import { useEffect, useState } from 'react';
import { CoachProgressChart } from './CoachProgressChart';
import {
  restartClientCycle,
  startClientCycle,
  updateClientCoachMeta,
} from '../lib/firestore';
import { isCyclePeriodEnded } from '../lib/dates';
import { CYCLE_DAYS, type ClientCoachOverview } from '../types';
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
  const [cycleBusy, setCycleBusy] = useState(false);

  useEffect(() => {
    if (!overview || editing) return;
    setRoutineGoal(overview.routineGoal);
    setNutritionGoal(overview.nutritionGoal);
    setCalories(overview.calories);
  }, [overview, editing]);

  if (!overview) return null;

  const cycleStarted = Boolean(overview.cycleStartedAt);
  const cycleCompleted =
    cycleStarted &&
    (overview.progressCount >= CYCLE_DAYS ||
      (overview.cycleStartedAt
        ? isCyclePeriodEnded(overview.cycleStartedAt, CYCLE_DAYS)
        : false));

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

  const handleStartCycle = async () => {
    setCycleBusy(true);
    try {
      await startClientCycle(clientId);
    } finally {
      setCycleBusy(false);
    }
  };

  const handleRestartCycle = async () => {
    const ok = window.confirm(
      '¿Reiniciar el ciclo desde hoy? Se borrará el avance marcado (días completados) y el día 1 será hoy.'
    );
    if (!ok) return;
    setCycleBusy(true);
    try {
      await restartClientCycle(clientId);
    } finally {
      setCycleBusy(false);
    }
  };

  return (
    <div className="client-overview">
      <div className="client-overview__stats">
        {!cycleStarted ? (
          <span className="client-overview__chip client-overview__chip--warn">
            Ciclo no iniciado
          </span>
        ) : cycleCompleted ? (
          <span className="client-overview__chip client-overview__chip--done">
            Ciclo completado
          </span>
        ) : (
          <span className="client-overview__chip client-overview__chip--progress">
            {overview.progressCount}/28 días completados
          </span>
        )}
        <span className="client-overview__chip">
          {overview.activeRoutineDays}/7 días con rutina
        </span>
        {overview.calories && (
          <span className="client-overview__chip client-overview__chip--cal">
            {overview.calories} kcal
          </span>
        )}
      </div>

      <div className="client-overview__cycle-actions">
        {!cycleStarted ? (
          <button
            type="button"
            className="btn btn--small btn--primary"
            onClick={handleStartCycle}
            disabled={cycleBusy}
          >
            {cycleBusy ? 'Iniciando...' : 'Iniciar ciclo'}
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn--small ${cycleCompleted ? 'btn--primary' : 'btn--ghost'}`}
            onClick={handleRestartCycle}
            disabled={cycleBusy}
          >
            {cycleBusy ? 'Reiniciando...' : 'Reiniciar ciclo'}
          </button>
        )}
      </div>

      {cycleCompleted && (
        <p className="client-overview__preview-hint">
          El periodo de 28 días terminó. La alumna puede seguir marcando días, pero no suman al
          contador hasta que reinicies el ciclo.
        </p>
      )}

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

      {cycleStarted ? (
        <CoachProgressChart
          dailyCompletion={overview.dailyCompletion}
          progressCount={overview.progressCount}
          cycleDay={overview.cycleDay}
        />
      ) : (
        <p className="client-overview__preview-hint">
          La alumna ya puede ver su plan. El contador de 28 días empieza cuando pulses
          “Iniciar ciclo”.
        </p>
      )}
    </div>
  );
}
