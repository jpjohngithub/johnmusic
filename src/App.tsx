import React, { useEffect } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MainContent } from './components/layout/MainContent';
import { PlayerBar } from './components/player/PlayerBar';
import { QueueDrawer } from './components/player/QueueDrawer';
import { LyricsView } from './components/player/LyricsView';
import { SpotifyEmbedModal } from './components/player/SpotifyEmbedModal';
import { YouTubeAudioPlayer } from './components/player/YouTubeAudioPlayer';

const KeyboardController: React.FC = () => {
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    currentTime,
    volume,
    setVolume,
    toggleMute,
    toggleFavorite,
    currentTrack,
  } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyL':
          if (currentTrack) {
            e.preventDefault();
            toggleFavorite(currentTrack);
          }
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          prevTrack();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, seek, currentTime, volume, setVolume, toggleMute, toggleFavorite, currentTrack]);

  return null;
};

export const AppContent: React.FC = () => {
  const { isSpotifyEmbedOpen, toggleSpotifyEmbed, currentTrack } = usePlayer();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-john-dark text-slate-100 font-sans">
      <KeyboardController />

      {/* Main Left Sidebar */}
      <Sidebar />

      {/* Main Content + Top Navigation */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <MainContent />
      </div>

      {/* Bottom Sticky Player Controls */}
      <PlayerBar />

      {/* Modals and Overlays */}
      <QueueDrawer />
      <LyricsView />
      <SpotifyEmbedModal 
        isOpen={isSpotifyEmbedOpen} 
        onClose={toggleSpotifyEmbed} 
        spotifyUriOrUrl={currentTrack?.spotifyUri} 
        title={currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : 'Spotify Web Player'} 
      />
      <YouTubeAudioPlayer />
    </div>
  );
};

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
