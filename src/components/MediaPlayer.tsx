import { getMediaType, getYouTubeEmbedUrl } from '../lib/media';
import { normalizeMediaUrl } from '../lib/mediaUrl';
import './MediaPlayer.css';

interface MediaPlayerProps {
  url?: string;
  alt?: string;
  compact?: boolean;
}

export function MediaPlayer({ url, alt = 'Media', compact }: MediaPlayerProps) {
  const resolved = url ? normalizeMediaUrl(url) : '';
  const type = getMediaType(resolved);

  if (type === 'empty') {
    return (
      <div className={`media-placeholder ${compact ? 'media-placeholder--compact' : ''}`}>
        <span>Sin imagen/video</span>
      </div>
    );
  }

  if (type === 'youtube') {
    const embed = getYouTubeEmbedUrl(resolved);
    if (!embed) {
      return (
        <div className={`media-placeholder ${compact ? 'media-placeholder--compact' : ''}`}>
          <span>Link de YouTube inválido</span>
        </div>
      );
    }
    return (
      <div className={`media-youtube ${compact ? 'media-youtube--compact' : ''}`}>
        <iframe
          src={embed}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video className={`media-video ${compact ? 'media-video--compact' : ''}`} controls playsInline>
        <source src={resolved} />
      </video>
    );
  }

  return (
    <img
      className={`media-image ${compact ? 'media-image--compact' : ''}`}
      src={resolved}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
