import { DAY_SHORT } from '../types';
import { dateKeyForDayIndex } from '../lib/dates';
import './DayPips.css';

interface WeekPipsProps {
  progress: Record<string, boolean>;
}

export function WeekPips({ progress }: WeekPipsProps) {
  const filled = DAY_SHORT.filter((_, i) => Boolean(progress[dateKeyForDayIndex(i)])).length;

  return (
    <div className="week-pips" aria-label={`${filled} de 7 días completados esta semana`}>
      <p className="week-pips__label">Esta semana</p>
      <div className="day-pips">
        {DAY_SHORT.map((name, i) => {
          const filledDay = Boolean(progress[dateKeyForDayIndex(i)]);
          return (
            <span
              key={name}
              className={`day-pip ${filledDay ? 'day-pip--filled day-pip--teal' : ''}`}
              title={name}
            />
          );
        })}
      </div>
    </div>
  );
}
