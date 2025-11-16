export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return d.toLocaleDateString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Format text with hashtags styled differently
 * Returns an array of text parts with hashtags marked
 */
export function formatTextWithHashtags(text: string): Array<{ text: string; isHashtag: boolean }> {
  const parts: Array<{ text: string; isHashtag: boolean }> = [];
  const hashtagRegex = /(?:^|\s)(#[a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), isHashtag: false });
    }
    // Add hashtag
    parts.push({ text: match[1], isHashtag: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isHashtag: false });
  }

  // If no hashtags found, return the whole text
  if (parts.length === 0) {
    parts.push({ text, isHashtag: false });
  }

  return parts;
}

