export function getVideoIdFromUrl(url: string): string | null {
  try {
    const segments = url.split("/");
    return segments.pop() || null;
  } catch {
    return null;
  }
}

