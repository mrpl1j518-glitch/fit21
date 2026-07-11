import { useEffect, useMemo, useState } from 'react';
import { MediaPlayer } from './MediaPlayer';
import { subscribeLibraryExercises } from '../lib/firestore';
import type { LibraryExercise } from '../types';
import './ExercisePicker.css';

export interface PickedExercise {
  libraryExerciseId: string;
  name: string;
  mediaUrl: string;
}

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (items: PickedExercise[]) => void;
}

export function ExercisePicker({ open, onClose, onPick }: ExercisePickerProps) {
  const [library, setLibrary] = useState<Record<string, LibraryExercise>>({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    return subscribeLibraryExercises(setLibrary);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(new Set());
    }
  }, [open]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(library)
      .map(([id, item]) => ({ id, ...item }))
      .filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.muscleGroup ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [library, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const items: PickedExercise[] = [...selected].map((id) => {
      const item = library[id];
      return {
        libraryExerciseId: id,
        name: item.name,
        mediaUrl: item.mediaUrl,
      };
    });
    onPick(items);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true" aria-label="Elegir ejercicios">
      <div className="picker-sheet">
        <header className="picker-sheet__head">
          <h2>Elegir ejercicios</h2>
          <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <input
          type="search"
          className="picker-search"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {rows.length === 0 ? (
          <p className="picker-empty">
            {Object.keys(library).length === 0
              ? 'La biblioteca está vacía. Primero carga los GIFs en Biblioteca.'
              : 'No hay coincidencias.'}
          </p>
        ) : (
          <div className="picker-grid">
            {rows.map((item) => {
              const isOn = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`picker-card ${isOn ? 'picker-card--on' : ''}`}
                  onClick={() => toggle(item.id)}
                >
                  <MediaPlayer url={item.mediaUrl} alt={item.name} compact />
                  <strong>{item.name}</strong>
                  {item.muscleGroup && <span>{item.muscleGroup}</span>}
                  {isOn && <em className="picker-check">✓</em>}
                </button>
              );
            })}
          </div>
        )}

        <footer className="picker-sheet__foot">
          <button
            type="button"
            className="btn btn--pink btn--block"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Agregar {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </footer>
      </div>
    </div>
  );
}
