import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { DayPips } from '../components/DayPips';
import { WeekPips } from '../components/WeekPips';
import { MediaPlayer } from '../components/MediaPlayer';
import { InstallHint } from '../components/InstallHint';
import { WeekCelebration } from '../components/WeekCelebration';
import { NotificationBell } from '../components/NotificationBell';
import { FeedbackForm } from '../components/FeedbackForm';
import {
  getClient,
  subscribeClient,
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
  CYCLE_DAYS,
  MILESTONE_DAYS,
  type Routine,
  type NutritionPlan,
  type Exercise,
} from '../types';
import {
  getDayIndex,
  getWeekStartKey,
  formatSpanishDate,
  dateKeyForDayIndex,
  dateForDayIndex,
  daysSinceDate,
} from '../lib/dates';
import {
  rememberClientPlan,
  getCachedClientName,
  cacheClientName,
} from '../lib/clientPlanStorage';
import { parseClientPlanParam } from '../lib/clientSlug';
import './ClientPlan.css';

const TAG_LABELS: Record<string, string> = {
  calentamiento: 'Calentamiento',
  estiramiento: 'Estiramiento',
  principal: 'Principal',
  cardio: 'Cardio',
};

const WHATSAPP_URL = 'https://wa.me/528110751529';

export function ClientPlan() {
  const { clientId: clientIdParam } = useParams<{ clientId: string }>();
  const clientId = clientIdParam ? parseClientPlanParam(clientIdParam) : undefined;
  const todayIndex = getDayIndex();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [clientName, setClientName] = useState(() =>
    clientId ? getCachedClientName(clientId) ?? '' : ''
  );
  const [notFound, setNotFound] = useState(false);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null);
  const [routineLoaded, setRoutineLoaded] = useState(false);
  const [nutritionLoaded, setNutritionLoaded] = useState(false);
  const [weekProgress, setWeekProgress] = useState<Record<string, boolean>>({});
  const [dayComplete, setDayCompleteState] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [cycleStartedAt, setCycleStartedAt] = useState<string | undefined>();
  const [toggling, setToggling] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);

  const weekStart = getWeekStartKey();
  const selectedDateKey = dateKeyForDayIndex(selectedDay);
  const isToday = selectedDay === todayIndex;
  const headerDateLabel = isToday
    ? formatSpanishDate(new Date())
    : formatSpanishDate(dateForDayIndex(selectedDay));

  useEffect(() => {
    if (!clientId) return;

    rememberClientPlan(clientId);

    const cached = getCachedClientName(clientId);
    if (cached) {
      setClientName(cached);
      setNotFound(false);
    }

    let resolved = Boolean(cached);
    let cancelled = false;

    getClient(clientId)
      .then((client) => {
        if (cancelled) return;
        if (client) {
          setClientName(client.name);
          cacheClientName(clientId, client.name);
          setNotFound(false);
          resolved = true;
        }
      })
      .catch(() => {
        // snapshot / timeout como fallback
      });

    const unsub = subscribeClient(clientId, (client) => {
      if (client) {
        setClientName(client.name);
        cacheClientName(clientId, client.name);
        rememberClientPlan(clientId, client.name);
        setCycleStartedAt(client.cycleStartedAt);
        setNotFound(false);
        resolved = true;
      } else {
        resolved = true;
        setClientName('');
        setNotFound(true);
      }
    });

    const t = setTimeout(() => {
      if (!resolved) setNotFound(true);
    }, 4000);

    return () => {
      cancelled = true;
      unsub();
      clearTimeout(t);
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setRoutineLoaded(false);
    return subscribeRoutine(clientId, selectedDay, (data) => {
      setRoutine(data);
      setRoutineLoaded(true);
    });
  }, [clientId, selectedDay]);

  useEffect(() => {
    if (!clientId) return;
    setNutritionLoaded(false);
    return subscribeNutrition(clientId, selectedDay, (data) => {
      setNutrition(data);
      setNutritionLoaded(true);
    });
  }, [clientId, selectedDay]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeWeekProgress(clientId, weekStart, setWeekProgress);
  }, [clientId, weekStart]);

  useEffect(() => {
    setDayCompleteState(Boolean(weekProgress[selectedDateKey]));
  }, [weekProgress, selectedDateKey]);

  useEffect(() => {
    if (!clientId) return;
    return subscribeProgressCount(clientId, setProgressCount);
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !cycleStartedAt || progressCount === 0) return;
    if (progressCount % MILESTONE_DAYS !== 0) return;
    const key = `fit21_celebrated_${clientId}_${progressCount}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      return;
    }
    setCelebration(progressCount);
  }, [progressCount, clientId, cycleStartedAt]);

  const handleToggleComplete = async () => {
    if (!clientId || !cycleStartedAt || toggling) return;
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
  const cycleActive = Boolean(cycleStartedAt);
  const cycleDay = cycleStartedAt
    ? Math.min(daysSinceDate(cycleStartedAt) + 1, CYCLE_DAYS)
    : 0;

  return (
    <div className="client-plan">
      {celebration !== null && cycleActive && (
        <WeekCelebration milestone={celebration} onDone={() => setCelebration(null)} />
      )}
      <header className="client-header-card card">
        <div className="client-header">
          <Logo size="sm" />
          <div className="client-header__info">
            <p className="client-greeting">
              Hola,{' '}
              {clientName ? (
                <span className="client-greeting__name">{clientName}</span>
              ) : (
                <span className="client-greeting__skeleton" aria-label="Cargando nombre" />
              )}
            </p>
            <p className="client-date">{headerDateLabel}</p>
            {cycleActive ? (
              <p className="client-cycle">
                Día <strong>{cycleDay}</strong> de tu ciclo de {CYCLE_DAYS}
              </p>
            ) : (
              <p className="client-cycle client-cycle--preview">
                Tu plan está listo. El ciclo de {CYCLE_DAYS} días empieza cuando tu coach lo active.
              </p>
            )}
          </div>
          <NotificationBell clientId={clientId} />
        </div>
      </header>

      <InstallHint />

      <nav className="client-day-nav" aria-label="Día de la semana">
        <div className="day-tabs client-day-tabs" role="tablist">
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
      </nav>

      {cycleActive ? (
        <section className="progress-section card">
          <p className="section-title">Tu avance</p>
          <DayPips count={progressCount} />
          <WeekPips progress={weekProgress} />
          <label className={`complete-check ${dayComplete ? 'complete-check--done' : ''}`}>
            <input
              type="checkbox"
              checked={dayComplete}
              onChange={handleToggleComplete}
              disabled={toggling}
            />
            <span className="complete-check__text">
              {isToday
                ? '¡Hoy completé mi rutina!'
                : `Rutina del ${DAY_NAMES[selectedDay].toLowerCase()} — completada`}
            </span>
          </label>
        </section>
      ) : (
        <section className="progress-section progress-section--preview card">
          <p className="section-title">Tu avance</p>
          <p className="progress-preview-note">
            Podrás marcar tus días completados cuando tu coach inicie el ciclo.
          </p>
        </section>
      )}

      <section className="routine-section card">
        <div className="section-head">
          <p className="section-title">Tu rutina</p>
          <div className="routine-section__head">
            <h2>{routine?.dayName || DAY_NAMES[selectedDay]}</h2>
            {routine?.classification && (
              <span className="routine-meta">{routine.classification}</span>
            )}
            {routine?.level && (
              <span className="routine-meta routine-meta--level">{routine.level}</span>
            )}
          </div>
        </div>
        {routine?.comment && <p className="routine-comment">{routine.comment}</p>}

        {!routineLoaded ? (
          <div className="section-skeleton" aria-label="Cargando rutina">
            <span className="skeleton section-skeleton__line" />
            <span className="skeleton section-skeleton__block" />
            <span className="skeleton section-skeleton__block" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden />
            <p className="empty-state__title">Sin ejercicios asignados</p>
            <p className="empty-state__text">
              Tu coach aún no ha asignado ejercicios para este día.
            </p>
          </div>
        ) : (
          <div className="client-exercises">
            {exercises.map((ex: Exercise, i: number) => (
              <article key={ex.id} className="client-exercise card card--nested">
                <div className="client-exercise__head">
                  <span className="client-exercise__num">{i + 1}</span>
                  <div>
                    <h3>{ex.name || 'Ejercicio'}</h3>
                    {ex.tag && (
                      <span className="tag-badge">{TAG_LABELS[ex.tag] ?? ex.tag}</span>
                    )}
                  </div>
                </div>
                {ex.mediaUrl && <MediaPlayer url={ex.mediaUrl} alt={ex.name} />}
                <div className="client-exercise__stats">
                  {ex.sets && (
                    <span className="stat-chip">
                      <span className="stat-chip__label">Series</span>
                      <span className="stat-chip__value">{ex.sets}</span>
                    </span>
                  )}
                  {ex.reps && (
                    <span className="stat-chip">
                      <span className="stat-chip__label">Reps</span>
                      <span className="stat-chip__value">{ex.reps}</span>
                    </span>
                  )}
                  {formatRest(ex) && (
                    <span className="stat-chip">
                      <span className="stat-chip__label">Descanso entre series</span>
                      <span className="stat-chip__value">{formatRest(ex)}</span>
                    </span>
                  )}
                </div>
                {ex.notes && <p className="client-exercise__notes">{ex.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nutrition-section card">
        <div className="section-head">
          <p className="section-title">Alimentación</p>
          <h2>{DAY_NAMES[selectedDay]}</h2>
        </div>
        {!nutritionLoaded ? (
          <div className="section-skeleton" aria-label="Cargando alimentación">
            <span className="skeleton section-skeleton__line" />
            <span className="skeleton section-skeleton__block" />
          </div>
        ) : !hasNutrition ? (
          <div className="empty-state">
            <span className="empty-mark empty-mark--teal" aria-hidden />
            <p className="empty-state__title">Sin plan de nutrición</p>
            <p className="empty-state__text">
              Tu plan de alimentación aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            {nutrition!.planName && <p className="plan-title">{nutrition!.planName}</p>}
            {(nutrition!.objective || nutrition!.dietType) && (
              <p className="plan-meta">
                {[nutrition!.objective, nutrition!.dietType].filter(Boolean).join(' · ')}
              </p>
            )}
            {nutrition!.calories && (
              <p className="plan-calories">
                <strong>{nutrition!.calories}</strong>
                <span> calorías</span>
              </p>
            )}
            {nutrition!.meals.map((meal) => (
              <div key={meal.id} className="client-meal card card--nested">
                <h3>{meal.mealName}</h3>
                {meal.foods.map((food) => (
                  <div key={food.id} className="client-food">
                    {food.photoUrl && (
                      <MediaPlayer url={food.photoUrl} alt={food.name} compact />
                    )}
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
        <FeedbackForm clientId={clientId} clientName={clientName} />
        <p>Fit 21 · María Rosa Pérez · Todos los derechos reservados · 2026</p>
        <p>
          Dudas vía WhatsApp{' '}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            811 075 1529
          </a>
        </p>
      </footer>
    </div>
  );
}
