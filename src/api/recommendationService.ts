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
export interface SimilarTrack {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  queryUsed: string
}

/**
 * Extrai artistas únicos das faixas da playlist para identificação de estilo
 */
export function extractPlaylistArtists(items: Array<{ subtitle?: string; title?: string }>): string[] {
  const artists: string[] = []
  for (const item of items) {
    if (item.subtitle) {
      const clean = item.subtitle
        .replace(/ - Topic/i, '')
        .replace(/VEVO/i, '')
        .replace(/Official\s*(Audio|Video|Music\s*Video)?/gi, '')
        .trim()
      if (clean && clean.length > 1 && !artists.includes(clean) && !clean.startsWith('http')) {
        artists.push(clean)
      }
    }
  }
  return artists.slice(0, 6)
}

/**
 * Analisa os artistas/títulos de uma playlist personalizada e retorna
 * músicas similares do YouTube. Retorna até 20 resultados misturados.
 */
export async function getSimilarTracksForPlaylist(
  playlistItems: Array<{ title: string; subtitle?: string; videoId?: string }>,
  existingVideoIds: Set<string> = new Set(),
  seed?: number
): Promise<SimilarTrack[]> {
  if (playlistItems.length === 0) return []

  // Extrai artistas únicos das músicas da playlist
  const artists = extractPlaylistArtists(playlistItems)
  const titles: string[] = []

  for (const item of playlistItems) {
    if (item.title) {
      titles.push(item.title)
    }
  }

  // Determina o estilo usando os artistas mais frequentes
  const topArtists = artists.slice(0, 5)

  // Queries de busca variadas para gerar diversidade
  const querySeed = seed ?? Date.now()
  const queryVariants = [
    `${topArtists[0] || titles[0]} similar artists mix`,
    `if you like ${topArtists[0] || ''} you'll love`,
    `${topArtists.slice(0, 2).join(' ')} vibe playlist`,
    `${topArtists[1] || topArtists[0] || ''} related music`,
    `${topArtists.slice(0, 3).join(' ')} genre mix`,
    `songs like ${titles[0] || ''}`,
    `${topArtists[0] || ''} style recommendation`,
    `${topArtists.slice(0, 2).join(' ')} best tracks`,
  ]

  // Seleciona 3 queries baseadas no seed (para variar ao recarregar)
  const selectedQueries: string[] = []
  const numQueries = Math.min(3, queryVariants.length)
  for (let i = 0; i < numQueries; i++) {
    const idx = (querySeed + i * 3) % queryVariants.length
    const q = queryVariants[idx]
    if (q.trim() && !selectedQueries.includes(q)) selectedQueries.push(q)
  }
  if (selectedQueries.length === 0) selectedQueries.push(`${topArtists[0] || 'music'} mix`)

  // Busca paralela para as queries selecionadas
  const results = await Promise.allSettled(
    selectedQueries.map((q) => searchYouTubeKeyless(q, 8))
  )

  const allTracks: SimilarTrack[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      for (const r of result.value) {
        if (!existingVideoIds.has(r.videoId) && !allTracks.find((t) => t.videoId === r.videoId)) {
          allTracks.push({
            videoId: r.videoId,
            title: r.title,
            channelTitle: r.channelTitle,
            thumbnailUrl: r.thumbnailUrl,
            queryUsed: selectedQueries[i] || '',
          })
        }
      }
    }
  })

  // Embaralha com base no seed para variar ao recarregar
  for (let i = allTracks.length - 1; i > 0; i--) {
    const j = Math.floor((((querySeed + i * 7) % 97) / 97) * (i + 1))
    ;[allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]]
  }

  return allTracks.slice(0, 20)
}
