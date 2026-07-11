import { useState } from 'react';
import { submitClientFeedback } from '../lib/firestore';
import './FeedbackForm.css';

const RATINGS = [
  { value: 1, emoji: '😞', label: 'Muy mal' },
  { value: 2, emoji: '😐', label: 'Regular' },
  { value: 3, emoji: '🙂', label: 'Bien' },
  { value: 4, emoji: '😊', label: 'Muy bien' },
  { value: 5, emoji: '🤩', label: 'Excelente' },
] as const;

interface FeedbackFormProps {
  clientId: string;
  clientName: string;
}

export function FeedbackForm({ clientId, clientName }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      setError('Elige cómo te sientes con la app.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitClientFeedback(clientId, clientName || 'Clienta', rating, message);
      setSent(true);
      setRating(null);
      setMessage('');
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2500);
    } catch {
      setError('No se pudo enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="feedback-form">
      <button
        type="button"
        className="feedback-form__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span aria-hidden>💬</span>
        {open ? 'Cerrar' : 'Déjanos tu opinión'}
      </button>

      {open && (
        <div className="feedback-form__panel card card--nested">
          {sent ? (
            <p className="feedback-form__thanks">¡Gracias! Tu coach recibirá tu mensaje.</p>
          ) : (
            <>
              <p className="feedback-form__label">¿Cómo te sientes con FIT21?</p>
              <div className="feedback-form__ratings" role="radiogroup" aria-label="Valoración">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={rating === r.value}
                    aria-label={r.label}
                    className={`feedback-form__rating ${rating === r.value ? 'feedback-form__rating--active' : ''}`}
                    onClick={() => setRating(r.value)}
                  >
                    <span aria-hidden>{r.emoji}</span>
                  </button>
                ))}
              </div>
              <label className="feedback-form__message-label">
                Mensaje (opcional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos qué te gusta o qué mejorarías..."
                  rows={3}
                  maxLength={500}
                />
              </label>
              {error && <p className="feedback-form__error">{error}</p>}
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={handleSubmit}
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'Enviar opinión'}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
