# 🎵 johnmusic — Tocador de Música Universal, Spotify Hub & YouTube/TikTok Importer

**johnmusic** é um player de música completo, moderno, veloz e integrado ao ecossistema do **Spotify**, **YouTube**, **TikTok** e **Web Audio API**, desenvolvido com **React 19**, **TypeScript** e **Tailwind CSS**.

![johnmusic Preview](https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Principais Funcionalidades

### 1. 🎵 Som 100% Completo & Play Instantâneo (0ms de atraso)
- **Zero Cortes de 30s**: Todas as faixas tocam na íntegra (3 a 5+ minutos) via streams de alta fidelidade Audius (320kbps MP3) e YouTube Audio Player integrado.
- **Reprodução Instantânea**: Resposta a cliques em 0 milissegundos, com enriquecimento de stream em segundo plano.
- **Auto-Recovery**: Sistema inteligente que troca de canal automaticamente caso ocorra qualquer instabilidade de conexão ou CORS, garantindo som ininterrupto.

### 2. 🎬 Importador Universal de Links (YouTube, TikTok e Spotify)
- **YouTube**: Cole qualquer link de vídeo, short ou música do YouTube para tocar instantaneamente e salvar na playlist.
- **TikTok**: Cole links de vídeos virais e faixas de áudio do TikTok para curtir diretamente no player.
- **Spotify**: Cole URLs de músicas, playlists ou álbuns do Spotify.
- **Links Diretos de Áudio**: Suporte a links `.mp3`, `.wav`, `.ogg`, `.flac`.

### 3. 🌐 Integração Completa com o Catálogo do Spotify
- **🔥 Novos Lançamentos (Live Feed)**: Álbuns e singles recém-lançados atualizados em tempo real.
- **🌟 Playlists Oficiais do Spotify**: Explore *Today's Top Hits*, *Top Brasil*, *New Music Friday*, *Mega Hits*, etc.
- **📻 Player Oficial Spotify Embed**: Modal oficial integrado para reprodução com 1 clique.
- **🔑 Spotify Connect (OAuth 2.0 PKCE)**: Conecte sua conta do Spotify Developer com máxima segurança.

### 4. 🎛️ Motor Web Audio API & Equalizador de 5 Bandas
- **Equalizador Gráfico**: Ajuste de 5 frequências (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz) com visualização da curva no Canvas.
- **Presets Rápidos**: *Bass Boost*, *Eletrônica/EDM*, *Rock*, *Pop Hits*, *Vocal Claro*, *Jazz*, *Chillout/Lofi* e *Flat*.
- **Visualizador em Tempo Real**: *Barras Neon*, *Osciloscópio*, *Radial Cósmico* e *Matrix Digital*.

### 5. 📂 Sistema de Playlists Completo & Exportação
- Crie, renomeie, edite capas e descrições com o modal de edição.
- Filtre músicas internamente em cada playlist.
- Exporte suas playlists em formato **JSON** para backup ou compartilhamento.
- Reordene, adicione e remova faixas com 1 clique.

### 6. 💾 Persistência Completa Local (`localStorage`)
- Salva automaticamente: favoritos, playlists criadas, histórico de reprodução, ajustes de equalizador, volume, última música e modo visual.

### 7. 📂 Arquivos Locais (Músicas do Computador)
- Arraste e solte arquivos ou pastas inteiras (**MP3, WAV, FLAC, OGG, AAC, M4A**).
- Leitura automática de tags **ID3** e capas embutidas.

---

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm run dev
```

O servidor iniciará exposto para a rede local (`0.0.0.0`):
- **Local**: `http://localhost:5173/`
- **Dispositivos na Rede (Celular, TV, outros PCs)**: `http://<seu-ip-local>:5173/`

### 3. Gerar Build de Produção
```bash
npm run build
```

---

Desenvolvido especialmente para o **johnmusic**! 🎧🚀
