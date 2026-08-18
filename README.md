# 🎵 johnmusic — Tocador de Música Profissional & Spotify Hub

**johnmusic** é um tocador de música web completo, veloz e moderno integrado ao ecossistema do **Spotify**, desenvolvido com **React 19**, **TypeScript**, **Tailwind CSS** e **Web Audio API**.

![johnmusic Preview](https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Principais Funcionalidades

### 1. 🌐 Integração Completa com o Spotify
- **🔥 Novos Lançamentos (Live Feed)**: Novos álbuns e músicas lançados no Spotify aparecem automaticamente na tela inicial.
- **🌟 Playlists Oficiais do Spotify**: Explore *Today's Top Hits*, *Top Brasil*, *New Music Friday*, *Mega Hits*, etc.
- **⚡ Importador Universal de Links do Spotify**: Cole qualquer URL de música, playlist ou álbum do Spotify (ex: `https://open.spotify.com/playlist/...`) para carregar e tocar na hora!
- **📻 Player Oficial Spotify Embed**: Modal incorporado oficial do Spotify para reprodução de faixas e álbuns completos.
- **🔑 Spotify Connect (OAuth 2.0 PKCE)**: Conecte sua conta do Spotify Developer com segurança para acessar todo o catálogo global.

### 2. 🎛️ Motor de Áudio Web Audio API & Equalizador
- **Equalizador de 5 Bandas**: Ajuste de frequências (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz) com curva gráfica de resposta em tempo real.
- **Presets Rápidos**: *Bass Boost*, *Eletrônica/EDM*, *Rock*, *Pop Hits*, *Vocal Claro*, *Jazz*, *Chillout/Lofi* e *Flat*.
- **Visualizador Espectral em Tempo Real (Canvas)**:
  - *Barras Neon* com reflexo espelhado.
  - *Osciloscópio* em tempo real.
  - *Radial Cósmico* com pulso de partículas.
  - *Matrix Digital* no estilo cyberpunk.

### 3. 💾 Persistência Completa Local (`localStorage`)
- **Músicas Curtidas (Favoritos)**
- **Playlists Customizadas Criadas**
- **Histórico de Reprodução**
- **Presets e Ganhos do Equalizador**
- **Nível de Volume, Mute, Shuffle e Repeat**
- **Última Faixa Tocada**
- **Modo Visual do Player**

### 4. 📂 Arquivos Locais do Computador (PC)
- Arraste e solte arquivos ou pastas inteiras do seu computador (**MP3, WAV, FLAC, OGG, AAC, M4A**).
- Leitura automática de metadados e capas embutidas (**ID3 tags**).
- Reprodução local 100% privada e sem limite de tamanho.

### 5. 🎤 Modo Letras Sincronizadas (Karaokê)
- Visualização imersiva em tela cheia com letras sincronizadas no tempo exato da música.

### 6. ⌨️ Atalhos de Teclado
- `Espaço`: Tocar / Pausar
- `→ / ←`: Avançar / Retroceder 5 segundos
- `↑ / ↓`: Aumentar / Diminuir volume
- `M`: Mutar / Desmutar
- `L`: Favoritar / Curtir faixa
- `N`: Próxima música
- `P`: Música anterior

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

O servidor iniciará exposto para toda a rede local:
- **Local**: `http://localhost:5173/`
- **Network (Rede Wi-Fi / Celular / Outros Dispositivos)**: `http://<seu-ip-local>:5173/`

### 3. Gerar Build de Produção
```bash
npm run build
```

---

Desenvolvido especialmente para o **johnmusic**! 🎧🚀
