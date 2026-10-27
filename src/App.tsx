import React, { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { PlaylistProvider } from './context/PlaylistContext';
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
import { Platform, Track } from './types';
import { Headphones, Search } from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'library' | 'playlist'>('home');
  const [activeFilter, setActiveFilter] = useState<Platform | 'all'>('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    <div className="flex h-screen w-full bg-[#0b0c10] text-[#f1f5f9] overflow-hidden">
      {/* Desktop Glassmorphic Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSelectPlaylist={handleSelectPlaylist}
        selectedPlaylistId={selectedPlaylistId}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0e15]/90 border-b border-white/10 backdrop-blur-xl sticky top-0 z-30">
          <div
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
              JohnMusic
            </span>
          </div>

          <button
            onClick={() => handleNavigate('search', 'all')}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          >
            <Search className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable View Container with pb-44 md:pb-28 for mobile and desktop players */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 pb-44 md:pb-28 scroll-smooth">
          {currentView === 'home' && (
            <HomeView
              onOpenMergeModal={() => setIsMergeModalOpen(true)}
              onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
              onSelectPlaylist={handleSelectPlaylist}
              onNavigateSearch={(filter) => handleNavigate('search', filter)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              initialFilter={activeFilter}
              onAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
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

        {/* PlayerBar (Compact on mobile, full on desktop) */}
        <PlayerBar />

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <BottomNav
          currentView={currentView}
          activeFilter={activeFilter}
          onNavigate={handleNavigate}
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
