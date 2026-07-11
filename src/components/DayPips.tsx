import './DayPips.css';

interface DayPipsProps {
  count: number;
  total?: number;
}

export function DayPips({ count, total = 21 }: DayPipsProps) {
  const filled = Math.min(count, total);

  return (
    <div className="day-pips" aria-label={`${filled} de ${total} días completados`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`day-pip ${i < filled ? 'day-pip--filled' : ''} ${
            i < filled && i % 2 === 0 ? 'day-pip--teal' : ''
          } ${i < filled && i % 2 === 1 ? 'day-pip--pink' : ''}`}
        />
      ))}
    </div>
  );
}
