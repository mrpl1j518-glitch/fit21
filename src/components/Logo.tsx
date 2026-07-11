import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ size = 'md', showTagline = false }: LogoProps) {
  return (
    <div className={`fit21-logo fit21-logo--${size}`}>
      <img src="/fit21-logo.png" alt="FIT21" className="fit21-logo__img" />
      {showTagline && (
        <p className="fit21-logo__tagline">
          Constancia <span>que transforma</span>
        </p>
      )}
    </div>
  );
}
