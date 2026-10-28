import React, { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { PlaylistProvider, usePlaylists } from './context/PlaylistContext';
import { Sidebar } from './components/Navigation/Sidebar';
import { BottomNav } from './components/Navigation/BottomNav';
import { PlayerBar } from './components/Player/PlayerBar';
import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { PlaylistDetailView } from './views/PlaylistDetailView';
import { MergePlaylistsModal } from './components/Modals/MergePlaylistsModal';
import { AddToPlaylistModal } from './components/Modals/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/Modals/CreatePlaylistModal';
import { AudioRecognizerModal } from './components/AudioRecognizerModal';
import { ImportLinkModal } from './components/ImportLinkModal';
import { decodeSharedPlaylist } from './services/share';
import { Platform, Track } from './types';
import { Headphones, Search, Radio, Link2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { createPlaylist, addTrackToPlaylist, playlists } = usePlaylists();
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library' | 'playlist'>(() => {
    try {
      const saved = localStorage.getItem('johnmusic_active_view');
      if (saved && ['home', 'search', 'library', 'playlist'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'home';
  });
  const [activeFilter, setActiveFilter] = useState<Platform | 'all'>('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('johnmusic_active_playlist_id') || null;
    } catch {
      return null;
    }
  });

  // Keep active view & selected playlist in storage
  React.useEffect(() => {
    try {
      localStorage.setItem('johnmusic_active_view', currentView);
      if (selectedPlaylistId) {
        localStorage.setItem('johnmusic_active_playlist_id', selectedPlaylistId);
      } else {
        localStorage.removeItem('johnmusic_active_playlist_id');
      }
    } catch {}
  }, [currentView, selectedPlaylistId]);

  // If playlist was deleted while selected, return to library
  React.useEffect(() => {
    if (currentView === 'playlist' && selectedPlaylistId) {
      const exists = playlists.some(p => p.id === selectedPlaylistId);
      if (!exists && playlists.length > 0) {
        setCurrentView('library');
        setSelectedPlaylistId(null);
      }
    }
  }, [playlists, currentView, selectedPlaylistId]);

  // Auto-import shared playlist from URL (?playlist=...)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const decoded = decodeSharedPlaylist(window.location.search);
      if (decoded) {
        const created = createPlaylist(decoded.name, decoded.description, decoded.coverUrl, decoded.tracks);
        setSelectedPlaylistId(created.id);
        setCurrentView('playlist');
        // Clean URL query without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecognizerModalOpen, setIsRecognizerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);

  const handleNavigate = (view: string, filter: Platform | 'all' = 'all') => {
    setSelectedPlaylistId(null);
    setCurrentView(view as any);
    setActiveFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentView('playlist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen w-full bg-[#060509] text-[#f1f5f9] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenRecognizerModal={() => setIsRecognizerModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onSelectPlaylist={handleSelectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#09070e] border-b border-purple-950/40 sticky top-0 z-30">
          <div
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              JohnMusic
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsRecognizerModalOpen(true)}
              className="p-1.5 rounded-xl bg-purple-950 text-purple-300 border border-purple-800/40"
              title="Shazam"
            >
              <Radio className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="p-1.5 rounded-xl bg-purple-950 text-purple-300 border border-purple-800/40"
              title="Importar Link"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate('search', 'all')}
              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 pb-44 md:pb-28 scroll-smooth">
          {currentView === 'home' && (
            <HomeView
              onOpenMergeModal={() => setIsMergeModalOpen(true)}
              onOpenRecognizerModal={() => setIsRecognizerModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
              onSelectPlaylist={handleSelectPlaylist}
              onNavigateSearch={(filter) => handleNavigate('search', filter)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              initialFilter={activeFilter}
              onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
              onOpenPlaylist={handleSelectPlaylist}
            />
          )}

          {currentView === 'library' && (
            <LibraryView
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenMergeModal={() => setIsMergeModalOpen(true)}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}

          {currentView === 'playlist' && selectedPlaylistId && (
            <PlaylistDetailView
              playlistId={selectedPlaylistId}
              onBack={() => handleNavigate('library')}
              onOpenMergeModal={() => setIsMergeModalOpen(true)}
              onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
            />
          )}
        </div>

        {/* PlayerBar */}
        <PlayerBar />

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          currentView={currentView}
          activeFilter={activeFilter}
          onNavigate={handleNavigate}
          onOpenRecognizerModal={() => setIsRecognizerModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
      </main>

      {/* Global Modals */}
      <MergePlaylistsModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onPlaylistCreated={(id) => handleSelectPlaylist(id)}
      />

      <AddToPlaylistModal
        isOpen={!!trackToAddToPlaylist}
        track={trackToAddToPlaylist}
        onClose={() => setTrackToAddToPlaylist(null)}
      />

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => handleSelectPlaylist(id)}
      />

      <AudioRecognizerModal
        isOpen={isRecognizerModalOpen}
        onClose={() => setIsRecognizerModalOpen(false)}
        onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
      />

      <ImportLinkModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onPlaylistImported={(id) => handleSelectPlaylist(id)}
        onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlaylistProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </PlaylistProvider>
  );
};

export default App;
