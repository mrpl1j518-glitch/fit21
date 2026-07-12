import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ClientHelpSheet.css';

interface ClientHelpSheetProps {
  open: boolean;
  onClose: () => void;
}

const HELP_ITEMS = [
  {
    title: 'Días de la semana',
    body: 'Cambia entre lun–dom para ver la rutina y la alimentación de cada día. El día de hoy aparece resaltado.',
  },
  {
    title: 'Tu avance',
    body: 'Los puntos muestran cuántos días has marcado en tu ciclo de 28 y en esta semana.',
  },
  {
    title: 'Completar el día',
    body: 'Marca la casilla cuando termines tu rutina. Eso suma al contador del ciclo (solo dentro de los 28 días activos).',
  },
  {
    title: 'Tu rutina y alimentación',
    body: 'Aquí ves los ejercicios y comidas que tu coach te asignó para el día seleccionado.',
  },
] as const;

export function ClientHelpSheet({ open, onClose }: ClientHelpSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="client-help" role="presentation">
      <button
        type="button"
        className="client-help__backdrop"
        aria-label="Cerrar ayuda"
        onClick={onClose}
      />
      <div
        className="client-help__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="client-help__head">
          <h2 id={titleId}>Cómo usar tu plan</h2>
          <button
            ref={closeRef}
            type="button"
            className="client-help__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <ul className="client-help__list">
          {HELP_ITEMS.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
