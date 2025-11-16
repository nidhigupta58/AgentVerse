/**
 * Format Date to Relative Time
 * 
 * Converts a date to a human-readable relative time string like "2h ago" or "just now".
 * This makes timestamps more user-friendly than showing exact dates.
 * 
 * Examples:
 * - Less than 1 minute: "just now"
 * - Less than 1 hour: "5m ago"
 * - Less than 24 hours: "3h ago"
 * - Less than 7 days: "2d ago"
 * - Older: Shows actual date like "12/25/2023"
 */
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

/**
 * Get User Initials from Name
 * 
 * Extracts the first letter of each word in a name and returns them as uppercase.
 * Used for avatar placeholders when a user doesn't have a profile picture.
 * 
 * Example: "John Doe" → "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate Text with Ellipsis
 * 
 * Cuts off text at a specified length and adds "..." if the text is longer.
 * Useful for previews and cards where you want to show a snippet.
 * 
 * Example: truncate("This is a long text", 10) → "This is a ..."
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Format Text with Hashtags and Bold Markdown
 * 
 * This function parses text and identifies:
 * - Hashtags (e.g., #react #javascript)
 * - Bold text (e.g., **this is bold**)
 * 
 * It returns an array of text parts with metadata about whether each part
 * is a hashtag or bold text. This allows the UI to style them differently.
 * 
 * How it works:
 * 1. Uses regex to find hashtags and bold markdown
 * 2. Splits the text into parts (normal text, hashtags, bold text)
 * 3. Returns array with metadata for each part
 * 
 * Example input: "Check out **this** cool #react tutorial"
 * Returns: [
 *   { text: "Check out ", isHashtag: false, isBold: false },
 *   { text: "this", isHashtag: false, isBold: true },
 *   { text: " cool ", isHashtag: false, isBold: false },
 *   { text: "#react", isHashtag: true, isBold: false },
 *   { text: " tutorial", isHashtag: false, isBold: false }
 * ]
 */
export function formatTextWithHashtags(text: string): Array<{ text: string; isHashtag: boolean; isBold: boolean }> {
  const parts: Array<{ text: string; isHashtag: boolean; isBold: boolean }> = [];
  
  // Regex matches both bold markdown (**text**) and hashtags (#tag)
  const combinedRegex = /(\*\*[^*]+\*\*|(?:^|\s)(#[a-zA-Z0-9_]+))/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add any text that appears before this match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push({ text: beforeText, isHashtag: false, isBold: false });
      }
    }
    
    // Determine if this match is bold text or a hashtag
    if (match[0].startsWith('**') && match[0].endsWith('**')) {
      // It's bold markdown - remove the ** markers
      const boldText = match[0].slice(2, -2);
      parts.push({ text: boldText, isHashtag: false, isBold: true });
    } else {
      // It's a hashtag
      parts.push({ text: match[1] || match[0], isHashtag: true, isBold: false });
    }
    
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ text: remainingText, isHashtag: false, isBold: false });
    }
  }

  // If no matches found, return the whole text as a single normal part
  if (parts.length === 0) {
    parts.push({ text, isHashtag: false, isBold: false });
  }

  return parts;
}

