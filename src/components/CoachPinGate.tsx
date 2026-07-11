import { useState } from 'react';
import './CoachPinGate.css';

const PIN_STORAGE_KEY = 'fit21_coach_pin_ok';

export function isCoachAuthenticated(): boolean {
  return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
}

export function clearCoachAuth(): void {
  localStorage.removeItem(PIN_STORAGE_KEY);
}

interface CoachPinGateProps {
  onSuccess: () => void;
}

export function CoachPinGate({ onSuccess }: CoachPinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_COACH_PIN ?? '2121';
    if (pin === expected) {
      localStorage.setItem(PIN_STORAGE_KEY, 'true');
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto');
      setPin('');
    }
  };

  return (
    <div className="pin-gate">
      <form className="pin-gate__card" onSubmit={handleSubmit}>
        <h2>Acceso coach</h2>
        <p>Ingresa tu PIN para administrar clientas</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          autoComplete="off"
          autoFocus
        />
        {error && <p className="pin-gate__error">{error}</p>}
        <button type="submit" className="btn btn--primary">
          Entrar
        </button>
      </form>
    </div>
  );
}
