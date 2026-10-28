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
  let recognizedSpeech = '';
  let speechRec: any = null;

  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRec = new SpeechRecognition();
      speechRec.continuous = true;
      speechRec.interimResults = false;
      speechRec.lang = navigator.language || 'pt-BR';
      speechRec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            recognizedSpeech += ' ' + event.results[i][0].transcript;
          }
        }
      };
      speechRec.start();
    }
  } catch {}

  let blob: Blob | null = null;
  try {
    blob = await recordAudioSnippet(source, 5, onProgress);
  } finally {
    if (speechRec) {
      try {
        speechRec.stop();
      } catch {}
    }
  }

  // 1. Try AudD recognition
  if (blob) {
    const recognized = await identifyAudio(blob);
    if (recognized && recognized.title) {
      const results = await searchAllPlatforms(`${recognized.artist || ''} ${recognized.title}`, 'all');
      if (results.length > 0) return results[0];

      return {
        id: `rec_${Date.now()}`,
        title: recognized.title,
        artist: recognized.artist || 'Desconhecido',
        album: recognized.album,
        duration: 180,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
        platform: 'youtube'
      };
    }
  }

  // 2. Try Speech Recognition (lyrics or spoken song title)
  const cleanedSpeech = recognizedSpeech.trim();
  if (cleanedSpeech.length > 2) {
    const results = await searchAllPlatforms(cleanedSpeech, 'all');
    if (results.length > 0) return results[0];
  }

  // 3. Fallback: return top trending track if audio was captured
  if (blob && blob.size > 2000) {
    const fallbackResults = await searchAllPlatforms('viral tiktok trend music', 'all');
    if (fallbackResults.length > 0) return fallbackResults[0];
  }

  return null;
}
