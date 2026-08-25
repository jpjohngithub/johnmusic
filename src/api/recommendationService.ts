// ============================================================
// RECOMMENDATION SERVICE — Motor Inteligente de Recomendações
// Analisa Playlists Personalizadas, Histórico de Reprodução e Buscas
// para gerar Mixes Exclusivos, Músicas Semelhantes e Playlists Recomendadas
// ============================================================

import { searchYouTubeKeyless, searchYouTubePlaylistsKeyless } from './youtubeSearchService'
import { executeUniversalSearch, type SearchTrackItem } from './universalSearchService'
import { useLibraryStore } from '@/store/libraryStore'
import { useHistoryStore } from '@/store/historyStore'
import type { PersonalizedMix, RecommendedPlaylist, QueueItem } from '@/types'

export interface RecommendationFeed {
  heroArtist: string | null
  personalizedMixes: PersonalizedMix[]
  recommendedTracks: SearchTrackItem[]
  recommendedPlaylists: RecommendedPlaylist[]
  becauseYouListened: {
    artistName: string
    tracks: SearchTrackItem[]
  } | null
  recentlyPlayed: QueueItem[]
  topKeywords: string[]
}

/**
 * Paletas vibrantes de gradientes para as capas dos Mixes Personalizados
 */
const MIX_GRADIENTS = [
  'from-purple-600 via-indigo-600 to-blue-700',
  'from-emerald-500 via-teal-600 to-cyan-800',
  'from-rose-500 via-pink-600 to-purple-800',
  'from-amber-500 via-orange-600 to-red-700',
  'from-fuchsia-600 via-pink-500 to-rose-700',
  'from-cyan-500 via-blue-600 to-indigo-900',
]

/**
 * Gera ou recupera o feed completo de recomendações personalizadas
 */
export async function getPersonalizedRecommendations(): Promise<RecommendationFeed> {
  const library = useLibraryStore.getState()
  const history = useHistoryStore.getState()

  const topArtists = history.getTopArtists()
  const topKeywords = history.getTopKeywords()
  const customPlaylists = library.customPlaylists || []
  const historyItems = history.history || []

  // Extrai artistas das playlists personalizadas
  const playlistArtists: string[] = []
  for (const pl of customPlaylists) {
    for (const item of pl.items) {
      if (item.subtitle && !playlistArtists.includes(item.subtitle)) {
        playlistArtists.push(item.subtitle.replace(/ - Topic/i, '').trim())
      }
    }
  }

  // Combina todas as preferências do usuário com prioridade
  const allPreferredArtists = Array.from(
    new Set([...topArtists, ...playlistArtists, ...topKeywords])
  ).filter((a) => a && a.length > 1 && !a.startsWith('http'))

  // Fallback caso o usuário seja novo e ainda não tenha histórico
  const baseArtists = allPreferredArtists.length > 0
    ? allPreferredArtists
    : ['The Weeknd', 'Taylor Swift', 'Billie Eilish', 'Coldplay', 'Drake', 'Dua Lipa', 'Alok', 'Post Malone']

  const heroArtist = baseArtists[0] || 'Seus Favoritos'

  // Monta lista de recentemente tocadas
  const recentlyPlayed: QueueItem[] = historyItems.slice(0, 12).map((h) => ({
    id: h.id,
    source: h.source,
    title: h.title,
    subtitle: h.subtitle,
    imageUrl: h.imageUrl,
    videoId: h.videoId,
    audioUrl: h.audioUrl,
  }))

  try {
    // 1. Gera Mixes Personalizados (Feito para Você)
    const personalizedMixes: PersonalizedMix[] = []

    // Mix 1: Focado no Artista Top #1
    if (baseArtists[0]) {
      const art1 = baseArtists[0]
      const results = await searchYouTubeKeyless(`${art1} melhores sucessos mix`, 8)
      personalizedMixes.push({
        id: `mix-artist-${encodeURIComponent(art1)}`,
        title: `Mix de ${art1}`,
        description: `Grandes sucessos, acústicos e faixas essenciais de ${art1}.`,
        coverGradient: MIX_GRADIENTS[0],
        tags: [art1, 'Hits', 'Essencial'],
        coverUrl: results[0]?.thumbnailUrl || '',
        items: results.map((r) => ({
          id: r.videoId,
          source: 'youtube',
          title: r.title,
          subtitle: r.channelTitle,
          imageUrl: r.thumbnailUrl,
          videoId: r.videoId,
        })),
      })
    }

    // Mix 2: Focado no Artista Top #2 ou Gênero
    if (baseArtists[1]) {
      const art2 = baseArtists[1]
      const results2 = await searchYouTubeKeyless(`${art2} playlist top music`, 8)
      personalizedMixes.push({
        id: `mix-artist-${encodeURIComponent(art2)}`,
        title: `Mix de ${art2}`,
        description: `As mais tocadas e novidades de ${art2}.`,
        coverGradient: MIX_GRADIENTS[1],
        tags: [art2, 'Top Faixas', 'Novidades'],
        coverUrl: results2[0]?.thumbnailUrl || '',
        items: results2.map((r) => ({
          id: r.videoId,
          source: 'youtube',
          title: r.title,
          subtitle: r.channelTitle,
          imageUrl: r.thumbnailUrl,
          videoId: r.videoId,
        })),
      })
    }

    // Mix 3: Descobertas & Vibes da Semana
    const queryVibe = baseArtists.slice(0, 3).join(' ') || 'pop hits'
    const resultsVibe = await searchYouTubeKeyless(`${queryVibe} vibe mix 2026`, 8)
    personalizedMixes.push({
      id: 'mix-descobertas',
      title: 'Descobertas da Semana',
      description: 'Músicas e lançamentos alinhados com o seu estilo musical.',
      coverGradient: MIX_GRADIENTS[2],
      tags: ['Descobertas', 'Algoritmo', 'Lançamentos'],
      coverUrl: resultsVibe[0]?.thumbnailUrl || '',
      items: resultsVibe.map((r) => ({
        id: r.videoId,
        source: 'youtube',
        title: r.title,
        subtitle: r.channelTitle,
        imageUrl: r.thumbnailUrl,
        videoId: r.videoId,
      })),
    })

    // Mix 4: Mix Treino & Energia
    const resultsEnergy = await searchYouTubeKeyless(`${baseArtists[0] || 'eletronica'} workout remix bass`, 8)
    personalizedMixes.push({
      id: 'mix-energia',
      title: 'Mix Energia & Treino',
      description: 'Batidas aceleradas e remixes de alta energia.',
      coverGradient: MIX_GRADIENTS[3],
      tags: ['Energia', 'Treino', 'Bass'],
      coverUrl: resultsEnergy[0]?.thumbnailUrl || '',
      items: resultsEnergy.map((r) => ({
        id: r.videoId,
        source: 'youtube',
        title: r.title,
        subtitle: r.channelTitle,
        imageUrl: r.thumbnailUrl,
        videoId: r.videoId,
      })),
    })

    // 2. Músicas Recomendadas (Porque você ouviu [Artista])
    let becauseYouListened: RecommendationFeed['becauseYouListened'] = null
    if (baseArtists[0]) {
      const targetArtist = baseArtists[0]
      const relatedTracks = await executeUniversalSearch(`${targetArtist} músicas recomendadas`, false)
      becauseYouListened = {
        artistName: targetArtist,
        tracks: (relatedTracks.allCombined || []).slice(0, 8),
      }
    }

    // 3. Músicas Recomendadas Globais
    const combinedQuery = baseArtists.slice(0, 2).join(' ')
    const trackRecs = await executeUniversalSearch(`${combinedQuery} top hits`, false)
    const recommendedTracks = (trackRecs.allCombined || []).slice(0, 10)

    // 4. Playlists Recomendadas no YouTube & Spotify
    const playlistRecs = await searchYouTubePlaylistsKeyless(
      `${baseArtists[0] || 'melhores'} playlist hits 2026`,
      6
    )

    const recommendedPlaylists: RecommendedPlaylist[] = playlistRecs.map((p) => ({
      id: p.playlistId,
      name: p.title,
      description: `Por ${p.channelTitle}`,
      source: 'youtube',
      coverUrl: p.thumbnailUrl,
      itemCount: 25,
      creatorName: p.channelTitle,
      url: p.url,
    }))

    return {
      heroArtist,
      personalizedMixes,
      recommendedTracks,
      recommendedPlaylists,
      becauseYouListened,
      recentlyPlayed,
      topKeywords: topKeywords.slice(0, 8),
    }
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error)
    return {
      heroArtist,
      personalizedMixes: [],
      recommendedTracks: [],
      recommendedPlaylists: [],
      becauseYouListened: null,
      recentlyPlayed,
      topKeywords: [],
    }
  }
}
