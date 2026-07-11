import { CYCLE_DAYS } from '../types';
import './CoachProgressChart.css';

interface CoachProgressChartProps {
  dailyCompletion: boolean[];
  progressCount: number;
  cycleDay: number;
}

export function CoachProgressChart({
  dailyCompletion,
  progressCount,
  cycleDay,
}: CoachProgressChartProps) {
  const days = dailyCompletion.length > 0 ? dailyCompletion : Array(CYCLE_DAYS).fill(false);

  return (
    <div className="coach-progress-chart">
      <div className="coach-progress-chart__head">
        <span className="coach-progress-chart__label">Avance del ciclo</span>
        <span className="coach-progress-chart__stat">
          {progressCount}/{CYCLE_DAYS} días · día {cycleDay}
        </span>
      </div>
      <div
        className="coach-progress-chart__grid"
        role="img"
        aria-label={`${progressCount} días completados de ${CYCLE_DAYS}`}
      >
        {days.map((complete, index) => (
          <span
            key={index}
            className={`coach-progress-chart__day ${
              complete ? 'coach-progress-chart__day--done' : ''
            } ${index + 1 === cycleDay ? 'coach-progress-chart__day--today' : ''}`}
            title={`Día ${index + 1}${complete ? ' · completado' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
