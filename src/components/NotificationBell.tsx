import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  subscribeClientNotifications,
  markNotificationsRead,
} from '../lib/firestore';
import type { ClientNotification } from '../types';
import './NotificationBell.css';

interface NotificationBellProps {
  clientId: string;
}

interface PanelPosition {
  top: number;
  right: number;
  width: number;
}

export function NotificationBell({ clientId }: NotificationBellProps) {
  const [messages, setMessages] = useState<ClientNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeClientNotifications(clientId, setMessages);
  }, [clientId]);

  const unread = messages.filter((m) => !m.read).length;

  const updatePanelPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth * 0.85);
    const right = Math.max(12, window.innerWidth - rect.right);

    setPanelPos({
      top: rect.bottom + 6,
      right,
      width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePanelPos();
    window.addEventListener('resize', updatePanelPos);
    window.addEventListener('scroll', updatePanelPos, true);
    return () => {
      window.removeEventListener('resize', updatePanelPos);
      window.removeEventListener('scroll', updatePanelPos, true);
    };
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await markNotificationsRead(clientId);
    }
  };

  const panel =
    open && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            className="notification-bell__panel notification-bell__panel--fixed"
            style={{
              top: panelPos.top,
              right: panelPos.right,
              width: panelPos.width,
            }}
            role="dialog"
            aria-label="Notificaciones"
          >
            <p className="notification-bell__head">Novedades de tu coach</p>
            {messages.length === 0 ? (
              <p className="notification-bell__empty">No hay novedades por ahora.</p>
            ) : (
              <ul className="notification-bell__list">
                {messages.map((m) => (
                  <li key={m.id} className={m.read ? '' : 'notification-bell__item--new'}>
                    <span>{m.text}</span>
                    <time dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="notification-bell__btn"
        onClick={handleToggle}
        aria-label={unread > 0 ? `${unread} notificaciones nuevas` : 'Notificaciones'}
        aria-expanded={open}
      >
        <svg className="notification-bell__icon" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-5V11a7 7 0 1 0-14 0v6l-2 2v1h18v-1l-2-2Z"
            fill="currentColor"
          />
        </svg>
        {unread > 0 && <span className="notification-bell__badge">{unread}</span>}
      </button>
      {panel}
    </div>
  );
}
