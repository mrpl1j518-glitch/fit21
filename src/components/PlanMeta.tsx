import { useEffect, useState } from 'react';
import { formatDayMonthYear, formatModifiedRelative } from '../lib/dates';
import './PlanMeta.css';

interface PlanMetaProps {
  label: string;
  gender?: 'f' | 'm';
  createdAt?: string;
  updatedAt?: string;
  hasContent?: boolean;
}

export function PlanMeta({
  label,
  gender = 'f',
  createdAt,
  updatedAt,
  hasContent = true,
}: PlanMetaProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!hasContent && !createdAt && !updatedAt) return null;

  const createdLabel = gender === 'f' ? 'creada' : 'creado';
  const modifiedLabel = gender === 'f' ? 'Modificada' : 'Modificado';
  const modifiedAt = updatedAt ?? createdAt;

  return (
    <p className="plan-meta">
      {createdAt && (
        <span>
          {label} {createdLabel} el {formatDayMonthYear(createdAt)}
        </span>
      )}
      {modifiedAt && (
        <span>
          {createdAt ? ' · ' : ''}
          {modifiedLabel} {formatModifiedRelative(modifiedAt, now)}
        </span>
      )}
    </p>
  );
}
