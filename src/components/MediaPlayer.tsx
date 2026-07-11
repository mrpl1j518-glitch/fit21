import { getMediaType, getYouTubeEmbedUrl } from '../lib/media';
import './MediaPlayer.css';

interface MediaPlayerProps {
  url?: string;
  alt?: string;
  compact?: boolean;
}

export function MediaPlayer({ url, alt = 'Media', compact }: MediaPlayerProps) {
  const type = getMediaType(url);

  if (type === 'empty') {
    return (
      <div className={`media-placeholder ${compact ? 'media-placeholder--compact' : ''}`}>
        <span>Sin imagen/video</span>
      </div>
    );
  }

  if (type === 'youtube') {
    const embed = getYouTubeEmbedUrl(url!);
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
        />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video className={`media-video ${compact ? 'media-video--compact' : ''}`} controls playsInline>
        <source src={url} />
      </video>
    );
  }

  return (
    <img
      className={`media-image ${compact ? 'media-image--compact' : ''}`}
      src={url}
      alt={alt}
      loading="lazy"
    />
  );
}
