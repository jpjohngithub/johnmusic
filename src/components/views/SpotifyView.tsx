import React, { useState, useEffect } from 'react';
import { SpotifyService } from '../../services/spotifyService';
import type { Track } from '../../types/music';
import { TrackRow } from '../common/TrackRow';
import { 
  Radio, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';

export const SpotifyView: React.FC = () => {
  const [clientId, setClientId] = useState(() => SpotifyService.getStoredClientId());
  const [isConnected, setIsConnected] = useState(() => !!SpotifyService.getStoredToken());
  const [spotifyQuery, setSpotifyQuery] = useState('Queen');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Check if we returned from Spotify OAuth redirect with code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && clientId) {
      const redirectUri = window.location.origin + window.location.pathname;
      setStatusMessage('Autenticando com Spotify...');
      SpotifyService.exchangeCodeForToken(code, clientId, redirectUri)
        .then(() => {
          setIsConnected(true);
          setStatusMessage('Conectado com sucesso ao Spotify!');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          setStatusMessage(`Falha na autenticação: ${err.message}`);
        });
    }
  }, [clientId]);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;
    SpotifyService.setStoredClientId(clientId);
    setStatusMessage('Client ID salvo com sucesso.');
  };

  const handleConnectSpotify = async () => {
    if (!clientId.trim()) {
      setStatusMessage('Por favor, informe seu Client ID do Spotify Developer.');
      return;
    }
    SpotifyService.setStoredClientId(clientId);
    const redirectUri = window.location.origin + window.location.pathname;
    try {
      const authUrl = await SpotifyService.getAuthUrl(clientId.trim(), redirectUri);
      window.location.href = authUrl;
    } catch (e: any) {
      setStatusMessage(`Erro ao iniciar autenticação: ${e.message}`);
    }
  };

  const handleDisconnect = () => {
    SpotifyService.disconnect();
    setIsConnected(false);
    setStatusMessage('Desconectado do Spotify.');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spotifyQuery.trim()) return;

    setIsLoading(true);
    try {
      const tracks = await SpotifyService.searchOnlineTracks(spotifyQuery);
      setResults(tracks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform initial search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-green-950/60 border border-green-500/20 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold border border-green-500/30">
              <Radio className="w-3.5 h-3.5" />
              <span>Spotify Developer API & Cloud Stream</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Spotify Connect no johnmusic
            </h1>

            <p className="text-xs sm:text-sm text-slate-300">
              Conecte sua conta do Spotify Developer para acessar o catálogo global, suas playlists salvas e tocar prévias de músicas de qualquer artista do mundo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-400" />
              Spotify Developer Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Connection Card & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step-by-step tutorial */}
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
              Nas configurações do App no Spotify, adicione a <strong>Redirect URI</strong>:
              <div className="mt-1 p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-emerald-400 break-all select-all border border-slate-800">
                {window.location.origin}{window.location.pathname}
              </div>
            </li>
            <li>
              Copie o seu <strong>Client ID</strong> e cole no campo ao lado para conectar!
            </li>
          </ol>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            <Sparkles className="w-4 h-4 mb-1 text-emerald-400" />
            Mesmo sem uma chave Spotify configurada, o johnmusic já busca e reproduz prévias de alta qualidade de milhões de faixas pela busca global online!
          </div>
        </div>

        {/* Client ID Form */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Configurar Credenciais do Spotify
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
                  placeholder="Cole seu Client ID de 32 caracteres do Spotify..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-green-500 transition-all"
                />
              </div>

              {statusMessage && (
                <div className="text-xs text-emerald-400 font-medium">{statusMessage}</div>
              )}

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
                    className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs border border-red-500/30 transition-all"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Online Global Spotify Track Search */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Explorar Faixas do Catálogo Global
            </h2>
            <p className="text-xs text-slate-400">Busque artistas e ouça prévias instantâneas no johnmusic</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex: Daft Punk, Queen, Billie Eilish..."
              value={spotifyQuery}
              onChange={(e) => setSpotifyQuery(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs w-60 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        </div>

        {results.length > 0 ? (
          <div className="space-y-1 pt-2">
            {results.map((track, idx) => (
              <TrackRow 
                key={track.id} 
                track={track} 
                index={idx} 
                allTracks={results} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma faixa encontrada no momento.
          </div>
        )}
      </div>
    </div>
  );
};
