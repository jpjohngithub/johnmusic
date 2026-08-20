import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { SpotifyService } from '../../services/spotifyService';
import type { Track, SpotifyPlaylistCard } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { 
  Radio, Key, ExternalLink, CheckCircle2, AlertCircle, Loader2, 
  Sparkles, Zap, Globe, Music2, User, Heart, Clock, TrendingUp,
  RefreshCw
} from 'lucide-react';

type TabType = 'connect' | 'myplaylists' | 'saved' | 'top' | 'recent' | 'search';

export const SpotifyView: React.FC = () => {
  const { 
    spotifySDKState: _sdkState, isSpotifySDKReady, 
    initSpotifySDK, loadUserSpotifyPlaylists,
    openSpotifyItem
  } = usePlayer();

  const [clientId, setClientId] = useState(() => SpotifyService.getStoredClientId());
  const [isConnected, setIsConnected] = useState(() => !!SpotifyService.getStoredToken());
  const [activeTab, setActiveTab] = useState<TabType>(isConnected ? 'myplaylists' : 'connect');
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylistCard[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sdkInitAttempted, setSdkInitAttempted] = useState(false);

  // Handle OAuth redirect code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && clientId) {
      const redirectUri = window.location.origin + window.location.pathname;
      setStatusMessage('Autenticando com Spotify...');
      SpotifyService.exchangeCodeForToken(code, clientId, redirectUri)
        .then(() => {
          setIsConnected(true);
          setActiveTab('myplaylists');
          setStatusMessage('');
          window.history.replaceState({}, document.title, window.location.pathname);
          loadUserData();
          // Auto-init SDK
          initSpotifySDK().then(ok => {
            if (ok) setStatusMessage('Spotify Premium conectado! Músicas completas ativadas.');
          });
        })
        .catch((err) => setStatusMessage(`Falha na autenticação: ${err.message}`));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Load user data when connected
  useEffect(() => {
    if (isConnected) {
      loadUserData();
      if (!isSpotifySDKReady && !sdkInitAttempted) {
        setSdkInitAttempted(true);
        initSpotifySDK();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const loadUserData = async () => {
    const token = SpotifyService.getStoredToken();
    if (!token) return;

    // Profile
    SpotifyService.getUserProfile().then(p => setUserProfile(p));
    // Playlists
    SpotifyService.getUserPlaylists().then(pls => setUserPlaylists(pls));
    loadUserSpotifyPlaylists();
  };

  const handleLoadSavedTracks = async () => {
    if (savedTracks.length > 0) return;
    setIsLoading(true);
    const tracks = await SpotifyService.getUserSavedTracks(100);
    setSavedTracks(tracks);
    setIsLoading(false);
  };

  const handleLoadTopTracks = async () => {
    if (topTracks.length > 0) return;
    setIsLoading(true);
    const tracks = await SpotifyService.getUserTopTracks('short_term');
    setTopTracks(tracks);
    setIsLoading(false);
  };

  const handleLoadRecent = async () => {
    if (recentTracks.length > 0) return;
    setIsLoading(true);
    const tracks = await SpotifyService.getRecentlyPlayed();
    setRecentTracks(tracks);
    setIsLoading(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'saved') handleLoadSavedTracks();
    if (tab === 'top') handleLoadTopTracks();
    if (tab === 'recent') handleLoadRecent();
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;
    SpotifyService.setStoredClientId(clientId);
    setStatusMessage('Client ID salvo.');
  };

  const handleConnectSpotify = async () => {
    if (!clientId.trim()) { setStatusMessage('Informe seu Client ID do Spotify.'); return; }
    SpotifyService.setStoredClientId(clientId);
    const redirectUri = window.location.origin + window.location.pathname;
    try {
      const authUrl = await SpotifyService.getAuthUrl(clientId.trim(), redirectUri);
      window.location.href = authUrl;
    } catch (e: any) { setStatusMessage(`Erro: ${e.message}`); }
  };

  const handleDisconnect = () => {
    SpotifyService.disconnect();
    setIsConnected(false);
    setUserProfile(null);
    setUserPlaylists([]);
    setSavedTracks([]);
    setTopTracks([]);
    setRecentTracks([]);
    setActiveTab('connect');
    setStatusMessage('');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spotifyQuery.trim()) return;
    setIsLoading(true);
    try {
      const tracks = await SpotifyService.searchTracks(spotifyQuery);
      setResults(tracks);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleInitSDK = async () => {
    setStatusMessage('Ativando Spotify Premium Player...');
    const ok = await initSpotifySDK();
    setStatusMessage(ok ? '✅ Spotify Premium Player ativado! Músicas completas disponíveis.' : '❌ Falha ao ativar. Verifique se você tem Spotify Premium.');
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; onlyConnected?: boolean }[] = [
    { id: 'connect', label: 'Conectar', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'myplaylists', label: 'Minhas Playlists', icon: <Music2 className="w-3.5 h-3.5" />, onlyConnected: true },
    { id: 'saved', label: 'Curtidas', icon: <Heart className="w-3.5 h-3.5" />, onlyConnected: true },
    { id: 'top', label: 'Mais Tocadas', icon: <TrendingUp className="w-3.5 h-3.5" />, onlyConnected: true },
    { id: 'recent', label: 'Recentes', icon: <Clock className="w-3.5 h-3.5" />, onlyConnected: true },
    { id: 'search', label: 'Buscar', icon: <Globe className="w-3.5 h-3.5" /> },
  ];

  const visibleTabs = tabs.filter(t => !t.onlyConnected || isConnected);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-green-950/60 border border-green-500/20 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
              <Radio className="w-3.5 h-3.5" />
              <span>Spotify Web API + Web Playback SDK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Spotify no johnmusic
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isConnected && userProfile 
                ? `Olá, ${userProfile.displayName}! ${isSpotifySDKReady ? 'Músicas completas ativas (Premium).' : 'Conecte o player para músicas 100% completas.'}`
                : 'Conecte sua conta para acessar todas as suas playlists, músicas curtidas e o catálogo global.'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && !isSpotifySDKReady && (
              <button
                onClick={handleInitSDK}
                className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                Ativar Player Premium
              </button>
            )}
            {isSpotifySDKReady && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Player Premium Ativo
              </div>
            )}
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs border border-red-500/30 transition-all"
              >
                Desconectar
              </button>
            ) : (
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-green-400" />
                Developer Dashboard
              </a>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Bar */}
      {isConnected && userProfile && (
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          {userProfile.images?.[0]?.url ? (
            <img src={userProfile.images[0].url} alt={userProfile.displayName} className="w-9 h-9 rounded-full object-cover border-2 border-green-500/50" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-green-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{userProfile.displayName}</div>
            <div className="text-xs text-slate-400">
              {userProfile.product === 'premium' ? '✨ Spotify Premium' : 'Spotify Free'} • {userProfile.email}
            </div>
          </div>
          {userProfile.product !== 'premium' && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              Premium necessário para músicas completas
            </div>
          )}
        </div>
      )}

      {/* SDK Status Banner */}
      {isConnected && !isSpotifySDKReady && (
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-300">Player de músicas completas não ativo</div>
              <div className="text-xs text-slate-400">Ative o player para ouvir músicas sem o corte de 30s (requer Premium)</div>
            </div>
          </div>
          <button
            onClick={handleInitSDK}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Ativar Agora
          </button>
        </div>
      )}

      {statusMessage && (
        <div className="px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-sm text-emerald-400 font-medium">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* ─── CONNECT TAB ──────────────────────────────────────────────── */}
        {activeTab === 'connect' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instructions */}
            <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Como Conectar (3 Passos)
              </h2>
              <ol className="space-y-3 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                <li>
                  Acesse o <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-green-400 font-semibold underline">Spotify Developer Dashboard</a> e crie um App.
                </li>
                <li>
                  Nas configurações do App, adicione a <strong>Redirect URI</strong>:
                  <div className="mt-1 p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-emerald-400 break-all select-all border border-slate-800">
                    {window.location.origin}{window.location.pathname}
                  </div>
                </li>
                <li>
                  Copie o <strong>Client ID</strong> e cole no campo ao lado!
                </li>
              </ol>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                <Sparkles className="w-4 h-4 mb-1 text-emerald-400" />
                Com Spotify <strong>Premium</strong>: músicas <strong>100% completas</strong> tocando aqui.<br />
                Sem Premium: prévias de 30s + embed player oficial.
              </div>
            </div>

            {/* Client ID Form */}
            <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    Configurar Credenciais
                  </h2>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Desconectado
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveClientId} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Spotify Client ID
                    </label>
                    <input
                      type="text"
                      placeholder="Cole seu Client ID de 32 caracteres..."
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-green-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConnectSpotify}
                      className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Radio className="w-4 h-4" />
                      Autenticar com Spotify (OAuth PKCE)
                    </button>
                    {isConnected && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs border border-red-500/30"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ─── MY PLAYLISTS TAB ─────────────────────────────────────────── */}
        {activeTab === 'myplaylists' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Minhas Playlists ({userPlaylists.length})
              </h2>
              <button onClick={loadUserData} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Atualizar">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {userPlaylists.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando suas playlists...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {userPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => openSpotifyItem(pl, 'playlist')}
                    className="group text-left bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 transition-all hover:scale-105"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-800">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="w-8 h-8 text-green-500/50" />
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-white truncate">{pl.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{pl.totalTracks} músicas</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SAVED TRACKS TAB ─────────────────────────────────────────── */}
        {activeTab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Músicas Curtidas ({savedTracks.length})
              </h2>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-1">
                {savedTracks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Nenhuma música curtida encontrada.</div>
                ) : (
                  savedTracks.map((track, idx) => (
                    <TrackRow key={track.id} track={track} index={idx} allTracks={savedTracks} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TOP TRACKS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'top' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Suas Mais Tocadas ({topTracks.length})
              </h2>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-1">
                {topTracks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Nenhuma faixa encontrada.</div>
                ) : (
                  topTracks.map((track, idx) => (
                    <TrackRow key={track.id} track={track} index={idx} allTracks={topTracks} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── RECENT TRACKS TAB ────────────────────────────────────────────── */}
        {activeTab === 'recent' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Tocadas Recentemente ({recentTracks.length})
              </h2>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-1">
                {recentTracks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Nenhuma faixa recente encontrada.</div>
                ) : (
                  recentTracks.map((track, idx) => (
                    <TrackRow key={`${track.id}-${idx}`} track={track} index={idx} allTracks={recentTracks} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SEARCH TAB ──────────────────────────────────────────────── */}
        {activeTab === 'search' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Buscar no Catálogo Global
                </h2>
                <p className="text-xs text-slate-400">
                  {isConnected ? 'Busca via Spotify API (resultados reais)' : 'Busca via iTunes + Audius'}
                </p>
              </div>

              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: Daft Punk, Matuê, Taylor Swift..."
                  value={spotifyQuery}
                  onChange={(e) => setSpotifyQuery(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs w-60 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            {results.length > 0 && (
              <div className="space-y-1 pt-2">
                {results.map((track, idx) => (
                  <TrackRow key={track.id} track={track} index={idx} allTracks={results} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
