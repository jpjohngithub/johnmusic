import { Track } from '../types';
import { searchAllPlatforms } from './api';

export interface RecognizedSong {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
}

export async function recordAudioSnippet(
  source: 'mic' | 'system',
  durationSeconds = 5,
  onProgress?: (secondsLeft: number) => void
): Promise<Blob> {
  let stream: MediaStream;

  if (source === 'system') {
    // Captures PC/browser tab audio
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
  } else {
    // Microphone
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        reject(new Error('Nenhum áudio detectado no compartilhamento. Certifique-se de marcar "Compartilhar áudio".'));
        return;
      }

      // Keep only audio track if video was included
      const audioStream = new MediaStream(audioTracks);
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorder.start();

      let left = durationSeconds;
      if (onProgress) onProgress(left);

      const interval = setInterval(() => {
        left -= 1;
        if (onProgress) onProgress(left);
        if (left <= 0) {
          clearInterval(interval);
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      stream.getTracks().forEach(t => t.stop());
      reject(err);
    }
  });
}

// Identify song via AudD API
export async function identifyAudio(audioBlob: Blob): Promise<RecognizedSong | null> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'sample.webm');
  formData.append('return', 'apple_music,spotify');
  formData.append('api_token', 'test'); // AudD free test token

  try {
    const res = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Falha no serviço de reconhecimento');
    const data = await res.json();

    if (data.status === 'success' && data.result) {
      return {
        title: data.result.title,
        artist: data.result.artist,
        album: data.result.album,
        releaseDate: data.result.release_date
      };
    }
    return null;
  } catch (err) {
    console.warn('Audio recognition error:', err);
    return null;
  }
}

// Identify & resolve complete playable Track
export async function identifyAndResolveSong(
  source: 'mic' | 'system',
  onProgress?: (secondsLeft: number) => void
): Promise<Track | null> {
  const blob = await recordAudioSnippet(source, 5, onProgress);
  const recognized = await identifyAudio(blob);

  if (!recognized) return null;

  // Search full playable track on all platforms
  const results = await searchAllPlatforms(`${recognized.artist} ${recognized.title}`, 'all');
  if (results.length > 0) {
    return results[0];
  }

  // Fallback track construction
  return {
    id: `rec_${Date.now()}`,
    title: recognized.title,
    artist: recognized.artist,
    album: recognized.album,
    duration: 180,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    platform: 'youtube'
  };
}
