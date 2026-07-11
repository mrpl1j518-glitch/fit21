import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { coachLogout } from '../components/CoachAuthGate';
import {
  subscribeClients,
  createClient,
  updateClientName,
  deleteClient,
  generateClientId,
  subscribeAllRoutinesForClient,
} from '../lib/firestore';
import { initials, type Client } from '../types';
import './CoachDashboard.css';

interface ClientRow extends Client {
  id: string;
  hasRoutine?: boolean;
}

export function CoachDashboard() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [routineStatus, setRoutineStatus] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    return subscribeClients(setClients);
  }, []);

  const clientIds = Object.keys(clients);

  useEffect(() => {
    const unsubs = clientIds.map((id) =>
      subscribeAllRoutinesForClient(id, (hasAny) => {
        setRoutineStatus((prev) => ({ ...prev, [id]: hasAny }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [clientIds.join(',')]);

  const rows: ClientRow[] = useMemo(() => {
    return Object.entries(clients)
      .map(([id, client]) => ({
        id,
        ...client,
        hasRoutine: routineStatus[id],
      }))
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [clients, search, routineStatus]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const id = generateClientId();
      await createClient(id, name);
      setNewName('');
      setShowAdd(false);
    } catch (e) {
      alert(
        e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'permission-denied'
          ? 'Firebase bloqueó el guardado. Publica las Rules de Firestore (allow read, write: if true) y vuelve a intentar.'
          : `No se pudo guardar: ${e instanceof Error ? e.message : 'error'}`
      );
    }
  };

  const handleCopyLink = async (clientId: string) => {
    const url = `${window.location.origin}/plan/${clientId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(clientId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRename = async (clientId: string) => {
    const name = editName.trim();
    if (!name) return;
    await updateClientName(clientId, name);
    setEditingId(null);
  };

  const handleDelete = async (clientId: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Se borrará su perfil (rutinas y plan quedan en historial).`)) return;
    await deleteClient(clientId);
  };

  return (
    <div className="coach-page">
      <header className="coach-header">
        <Logo size="sm" />
        <div className="coach-header__text">
          <h1>Clientas</h1>
          <p className="coach-header__sub">Rutinas y planes · FIT21</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--small coach-logout"
          onClick={() => coachLogout()}
        >
          Salir
        </button>
      </header>

      <button
        className="btn btn--pink btn--block coach-register"
        onClick={() => setShowAdd((v) => !v)}
      >
        + Registrar clienta
      </button>

      <Link to="/coach/biblioteca" className="btn btn--ghost btn--block coach-library-link">
        Biblioteca de ejercicios
      </Link>

      {showAdd && (
        <section className="coach-add card">
          <h2>Nueva clienta</h2>
          <div className="coach-add__row">
            <input
              type="text"
              placeholder="Nombre de la clienta"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button className="btn btn--primary" onClick={handleAdd}>
              Agregar
            </button>
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <div className="coach-search-wrap">
          <input
            type="search"
            placeholder="Buscar clienta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="coach-search"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <section className="empty-card card">
          <div className="empty-card__ring" aria-hidden />
          <h2>Registra a tu primera clienta</h2>
          <p>Asigna su rutina, plan de alimentación y envíale su link personal por WhatsApp.</p>
          <button className="btn btn--pink btn--block" onClick={() => setShowAdd(true)}>
            Registrar primera clienta
          </button>
        </section>
      ) : (
        <ul className="client-list">
          {rows.map((client) => (
            <li key={client.id} className="client-item card">
              <div className="client-item__main">
                <span className="client-avatar" aria-hidden>
                  {initials(client.name) || '?'}
                </span>
                <div className="client-item__info">
                  {editingId === client.id ? (
                    <div className="client-item__edit">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <button className="btn btn--small btn--primary" onClick={() => handleRename(client.id)}>
                        Guardar
                      </button>
                      <button className="btn btn--small btn--ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong>{client.name}</strong>
                      <span className={`status-badge ${client.hasRoutine ? 'status-badge--ok' : ''}`}>
                        {client.hasRoutine ? 'Rutina asignada' : 'Sin rutina'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="client-item__actions">
                <button
                  className="btn btn--small btn--teal"
                  onClick={() => handleCopyLink(client.id)}
                >
                  {copiedId === client.id ? '¡Copiado!' : 'Copiar link'}
                </button>
                <Link to={`/coach/client/${client.id}`} className="btn btn--small btn--primary">
                  Editar
                </Link>
                <button
                  className="btn btn--small btn--ghost"
                  onClick={() => {
                    setEditingId(client.id);
                    setEditName(client.name);
                  }}
                >
                  Renombrar
                </button>
                <button
                  className="btn btn--small btn--danger"
                  onClick={() => handleDelete(client.id, client.name)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
