import { useEffect } from 'react';
import './WeekCelebration.css';

interface WeekCelebrationProps {
  milestone: number;
  onDone: () => void;
}

function celebrationTitle(milestone: number): string {
  switch (milestone) {
    case 1:
      return '¡Primer día completado!';
    case 7:
      return '¡Alcanzaste 7 días completados!';
    case 14:
      return '¡Lograste 14 días completos!';
    case 21:
      return '¡Lograste 21 días del plan!';
    case 28:
      return '¡Felicidades! Completaste tu ciclo de 4 semanas';
    default:
      return `¡${milestone} días de avance!`;
  }
}

function celebrationEmoji(milestone: number): string {
  if (milestone >= 28) return '🏆';
  if (milestone === 1) return '🌱';
  return '✨';
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
          {celebrationEmoji(milestone)}
        </span>
        <p className="week-celebration__title">{celebrationTitle(milestone)}</p>
      </div>
    </div>
  );
}
