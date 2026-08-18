import type { Track } from '../types/music';

// Lightweight ID3 parser to read ID3v2 tags and embedded cover pictures
async function extractMetadata(file: File): Promise<{ title: string; artist: string; album: string; coverUrl?: string }> {
  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Artista Desconhecido';
  let album = 'Álbum Local';
  let coverUrl: string | undefined;

  // Attempt to parse 'Artist - Title' from filename
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  try {
    const buffer = await file.slice(0, 1024 * 512).arrayBuffer(); // read first 512KB
    const view = new DataView(buffer);

    // Check ID3v2 header: 'ID3'
    if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
      let offset = 10;
      const tagSize = ((view.getUint8(6) & 0x7f) << 21) |
                      ((view.getUint8(7) & 0x7f) << 14) |
                      ((view.getUint8(8) & 0x7f) << 7) |
                      (view.getUint8(9) & 0x7f);

      const maxOffset = Math.min(buffer.byteLength, 10 + tagSize);

      while (offset + 10 < maxOffset) {
        const frameId = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        if (!frameId.match(/^[A-Z0-9]{4}$/)) break;

        const frameSize = (view.getUint8(offset + 4) << 24) |
                          (view.getUint8(offset + 5) << 16) |
                          (view.getUint8(offset + 6) << 8) |
                          view.getUint8(offset + 7);

        if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) break;

        const contentBytes = new Uint8Array(buffer, offset + 10, frameSize);

        if (frameId === 'TIT2') {
          title = decodeID3Text(contentBytes) || title;
        } else if (frameId === 'TPE1') {
          artist = decodeID3Text(contentBytes) || artist;
        } else if (frameId === 'TALB') {
          album = decodeID3Text(contentBytes) || album;
        } else if (frameId === 'APIC') {
          coverUrl = extractAPICImage(contentBytes);
        }

        offset += 10 + frameSize;
      }
    }
  } catch (err) {
    console.debug('Could not fully parse ID3 tags from local file:', err);
  }

  return { title, artist, album, coverUrl };
}

function decodeID3Text(bytes: Uint8Array): string {
  try {
    const encoding = bytes[0];
    const raw = bytes.subarray(1);
    if (encoding === 0) { // ISO-8859-1
      return new TextDecoder('iso-8859-1').decode(raw).replace(/\0+$/, '').trim();
    } else if (encoding === 1 || encoding === 2) { // UTF-16
      return new TextDecoder('utf-16').decode(raw).replace(/\0+$/, '').trim();
    } else if (encoding === 3) { // UTF-8
      return new TextDecoder('utf-8').decode(raw).replace(/\0+$/, '').trim();
    }
    return new TextDecoder().decode(raw).replace(/\0+$/, '').trim();
  } catch {
    return '';
  }
}

function extractAPICImage(bytes: Uint8Array): string | undefined {
  try {
    let i = 1;
    let mime = '';
    while (i < bytes.length && bytes[i] !== 0) {
      mime += String.fromCharCode(bytes[i]);
      i++;
    }
    i++; // skip mime null byte
    i++; // skip picture type

    // Skip description (null terminated)
    while (i < bytes.length && bytes[i] !== 0) {
      i++;
    }
    i++; // skip desc null byte
    if (i < bytes.length && bytes[i] === 0) i++; // UTF-16 second null byte check

    const imgData = bytes.subarray(i);
    if (imgData.length > 0) {
      const mimeType = mime || 'image/jpeg';
      const blob = new Blob([new Uint8Array(imgData).buffer as ArrayBuffer], { type: mimeType });
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.debug('Error extracting APIC cover:', e);
  }
  return undefined;
}

export async function processLocalFiles(files: FileList | File[]): Promise<Track[]> {
  const tracks: Track[] = [];
  const defaultCovers = [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      continue;
    }

    const audioUrl = URL.createObjectURL(file);
    const meta = await extractMetadata(file);

    // Get exact audio duration
    const duration = await new Promise<number>((resolve) => {
      const tempAudio = new Audio();
      tempAudio.src = audioUrl;
      tempAudio.onloadedmetadata = () => {
        resolve(Math.round(tempAudio.duration) || 180);
      };
      tempAudio.onerror = () => {
        resolve(180);
      };
    });

    const coverUrl = meta.coverUrl || defaultCovers[i % defaultCovers.length];

    tracks.push({
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: meta.title || file.name,
      artist: meta.artist || 'Artista Local',
      album: meta.album || 'Música do Computador',
      duration: duration,
      audioUrl: audioUrl,
      coverUrl: coverUrl,
      source: 'local',
      isLocal: true,
      genre: 'Local Audio',
      file: file,
      addedAt: Date.now(),
    });
  }

  return tracks;
}
