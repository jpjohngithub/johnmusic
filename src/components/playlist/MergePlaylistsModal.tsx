import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GitMerge,
  Music2,
  Check,
  X,
  Sparkles,
  Layers,
  Trash2,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import { cn } from '@/lib/utils'

interface MergePlaylistsModalProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedPlaylistId?: string
  onSuccess?: (mergedPlaylistId: string) => void
}

export function MergePlaylistsModal({
  isOpen,
  onClose,
  initialSelectedPlaylistId,
  onSuccess,
}: MergePlaylistsModalProps) {
  const navigate = useNavigate()
  const { customPlaylists, mergeCustomPlaylists } = useLibraryStore()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [deleteSources, setDeleteSources] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Pre-seleciona a playlist inicial se fornecida
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedPlaylistId) {
        setSelectedIds([initialSelectedPlaylistId])
        const other = customPlaylists.find((p) => p.id !== initialSelectedPlaylistId)
        if (other) setTargetPlaylistId(other.id)
      } else {
        setSelectedIds(customPlaylists.slice(0, 2).map((p) => p.id))
        if (customPlaylists[0]) setTargetPlaylistId(customPlaylists[0].id)
      }
      setNewPlaylistName('')
      setDeleteSources(false)
      setIsProcessing(false)
    }
  }, [isOpen, initialSelectedPlaylistId, customPlaylists])

  // Playlists selecionadas
  const selectedPlaylists = useMemo(() => {
    return customPlaylists.filter((p) => selectedIds.includes(p.id))
  }, [customPlaylists, selectedIds])

  // Sugestão de nome automático baseado nas playlists selecionadas
  const suggestedName = useMemo(() => {
    if (selectedPlaylists.length === 0) return 'Mix Combinado'
    if (selectedPlaylists.length === 1) return `Mix de ${selectedPlaylists[0].name}`
    return `Mix: ${selectedPlaylists.map((p) => p.name).slice(0, 3).join(' + ')}${selectedPlaylists.length > 3 ? '...' : ''}`
  }, [selectedPlaylists])

  // Contagem total de faixas e estimativa de faixas únicas
  const { totalCount, uniqueCount } = useMemo(() => {
    let total = 0
    const seen = new Set<string>()

    for (const pl of selectedPlaylists) {
      total += pl.items.length
      for (const item of pl.items) {
        const key = item.videoId
          ? `yt:${item.videoId}`
          : item.uri
          ? `uri:${item.uri}`
          : `title:${item.title.toLowerCase().trim()}:${(item.subtitle || '').toLowerCase().trim()}`
        seen.add(key)
      }
    }

    return { totalCount: total, uniqueCount: seen.size }
  }, [selectedPlaylists])

  if (!isOpen) return null

  const toggleSelectPlaylist = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === customPlaylists.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(customPlaylists.map((p) => p.id))
    }
  }

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.length === 0) return
    if (targetMode === 'new' && selectedIds.length < 2) return
    if (targetMode === 'existing' && !targetPlaylistId) return

    setIsProcessing(true)

    try {
      const finalName = newPlaylistName.trim() || suggestedName
      const merged = mergeCustomPlaylists(selectedIds, finalName, {
        removeDuplicates,
        targetPlaylistId: targetMode === 'existing' ? targetPlaylistId : undefined,
        deleteSources,
      })

      if (merged) {
        onSuccess?.(merged.id)
        onClose()
        navigate(`/playlist/${merged.id}`)
      }
    } catch (err) {
      console.error('Erro ao mesclar playlists:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl bg-[#141414] border border-white/10 p-6 shadow-2xl space-y-5 animate-slide-up select-none max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600/30 to-spotify-green/30 border border-purple-500/30 text-spotify-green flex items-center justify-center shadow-lg shadow-purple-500/10 flex-shrink-0">
              <GitMerge size={22} className="text-spotify-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Juntar Playlists</span>
                <span className="px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-[10px] font-extrabold uppercase">
                  Mesclador
                </span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                Una músicas de várias playlists em uma coleção só sem duplicatas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleMergeSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Seção 1: Seleção de Playlists */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white text-xs font-bold uppercase tracking-wider text-white/60">
                1. Selecione as Playlists ({selectedIds.length} selecionadas)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-spotify-green hover:underline font-semibold"
              >
                {selectedIds.length === customPlaylists.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>
            </div>

            {customPlaylists.length === 0 ? (
              <p className="text-white/40 text-xs py-4 text-center">
                Você ainda não tem playlists criadas para juntar.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-black/40 rounded-2xl border border-white/5">
                {customPlaylists.map((pl) => {
                  const isSelected = selectedIds.includes(pl.id)
                  return (
                    <div
                      key={pl.id}
                      onClick={() => toggleSelectPlaylist(pl.id)}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border text-left',
                        isSelected
                          ? 'bg-spotify-green/15 border-spotify-green/50 shadow-sm'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                      )}
                    >
                      {/* Checkbox Icon */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0',
                          isSelected
                            ? 'bg-spotify-green border-spotify-green text-black'
                            : 'border-white/20 bg-black/40'
                        )}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                      </div>

                      {/* Capa */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center border border-white/10">
                        {pl.coverUrl ? (
                          <img src={pl.coverUrl} alt={pl.name} className="w-full h-full object-cover" />
                        ) : (
                          <Music2 size={16} className="text-white/30" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-bold truncate leading-snug">{pl.name}</p>
                        <p className="text-white/40 text-[10px] truncate">{pl.items.length} faixas</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção 2: Destino da Mesclagem */}
          <div className="space-y-3 pt-1 border-t border-white/5">
            <label className="text-white text-xs font-bold uppercase tracking-wider text-white/60">
              2. Onde salvar as músicas combinadas?
            </label>

            {/* Alternância de Modo (Nova Playlist vs Existente) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setTargetMode('new')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all',
                  targetMode === 'new'
                    ? 'bg-white/15 text-white shadow-md'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Plus size={14} />
                <span>Criar Nova Playlist</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('existing')}
                disabled={customPlaylists.length <= 1}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30',
                  targetMode === 'existing'
                    ? 'bg-white/15 text-white shadow-md'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Layers size={14} />
                <span>Em Playlist Existente</span>
              </button>
            </div>

            {/* Input Nome da Nova Playlist */}
            {targetMode === 'new' ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder={suggestedName}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/20"
                />
                <p className="text-white/30 text-[11px] px-1">
                  Deixe em branco para usar o nome sugerido: <strong className="text-white/60">{suggestedName}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={targetPlaylistId}
                  onChange={(e) => setTargetPlaylistId(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-spotify-green cursor-pointer"
                >
                  {customPlaylists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.items.length} faixas atuais)
                    </option>
                  ))}
                </select>
                <p className="text-white/30 text-[11px] px-1">
                  As músicas das playlists selecionadas serão adicionadas ao final desta playlist.
                </p>
              </div>
            )}
          </div>

          {/* Seção 3: Opções Inteligentes */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <label className="text-white text-xs font-bold uppercase tracking-wider text-white/60">
              3. Preferências de Combinação
            </label>

            <div className="space-y-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
              {/* Toggle Remover Duplicatas */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded accent-spotify-green cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                    <ShieldCheck size={14} className="text-spotify-green" />
                    <span>Remover faixas duplicadas</span>
                  </div>
                  <p className="text-white/40 text-[11px]">
                    Identifica músicas repetidas por ID e nome para manter a playlist limpa.
                  </p>
                </div>
              </label>

              {/* Toggle Excluir Origens */}
              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-white/5">
                <input
                  type="checkbox"
                  checked={deleteSources}
                  onChange={(e) => setDeleteSources(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                    <Trash2 size={13} />
                    <span>Excluir playlists de origem após juntar</span>
                  </div>
                  <p className="text-white/40 text-[11px]">
                    Apaga as playlists antigas mantendo apenas a nova playlist combinada.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Resumo ao Vivo */}
          {selectedPlaylists.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-spotify-green/10 to-transparent border border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white/80">
                <Sparkles size={16} className="text-purple-400" />
                <span>
                  Total:{' '}
                  <strong className="text-white">
                    {removeDuplicates ? uniqueCount : totalCount} músicas
                  </strong>{' '}
                  {removeDuplicates && totalCount > uniqueCount && (
                    <span className="text-spotify-green font-semibold">
                      ({totalCount - uniqueCount} duplicata{totalCount - uniqueCount > 1 ? 's' : ''} removida{totalCount - uniqueCount > 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
              <span className="text-white/40 font-mono text-[11px]">
                {selectedPlaylists.length} playlist{selectedPlaylists.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isProcessing ||
                selectedIds.length === 0 ||
                (targetMode === 'new' && selectedIds.length < 2) ||
                (targetMode === 'existing' && !targetPlaylistId)
              }
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-purple-400 text-black font-bold text-xs transition-all shadow-lg shadow-spotify-green/20 disabled:opacity-40 active:scale-95"
            >
              <GitMerge size={15} />
              <span>
                {isProcessing
                  ? 'Mesclando...'
                  : targetMode === 'new'
                  ? 'Juntar em Nova Playlist'
                  : 'Adicionar à Playlist'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
