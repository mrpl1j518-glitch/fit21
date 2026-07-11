import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { DayPips } from '../components/DayPips';
import { MediaPlayer } from '../components/MediaPlayer';
import {
  subscribeClients,
  subscribeRoutine,
  subscribeNutrition,
  subscribeWeekProgress,
  subscribeProgressCount,
  setDayComplete,
} from '../lib/firestore';
import {
  DAY_NAMES,
  DAY_SHORT,
  formatRest,
  type Routine,
  type NutritionPlan,
  type Exercise,
} from '../types';
import {
  getDayIndex,
  getTodayKey,
  getWeekStartKey,
  formatSpanishDate,
  dateKeyForDayIndex,
} from '../lib/dates';
import './ClientPlan.css';

const TAG_LABELS: Record<string, string> = {
  calentamiento: 'Calentamiento',
  estiramiento: 'Estiramiento',
  principal: 'Principal',
  cardio: 'Cardio',
};

const WHATSAPP_URL = 'https://wa.me/528110751529';

export function ClientPlan() {
  const { clientId } = useParams<{ clientId: string }>();
  const todayIndex = getDayIndex();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [clientName, setClientName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null);
  const [dayComplete, setDayCompleteState] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  const todayKey = getTodayKey();
  const weekStart = getWeekStartKey();
  const selectedDateKey = dateKeyForDayIndex(selectedDay);
  const isToday = selectedDay === todayIndex;
  const todayLabel = formatSpanishDate(new Date());

  useEffect(() => {
    if (!clientId) return;
    let resolved = false;
    const unsub = subscribeClients((clients) => {
      if (clients[clientId]) {
        setClientName(clients[clientId].name);
        setNotFound(false);
        resolved = true;
      } else if (Object.keys(clients).length > 0 || resolved) {
        setNotFound(true);
      }
    });
    const t = setTimeout(() => {
      if (!resolved) setNotFound(true);
    }, 4000);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeRoutine(clientId, selectedDay, setRoutine);
  }, [clientId, selectedDay]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeNutrition(clientId, selectedDay, setNutrition);
  }, [clientId, selectedDay]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeWeekProgress(clientId, weekStart, (progress) => {
      setDayCompleteState(Boolean(progress[selectedDateKey]));
    });
  }, [clientId, weekStart, selectedDateKey]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeProgressCount(clientId, setProgressCount);
  }, [clientId]);

  const handleToggleComplete = async () => {
    if (!clientId || toggling) return;
    setToggling(true);
    try {
      await setDayComplete(
        clientId,
        weekStart,
        selectedDateKey,
        !dayComplete,
        dayComplete
      );
    } finally {
      setToggling(false);
    }
  };

  if (!clientId) return null;

  if (notFound) {
    return (
      <div className="client-plan client-plan--error">
        <Logo size="md" showTagline />
        <h1>Link no encontrado</h1>
        <p>Pide a tu coach que te reenvíe tu link personal.</p>
      </div>
    );
  }

  const hasNutrition = nutrition && nutrition.meals.length > 0;
  const exercises = routine?.exercises ?? [];
  const todayComplete = isToday && dayComplete;

  return (
    <div className="client-plan">
      <header className="client-header">
        <Logo size="sm" />
        <div>
          <p className="client-greeting">
            Hola, {clientName || '...'}
          </p>
          <p className="client-date">{todayLabel}</p>
          <p className="client-cycle">
            Día <strong>{Math.min(progressCount + (todayComplete ? 0 : 1), 21)}</strong> de tu ciclo de 21
          </p>
        </div>
      </header>

      <div className="day-tabs client-day-tabs" role="tablist" aria-label="Día de la semana">
        {DAY_SHORT.map((name, i) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={selectedDay === i}
            className={`day-tab ${selectedDay === i ? 'day-tab--active' : ''} ${i === todayIndex ? 'day-tab--today' : ''}`}
            onClick={() => setSelectedDay(i)}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="progress-section card">
        <DayPips count={progressCount} />
        <label className="complete-check">
          <input
            type="checkbox"
            checked={dayComplete}
            onChange={handleToggleComplete}
            disabled={toggling}
          />
          <span>
            {isToday
              ? '¡Hoy completé mi rutina!'
              : `Completé la rutina del ${DAY_NAMES[selectedDay].toLowerCase()}`}
          </span>
        </label>
      </section>

      <section className="routine-section card">
        <div className="routine-section__head">
          <h2>{routine?.dayName || DAY_NAMES[selectedDay]}</h2>
          {routine?.classification && (
            <span className="routine-meta">{routine.classification}</span>
          )}
        </div>
        {routine?.comment && <p className="routine-comment">{routine.comment}</p>}

        {exercises.length === 0 ? (
          <p className="empty-state">
            No hay ejercicios asignados para {DAY_NAMES[selectedDay].toLowerCase()}.
          </p>
        ) : (
          <div className="client-exercises">
            {exercises.map((ex: Exercise, i: number) => (
              <article key={ex.id} className="client-exercise">
                <div className="client-exercise__head">
                  <span className="client-exercise__num">{i + 1}</span>
                  <div>
                    <h3>{ex.name || 'Ejercicio'}</h3>
                    {ex.tag && <span className="tag-badge">{TAG_LABELS[ex.tag] ?? ex.tag}</span>}
                  </div>
                </div>
                <MediaPlayer url={ex.mediaUrl} alt={ex.name} />
                <div className="client-exercise__stats">
                  {ex.sets && <span><strong>Series:</strong> {ex.sets}</span>}
                  {ex.reps && <span><strong>Reps:</strong> {ex.reps}</span>}
                  {formatRest(ex) && <span><strong>Descanso:</strong> {formatRest(ex)}</span>}
                </div>
                {ex.notes && <p className="client-exercise__notes">{ex.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nutrition-section card">
        <h2>Plan de alimentación · {DAY_NAMES[selectedDay]}</h2>
        {!hasNutrition ? (
          <p className="empty-state nutrition-empty">
            Por ahora no tienes plan de nutrición asignado para este día
          </p>
        ) : (
          <>
            {nutrition!.planName && <p className="plan-title">{nutrition!.planName}</p>}
            {(nutrition!.objective || nutrition!.dietType) && (
              <p className="plan-meta">
                {[nutrition!.objective, nutrition!.dietType].filter(Boolean).join(' · ')}
              </p>
            )}
            {nutrition!.meals.map((meal) => (
              <div key={meal.id} className="client-meal">
                <h3>{meal.mealName}</h3>
                {meal.foods.map((food) => (
                  <div key={food.id} className="client-food">
                    {food.photoUrl && <MediaPlayer url={food.photoUrl} alt={food.name} compact />}
                    <div>
                      <strong>{food.name}</strong>
                      {food.equivalents && (
                        <p className="food-equiv">{food.equivalents}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </section>

      <footer className="client-footer">
        <p>
          Fit 21, Claudia Chávez, todos los derechos reservados, Julio 2026.
        </p>
        <p>
          Para dudas, nos comunicaremos vía WhatsApp al{' '}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            811 075 1529
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
