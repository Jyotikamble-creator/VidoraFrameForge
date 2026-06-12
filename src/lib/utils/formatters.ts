export function formatViews(views?: number): string {
  if (!views) return '0';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

export function formatSubscribers(subscribers?: number): string {
  if (!subscribers) return '0';
  if (subscribers >= 1000000) {
    return `${(subscribers / 1000000).toFixed(1)}M`;
  }
  if (subscribers >= 1000) {
    return `${(subscribers / 1000).toFixed(1)}K`;
  }
  return subscribers.toString();
}