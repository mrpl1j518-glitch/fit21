import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PlanMeta } from '../components/PlanMeta';
import { coachLogout } from '../components/CoachAuthGate';
import {
  subscribeClients,
  createClient,
  updateClientName,
  deleteClient,
  generateClientId,
  subscribeClientPlanMeta,
  subscribeFeedback,
  type ClientPlanMeta,
} from '../lib/firestore';
import { initials, type Client, type ClientFeedback } from '../types';
import './CoachDashboard.css';

interface ClientRow extends Client {
  id: string;
  planMeta?: ClientPlanMeta;
}

export function CoachDashboard() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [planMetaByClient, setPlanMetaByClient] = useState<Record<string, ClientPlanMeta>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [feedback, setFeedback] = useState<(ClientFeedback & { id: string })[]>([]);
  const [showFeedback, setShowFeedback] = useState(true);

  const feedbackStats = useMemo(() => {
    if (feedback.length === 0) return { count: 0, average: 0 };
    const sum = feedback.reduce((acc, item) => acc + item.rating, 0);
    return { count: feedback.length, average: sum / feedback.length };
  }, [feedback]);

  const averageEmoji =
    feedbackStats.count > 0
      ? ['😞', '😐', '🙂', '😊', '🤩'][Math.min(4, Math.max(0, Math.round(feedbackStats.average) - 1))]
      : '—';

  useEffect(() => {
    return subscribeClients(setClients);
  }, []);

  useEffect(() => {
    return subscribeFeedback(setFeedback);
  }, []);

  const clientIds = Object.keys(clients);

  useEffect(() => {
    const unsubs = clientIds.map((id) =>
      subscribeClientPlanMeta(id, (meta) => {
        setPlanMetaByClient((prev) => ({ ...prev, [id]: meta }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [clientIds.join(',')]);

  const rows: ClientRow[] = useMemo(() => {
    return Object.entries(clients)
      .map(([id, client]) => ({
        id,
        ...client,
        planMeta: planMetaByClient[id],
      }))
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [clients, search, planMetaByClient]);

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
      <header className="coach-header-card card">
        <div className="coach-header">
          <Logo size="sm" />
          <div className="coach-header__text">
            <p className="section-label">Panel coach</p>
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
        </div>
      </header>

      <div className="coach-actions">
        <button
          className="btn btn--pink btn--block coach-register"
          onClick={() => setShowAdd((v) => !v)}
        >
          + Registrar clienta
        </button>

        <Link to="/coach/biblioteca" className="btn btn--ghost btn--block coach-library-link">
          Biblioteca de ejercicios
        </Link>
      </div>

      <section className="coach-feedback card">
        <button
          type="button"
          className="coach-feedback__toggle"
          onClick={() => setShowFeedback((v) => !v)}
          aria-expanded={showFeedback}
        >
          <span>💬 Opiniones de clientas</span>
          <span aria-hidden>{showFeedback ? '▾' : '▸'}</span>
        </button>

        <div className="coach-feedback__summary">
          <div className="coach-feedback__stat">
            <span className="coach-feedback__stat-value">{feedbackStats.count}</span>
            <span className="coach-feedback__stat-label">mensajes</span>
          </div>
          <div className="coach-feedback__stat">
            <span className="coach-feedback__stat-value coach-feedback__stat-value--emoji" aria-hidden>
              {averageEmoji}
            </span>
            <span className="coach-feedback__stat-label">
              {feedbackStats.count > 0
                ? `promedio ${feedbackStats.average.toFixed(1)} / 5`
                : 'sin valoraciones'}
            </span>
          </div>
        </div>

        {showFeedback && (
          feedback.length === 0 ? (
            <p className="coach-feedback__empty">Aún no hay opiniones. Las clientas pueden enviarlas desde su link personal.</p>
          ) : (
            <ul className="coach-feedback__list">
              {feedback.slice(0, 15).map((item) => (
                <li key={item.id} className="coach-feedback__item">
                  <div className="coach-feedback__meta">
                    <strong>{item.clientName}</strong>
                    <span aria-label={`Valoración ${item.rating} de 5`}>
                      {['😞', '😐', '🙂', '😊', '🤩'][item.rating - 1]}
                    </span>
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </time>
                  </div>
                  {item.message ? (
                    <p>{item.message}</p>
                  ) : (
                    <p className="coach-feedback__no-msg">Sin mensaje escrito</p>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {showAdd && (
        <section className="coach-add card">
          <p className="section-label">Nueva clienta</p>
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
            aria-label="Buscar clienta"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <section className="empty-card card">
          <span className="empty-card__icon" aria-hidden>✨</span>
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
                      <span
                        className={`status-badge ${
                          client.planMeta?.hasRoutine || client.planMeta?.hasNutrition ? 'status-badge--ok' : ''
                        }`}
                      >
                        {client.planMeta?.hasRoutine
                          ? client.planMeta?.hasNutrition
                            ? 'Rutina y plan asignados'
                            : 'Rutina asignada'
                          : client.planMeta?.hasNutrition
                            ? 'Plan alimenticio asignado'
                            : 'Sin rutina'}
                      </span>
                      {client.planMeta?.hasRoutine && (
                        <PlanMeta
                          label="Rutina"
                          gender="f"
                          createdAt={client.planMeta.routineCreatedAt ?? undefined}
                          updatedAt={client.planMeta.routineUpdatedAt ?? undefined}
                          hasContent
                        />
                      )}
                      {client.planMeta?.hasNutrition && (
                        <PlanMeta
                          label="Plan alimenticio"
                          gender="m"
                          createdAt={client.planMeta.nutritionCreatedAt ?? undefined}
                          updatedAt={client.planMeta.nutritionUpdatedAt ?? undefined}
                          hasContent
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              {editingId !== client.id && (
                <div className="client-item__actions">
                  <div className="client-item__actions-primary">
                    <Link to={`/coach/client/${client.id}`} className="btn btn--small btn--primary">
                      Editar
                    </Link>
                    <button
                      className={`btn btn--small btn--teal ${copiedId === client.id ? 'btn--copied' : ''}`}
                      onClick={() => handleCopyLink(client.id)}
                    >
                      {copiedId === client.id ? '¡Copiado!' : 'Copiar link'}
                    </button>
                  </div>
                  <div className="client-item__actions-secondary">
                    <button
                      type="button"
                      className="btn btn--text"
                      onClick={() => {
                        setEditingId(client.id);
                        setEditName(client.name);
                      }}
                    >
                      Renombrar
                    </button>
                    <span className="client-item__actions-divider" aria-hidden>·</span>
                    <button
                      type="button"
                      className="btn btn--text btn--text-danger"
                      onClick={() => handleDelete(client.id, client.name)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
