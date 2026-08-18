import type { Playlist, Track, EqualizerPreset } from '../types/music';

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Neon Nights & Cyber Dreams',
    artist: 'John Synth',
    album: 'Future Horizon 2077',
    duration: 184,
    genre: 'Synthwave',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: true,
    lyrics: [
      { time: 0, text: '♪ (Intro eletrizante com sintetizadores analógicos) ♪' },
      { time: 12, text: 'Luzes de neon refletem no asfalto molhado' },
      { time: 24, text: 'A cidade que nunca dorme chama pelo meu nome' },
      { time: 36, text: 'Velocidade na pista, o horizonte brilha em magenta' },
      { time: 48, text: 'No compasso do baixo, o futuro se inventa' },
      { time: 65, text: '♪ (Solo de sintetizador / Drop espacial) ♪' },
      { time: 88, text: 'Correndo contra o tempo nas esquinas de neon' },
      { time: 104, text: 'Nada pode parar o som do johnmusic' },
      { time: 125, text: 'A batida ecoa pelo infinito da noite' },
      { time: 150, text: '♪ (Outro cósmico) ♪' }
    ]
  },
  {
    id: 'track-2',
    title: 'Midnight Coffee & Rainy Window',
    artist: 'Lofi John',
    album: 'Cozy Coding Sessions',
    duration: 142,
    genre: 'Lofi Hip Hop',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: true,
    lyrics: [
      { time: 0, text: '♪ (Som suave de chuva e xícara de café) ♪' },
      { time: 10, text: 'Linhas de código na tela piscando sem parar' },
      { time: 25, text: 'Uma xícara quente para me acompanhar' },
      { time: 40, text: 'A chuva cai mansinha na janela do quarto' },
      { time: 58, text: 'Paz no pensamento, foco em cada detalhe' },
      { time: 80, text: '♪ (Batida suave de piano de cauda) ♪' },
      { time: 110, text: 'Deixa a melodia fluir com o johnmusic...' }
    ]
  },
  {
    id: 'track-3',
    title: 'Cyber Highway 101',
    artist: 'Quantum Pulse',
    album: 'Digital Odyssey',
    duration: 215,
    genre: 'Electronic / Bass',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=cyberpunk-2099-10701.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: false,
    lyrics: [
      { time: 0, text: '♪ (Kick pulsante e graves profundos) ♪' },
      { time: 18, text: 'Conectando ao núcleo digital' },
      { time: 35, text: 'Frequências elevadas na matriz' },
      { time: 52, text: 'Sinta a vibração em cada fibra' },
      { time: 70, text: '♪ (DROP PESADO - Subgrave 40Hz) ♪' },
      { time: 110, text: 'Potência máxima no equalizador johnmusic!' },
      { time: 140, text: '♪ (Variação rítmica com arpeggios) ♪' }
    ]
  },
  {
    id: 'track-4',
    title: 'Acoustic Sunset Breeze',
    artist: 'Aura Woods',
    album: 'Folk Reverie',
    duration: 168,
    genre: 'Acoustic / Chill',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=inspiring-cinematic-ambient-116199.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: true,
    lyrics: [
      { time: 0, text: '♪ (Violão de cordas de aço e atmosfera suave) ♪' },
      { time: 15, text: 'O sol se põe dourado no horizonte' },
      { time: 32, text: 'O vento traz memórias e calmaria' },
      { time: 50, text: 'Respire fundo, sinta o presente' },
      { time: 75, text: 'A melodia cura o que o dia cansou' }
    ]
  },
  {
    id: 'track-5',
    title: 'Tokyo Rain Glitch',
    artist: 'Shinobi Beats',
    album: 'Neo Shibuya',
    duration: 195,
    genre: 'Chillhop / Trap',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c93e43d61f.mp3?filename=lofi-chill-medium-version-159456.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: false,
    lyrics: [
      { time: 0, text: '♪ (Vozes de fundo em Shibuya e percussão lofi) ♪' },
      { time: 20, text: 'Guarda-chuvas transparentes nas ruas de Tóquio' },
      { time: 42, text: 'Reflexos coloridos dançam nas poças de água' },
      { time: 68, text: 'Batida hipnótica que relaxa a mente' },
      { time: 95, text: 'johnmusic tocando no fone de ouvido sem parar' }
    ]
  },
  {
    id: 'track-6',
    title: 'Deep Space Gravity',
    artist: 'Cosmic Voyager',
    album: 'Interstellar Horizons',
    duration: 230,
    genre: 'Ambient / Space',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    source: 'built-in',
    isLiked: false,
    lyrics: [
      { time: 0, text: '♪ (Sons etéreos de piano e sintetizadores cósmicos) ♪' },
      { time: 30, text: 'Flutuando através de galáxias distantes' },
      { time: 60, text: 'A imensidão do cosmos em harmonia pura' },
      { time: 100, text: 'Constelações dançam em perfeita sincronia' }
    ]
  }
];

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-favorites',
    title: 'Músicas Curtidas',
    description: 'Sua coleção especial de faixas favoritas no johnmusic.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    trackIds: ['track-1', 'track-2', 'track-4'],
    createdAt: Date.now() - 86400000 * 5,
    isSystem: true,
  },
  {
    id: 'playlist-cyberpunk',
    title: 'Cyberpunk & Synthwave Vibes',
    description: 'Batidas futuristas, neon e sintetizadores retrô para acelerar o ritmo.',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    trackIds: ['track-1', 'track-3'],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'playlist-lofi-code',
    title: 'Lofi Code & Relax',
    description: 'Melodias relaxantes e calmas perfeitas para programar, estudar e focar.',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    trackIds: ['track-2', 'track-4', 'track-5', 'track-6'],
    createdAt: Date.now() - 86400000 * 2,
  }
];

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'Padrão (Flat)', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost (Super Graves)', gains: [8, 5, 1, 0, -1] },
  { name: 'Eletrônica / EDM', gains: [6, 4, -1, 3, 5] },
  { name: 'Rock & Metal', gains: [5, 3, -2, 4, 6] },
  { name: 'Pop Hits', gains: [2, 4, 5, 2, 3] },
  { name: 'Vocal Claro', gains: [-3, 1, 6, 4, 1] },
  { name: 'Jazz & Acústico', gains: [3, 2, 1, 3, 4] },
  { name: 'Chillout / Lofi', gains: [4, 2, -2, -1, -3] },
];
