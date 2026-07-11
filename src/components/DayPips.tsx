import './DayPips.css';
import { CYCLE_DAYS } from '../types';

interface DayPipsProps {
  count: number;
  total?: number;
}

export function DayPips({ count, total = CYCLE_DAYS }: DayPipsProps) {
  const filled = Math.min(count, total);

  return (
    <div className="day-pips" aria-label={`${filled} de ${total} días completados`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`day-pip ${i < filled ? 'day-pip--filled day-pip--teal' : ''}`}
        />
      ))}
    </div>
  );
}
