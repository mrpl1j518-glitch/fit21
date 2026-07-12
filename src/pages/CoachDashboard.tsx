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
  subscribeClientCoachOverview,
  subscribeFeedback,
  type ClientPlanMeta,
} from '../lib/firestore';
import { ClientOverviewPanel } from '../components/ClientOverviewPanel';
import { initials, CYCLE_DAYS, type Client, type ClientFeedback, type ClientCoachOverview } from '../types';
import { getClientPlanUrl } from '../lib/clientSlug';
import { isCyclePeriodEnded } from '../lib/dates';
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
  const [overviewByClient, setOverviewByClient] = useState<Record<string, ClientCoachOverview>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [feedback, setFeedback] = useState<(ClientFeedback & { id: string })[]>([]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [addError, setAddError] = useState('');

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  const latestPlanEdit = (meta?: ClientPlanMeta) => {
    if (!meta) return null;
    const dates = [meta.routineUpdatedAt, meta.nutritionUpdatedAt].filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  };

  const feedbackStats = useMemo(() => {
    if (feedback.length === 0) return { count: 0, average: 0 };
    const sum = feedback.reduce((acc, item) => acc + item.rating, 0);
    return { count: feedback.length, average: sum / feedback.length };
  }, [feedback]);

  const averageRatingLabel =
    feedbackStats.count > 0 ? `${feedbackStats.average.toFixed(1)} / 5` : '—';

  const ratingLabel = (rating: number) => `${rating}/5`;

  const clientIds = Object.keys(clients);

  useEffect(() => {
    return subscribeClients(setClients);
  }, []);

  useEffect(() => {
    return subscribeFeedback(setFeedback);
  }, []);

  useEffect(() => {
    const unsubs = clientIds.map((id) =>
      subscribeClientPlanMeta(id, (meta) => {
        setPlanMetaByClient((prev) => ({ ...prev, [id]: meta }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [clientIds.join(',')]);

  useEffect(() => {
    const unsubs = clientIds.map((id) =>
      subscribeClientCoachOverview(id, (overview) => {
        setOverviewByClient((prev) => ({ ...prev, [id]: overview }));
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
    setAddError('');
    try {
      const id = generateClientId();
      await createClient(id, name);
      setNewName('');
      setShowAdd(false);
    } catch (e) {
      setAddError(
        e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'permission-denied'
          ? 'Firebase bloqueó el guardado. Publica las reglas de Firestore y vuelve a intentar.'
          : `No se pudo guardar: ${e instanceof Error ? e.message : 'error'}`
      );
    }
  };

  const handleCancelAdd = () => {
    setShowAdd(false);
    setNewName('');
    setAddError('');
  };

  const handleCopyLink = async (clientId: string, name: string) => {
    const url = getClientPlanUrl(window.location.origin, clientId, name);
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
    if (!confirm(`¿Eliminar a ${name}? Se borrará su perfil del panel; rutinas y planes se conservan en Firestore para respaldo.`)) return;
    await deleteClient(clientId);
  };

  return (
    <div className="coach-page">
      <header className="coach-header-card card">
        <div className="coach-header">
          <Logo size="sm" />
          <div className="coach-header__text">
            <p className="section-label section-label--soft">Panel coach</p>
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
          className="btn btn--cta btn--block coach-register"
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          + Registrar cliente
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
          <span>Opiniones de clientas</span>
          <span className="coach-feedback__chevron" aria-hidden />
        </button>

        <div className="coach-feedback__summary">
          <div className="coach-feedback__stat">
            <span className="coach-feedback__stat-value">{feedbackStats.count}</span>
            <span className="coach-feedback__stat-label">mensajes</span>
          </div>
          <div className="coach-feedback__stat">
            <span className="coach-feedback__stat-value coach-feedback__stat-value--rating">
              {averageRatingLabel}
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
                    <span className="coach-feedback__rating" aria-label={`Valoración ${item.rating} de 5`}>
                      {ratingLabel(item.rating)}
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
          <p className="section-title">Registrar cliente</p>
          {addError && <p className="form-error coach-add__error">{addError}</p>}
          <div className="coach-add__row">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button className="btn btn--primary" onClick={handleAdd}>
              Agregar
            </button>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={handleCancelAdd}>
            Cancelar
          </button>
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
          <span className="empty-mark" aria-hidden />
          <h2>Registra a tu primer cliente</h2>
          <p>Asigna su rutina, plan de alimentación y envíale su link personal por WhatsApp.</p>
          <button className="btn btn--cta btn--block" onClick={() => setShowAdd(true)}>
            Registrar primer cliente
          </button>
        </section>
      ) : (
        <ul className="client-list">
          {rows.map((client) => {
            const overview = overviewByClient[client.id];
            const lastEdit = latestPlanEdit(client.planMeta);
            const inactive =
              overview &&
              overview.cycleStartedAt &&
              overview.progressCount === 0 &&
              overview.cycleDay > 7;
            const cycleCompleted =
              overview?.cycleStartedAt &&
              (overview.progressCount >= CYCLE_DAYS ||
                isCyclePeriodEnded(overview.cycleStartedAt, CYCLE_DAYS));

            return (
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
                      {client.createdAt && (
                        <p className="client-item__registered">
                          Registrada el {formatShortDate(client.createdAt)}
                        </p>
                      )}
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
                      {overview && !overview.cycleStartedAt && (
                        <span className="status-badge status-badge--warn">Ciclo no iniciado</span>
                      )}
                      {cycleCompleted && (
                        <span className="status-badge status-badge--ok">Ciclo completado</span>
                      )}
                      {inactive && (
                        <span className="status-badge status-badge--warn">Sin avance aún</span>
                      )}
                      {lastEdit && (
                        <p className="client-item__last-edit">
                          Última edición del plan: {formatShortDate(lastEdit)}
                        </p>
                      )}
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
                      <ClientOverviewPanel
                        clientId={client.id}
                        overview={overviewByClient[client.id]}
                      />
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
                      className={`btn btn--small btn--cta ${copiedId === client.id ? 'btn--copied' : ''}`}
                      onClick={() => handleCopyLink(client.id, client.name)}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
