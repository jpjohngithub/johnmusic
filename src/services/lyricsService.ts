import type { LyricLine } from '../types/music';

const LYRICS_CACHE = new Map<string, LyricLine[] | string>();

export class LyricsService {
  public static parseLrc(lrcText: string): LyricLine[] {
    const lines = lrcText.split('\n');
    const result: LyricLine[] = [];

    const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/;

    for (const rawLine of lines) {
      const match = rawLine.trim().match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        const text = match[3].trim();
        if (text) {
          result.push({
            time: minutes * 60 + seconds,
            text,
          });
        }
      }
    }

    return result.sort((a, b) => a.time - b.time);
  }

  public static async fetchLyrics(title: string, artist: string): Promise<LyricLine[] | string | null> {
    const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = artist.split(',')[0].trim();
    const cacheKey = `${cleanArtist} - ${cleanTitle}`.toLowerCase();

    if (LYRICS_CACHE.has(cacheKey)) {
      return LYRICS_CACHE.get(cacheKey)!;
    }

    try {
      // 1. Exact match from LRCLIB
      const params = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
      });

      const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const parsed = this.parseLrc(data.syncedLyrics);
          if (parsed.length > 0) {
            LYRICS_CACHE.set(cacheKey, parsed);
            return parsed;
          }
        }
        if (data.plainLyrics) {
          LYRICS_CACHE.set(cacheKey, data.plainLyrics);
          return data.plainLyrics;
        }
      }

      // 2. Search LRCLIB if exact get failed
      const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`);
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const top = results[0];
          if (top.syncedLyrics) {
            const parsed = this.parseLrc(top.syncedLyrics);
            if (parsed.length > 0) {
              LYRICS_CACHE.set(cacheKey, parsed);
              return parsed;
            }
          }
          if (top.plainLyrics) {
            LYRICS_CACHE.set(cacheKey, top.plainLyrics);
            return top.plainLyrics;
          }
        }
      }
    } catch (err) {
      console.debug('Lyrics fetch error:', err);
    }

    return null;
  }
}
