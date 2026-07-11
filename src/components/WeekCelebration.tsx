import { useEffect } from 'react';
import './WeekCelebration.css';

interface WeekCelebrationProps {
  milestone: number;
  onDone: () => void;
}

function celebrationTitle(milestone: number): string {
  switch (milestone) {
    case 7:
      return 'Alcanzaste 7 días completados';
    case 14:
      return 'Lograste 14 días completos';
    case 21:
      return 'Lograste 21 días del Plan';
    case 28:
      return 'Felicidades completaste 4 semanas!';
    default:
      return `¡${milestone} días de avance!`;
  }
}

export function WeekCelebration({ milestone, onDone }: WeekCelebrationProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="week-celebration" role="status" aria-live="polite">
      <div className="week-celebration__card">
        <span className="week-celebration__emoji" aria-hidden>
          {milestone >= 28 ? '🏆' : '✨'}
        </span>
        <p className="week-celebration__title">{celebrationTitle(milestone)}</p>
      </div>
    </div>
  );
}
