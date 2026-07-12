import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CoachAuthGate, useCoachAuth } from './components/CoachAuthGate';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachClientEdit } from './pages/CoachClientEdit';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { ClientPlan } from './pages/ClientPlan';
import { Logo } from './components/Logo';
import { isFirebaseConfigured } from './lib/firebase';
import {
  getRememberedClientId,
  getCachedClientName,
  isStandaloneDisplay,
} from './lib/clientPlanStorage';
import { buildClientPlanPath } from './lib/clientSlug';
import './App.css';

function CoachLayout() {
  const { ready, isCoach } = useCoachAuth();
  const [loginTick, setLoginTick] = useState(0);

  if (!ready) {
    return (
      <div className="pin-gate">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isCoach) {
    return <CoachAuthGate onSuccess={() => setLoginTick((n) => n + 1)} key={loginTick} />;
  }

  return (
    <Routes>
      <Route index element={<CoachDashboard />} />
      <Route path="client/:clientId" element={<CoachClientEdit />} />
      <Route path="biblioteca" element={<ExerciseLibrary />} />
    </Routes>
  );
}

function Home() {
  const remembered = getRememberedClientId();
  const rememberedName = remembered ? getCachedClientName(remembered) : null;

  if (isStandaloneDisplay() && remembered) {
    const name = rememberedName ?? 'clienta';
    return <Navigate to={buildClientPlanPath(remembered, name)} replace />;
  }

  const standaloneWithoutPlan = isStandaloneDisplay() && !remembered;

  return (
    <div className="home">
      <Logo size="lg" showTagline />
      {remembered && !isStandaloneDisplay() && (
        <Link
          to={buildClientPlanPath(remembered, rememberedName ?? 'clienta')}
          className="home__continue btn btn--primary btn--block"
        >
          Continuar mi plan{rememberedName ? ` · ${rememberedName}` : ''}
        </Link>
      )}
      {standaloneWithoutPlan ? (
        <>
          <p className="home__text">
            Abre el link personal que te envió tu coach (por WhatsApp) para ver tu plan.
          </p>
          <p className="home__hint">
            En iPhone: ábrelo en Safari, luego Compartir → Añadir a pantalla de inicio.
            Después de abrirlo una vez, esta app recordará tu acceso.
          </p>
        </>
      ) : (
        <p className="home__text">
          Tu rutina y plan de alimentación, siempre a la mano.
        </p>
      )}
      {/* Acceso coach discreto: las clientas no deben llegar aquí al instalar su plan */}
      <Link to="/coach" className="home__coach-link">
        Acceso coach
      </Link>
      {!isFirebaseConfigured && (
        <p className="home__warn">
          Firebase no configurado. Copia <code>.env.example</code> a <code>.env</code> y agrega tus credenciales.
        </p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coach/*" element={<CoachLayout />} />
        <Route path="/plan/:clientId" element={<ClientPlan />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
