import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CoachPinGate, isCoachAuthenticated } from './components/CoachPinGate';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachClientEdit } from './pages/CoachClientEdit';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { ClientPlan } from './pages/ClientPlan';
import { Logo } from './components/Logo';
import { isFirebaseConfigured } from './lib/firebase';
import './App.css';

function CoachLayout() {
  const [authed, setAuthed] = useState(isCoachAuthenticated());

  if (!authed) {
    return <CoachPinGate onSuccess={() => setAuthed(true)} />;
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
  return (
    <div className="home">
      <Logo size="lg" showTagline />
      <p className="home__text">
        Tu rutina y plan de alimentación, siempre a la mano.
      </p>
      <a href="/coach" className="btn btn--primary">
        Acceso coach
      </a>
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
