import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { HomeView } from '../views/HomeView';
import { ExploreView } from '../views/ExploreView';
import { LocalFilesView } from '../views/LocalFilesView';
import { SpotifyView } from '../views/SpotifyView';
import { PlaylistView } from '../views/PlaylistView';
import { SpotifyPlaylistView } from '../views/SpotifyPlaylistView';
import { FavoritesView } from '../views/FavoritesView';
import { HistoryView } from '../views/HistoryView';

export const MainContent: React.FC = () => {
  const { currentView, selectedSpotifyItem, selectedSpotifyType } = usePlayer();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'explore':
        return <ExploreView />;
      case 'local-files':
        return <LocalFilesView />;
      case 'spotify':
        return <SpotifyView />;
      case 'playlist':
        return <PlaylistView />;
      case 'spotify-playlist':
        return <SpotifyPlaylistView item={selectedSpotifyItem} type={selectedSpotifyType} />;
      case 'favorites':
        return <FavoritesView />;
      case 'history':
        return <HistoryView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 pb-32">
      <div className="max-w-7xl mx-auto">
        {renderView()}
      </div>
    </main>
  );
};
