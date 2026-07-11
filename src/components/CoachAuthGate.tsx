import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isCoachEmailAllowed } from '../lib/coachAllowlist';
import { Logo } from './Logo';
import './CoachAuthGate.css';

interface CoachAuthGateProps {
  onSuccess: () => void;
}

export function useCoachAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  const emailOk = isCoachEmailAllowed(user?.email);
  return { user, ready, isCoach: Boolean(user) && emailOk };
}

export async function coachLogout() {
  if (!auth) return;
  await signOut(auth);
}

export function CoachAuthGate({ onSuccess }: CoachAuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase no está configurado');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!isCoachEmailAllowed(cred.user.email)) {
        await signOut(auth);
        setError('Este correo no está autorizado como coach. Revisa VITE_COACH_EMAILS.');
        setPassword('');
        return;
      }
      onSuccess();
    } catch {
      setError('Correo o contraseña incorrectos');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-gate">
      <form className="pin-gate__card card" onSubmit={handleSubmit}>
        <Logo size="md" />
        <h2>Acceso coach</h2>
        <p>Inicia sesión para administrar clientas y la biblioteca</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          autoComplete="username"
          autoFocus
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          required
        />
        {error && <p className="pin-gate__error">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
