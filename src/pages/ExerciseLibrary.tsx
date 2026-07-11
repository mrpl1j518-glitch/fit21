import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaPlayer } from '../components/MediaPlayer';
import {
  subscribeLibraryExercises,
  saveLibraryExercise,
  deleteLibraryExercise,
} from '../lib/firestore';
import type { LibraryExercise } from '../types';
import './ExerciseLibrary.css';

/**
 * Pantalla de carga de GIFs (setup).
 * La usa quien hostea los archivos (tú), no Claudia al armar rutinas.
 */
export function ExerciseLibrary() {
  const [library, setLibrary] = useState<Record<string, LibraryExercise>>({});
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeLibraryExercises(setLibrary);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(library)
      .map(([id, item]) => ({ id, ...item }))
      .filter((item) => !q || item.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [library, search]);

  const resetForm = () => {
    setName('');
    setMediaUrl('');
    setMuscleGroup('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !mediaUrl.trim()) return;
    setSaving(true);
    try {
      await saveLibraryExercise(editingId, {
        name,
        mediaUrl,
        muscleGroup,
        createdAt: editingId ? library[editingId]?.createdAt : undefined,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id: string) => {
    const item = library[id];
    setEditingId(id);
    setName(item.name);
    setMediaUrl(item.mediaUrl);
    setMuscleGroup(item.muscleGroup ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, exerciseName: string) => {
    if (!confirm(`¿Eliminar “${exerciseName}” de la biblioteca?`)) return;
    await deleteLibraryExercise(id);
    if (editingId === id) resetForm();
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <Link to="/coach" className="back-link">← Volver</Link>
        <h1>Biblioteca de ejercicios</h1>
        <p className="library-header__hint">
          Carga aquí los GIFs una sola vez (Gym Visual). Claudia solo los elige al armar la rutina — sin pegar links.
        </p>
      </header>

      <section className="card library-form">
        <h2>{editingId ? 'Editar ejercicio' : 'Agregar a la biblioteca'}</h2>
        <label>
          Nombre del ejercicio
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sentadilla goblet"
          />
        </label>
        <label>
          Grupo muscular (opcional)
          <input
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            placeholder="Ej. Glúteo, Cuádriceps..."
          />
        </label>
        <label>
          Link del GIF
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://...archivo.gif"
          />
        </label>
        {mediaUrl && <MediaPlayer url={mediaUrl} alt={name || 'Preview'} compact />}
        <div className="library-form__actions">
          <button type="button" className="btn btn--pink" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar en biblioteca'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <div className="library-toolbar">
        <h2>{rows.length} ejercicios</h2>
        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <p className="empty-hint">Aún no hay ejercicios. Sube el primer GIF arriba.</p>
      ) : (
        <ul className="library-list">
          {rows.map((item) => (
            <li key={item.id} className="library-item card">
              <MediaPlayer url={item.mediaUrl} alt={item.name} compact />
              <div className="library-item__info">
                <strong>{item.name}</strong>
                {item.muscleGroup && <span>{item.muscleGroup}</span>}
                <div className="library-item__actions">
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => handleEdit(item.id)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn--small btn--danger"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
