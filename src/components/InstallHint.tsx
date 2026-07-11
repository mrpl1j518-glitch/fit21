import { useEffect, useState } from 'react';
import {
  dismissInstallHint,
  getInstallHintKind,
  INSTALL_HINT_COPY,
  type InstallHintKind,
} from '../lib/installHint';
import './InstallHint.css';

export function InstallHint() {
  const [kind, setKind] = useState<InstallHintKind>(null);

  useEffect(() => {
    setKind(getInstallHintKind());
  }, []);

  if (!kind) return null;

  const copy = INSTALL_HINT_COPY[kind];

  const handleDismiss = () => {
    dismissInstallHint();
    setKind(null);
  };

  return (
    <aside className="install-hint" role="note" aria-label="Cómo instalar FIT21">
      <div className="install-hint__content">
        <p className="install-hint__title">{copy.title}</p>
        <p className="install-hint__body">{copy.body}</p>
      </div>
      <button
        type="button"
        className="install-hint__close"
        onClick={handleDismiss}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </aside>
  );
}
