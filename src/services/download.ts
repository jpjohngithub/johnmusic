import { Track } from '../types';

export const downloadTrackMp3 = async (
  track: Track,
  onProgress?: (percent: number) => void
): Promise<void> => {
  try {
    let audioUrl = track.streamUrl;

    // If it's a YouTube track or has no direct streamUrl, resolve via public audio conversion endpoint
    if (!audioUrl && track.youtubeId) {
      // Use direct YouTube audio stream proxies/APIs
      audioUrl = `https://pipedapi.kavin.rocks/streams/${track.youtubeId}`;
      try {
        const streamResp = await fetch(audioUrl);
        const streamData = await streamResp.json();
        const audioStream = streamData.audioStreams?.find((s: any) => s.mimeType?.includes('audio/mp4') || s.mimeType?.includes('audio/webm'));
        if (audioStream?.url) {
          audioUrl = audioStream.url;
        }
      } catch (e) {
        // Fallback to direct download helper
        audioUrl = `https://api.cobalt.tools/api/json`;
      }
    }

    if (!audioUrl) {
      // Try resolving via iTunes preview if spotify
      if (track.streamUrl) {
        audioUrl = track.streamUrl;
      } else {
        throw new Error('Link de áudio direto não disponível para download');
      }
    }

    // Try direct blob fetch
    try {
      const response = await fetch(audioUrl, {
        headers: { 'Accept': 'audio/*, application/octet-stream' }
      });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${track.artist} - ${track.title}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      return;
    } catch (corsErr) {
      // Fallback via weserv or proxy blob
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(audioUrl)}&default=${encodeURIComponent(audioUrl)}`;
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${track.artist} - ${track.title}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Download error:', error);
    alert(`Não foi possível baixar o MP3 de "${track.title}". Verifique a conexão com a fonte.`);
  }
};
