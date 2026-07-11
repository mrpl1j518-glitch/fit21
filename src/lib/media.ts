export type MediaType = 'youtube' | 'video' | 'image' | 'empty';

export function getMediaType(url?: string): MediaType {
  if (!url?.trim()) return 'empty';
  const lower = url.toLowerCase();

  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(lower)) {
    return 'video';
  }

  return 'image';
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isYouTube =
      host === 'youtu.be' ||
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'www.youtube-nocookie.com';
    if (!isYouTube) return null;

    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0];
    } else {
      videoId = parsed.searchParams.get('v');
      if (!videoId && parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2];
      }
      if (!videoId && parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2];
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
