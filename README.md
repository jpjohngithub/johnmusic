# 🎵 johnmusic — Tocador de Música Profissional

**johnmusic** é um player de música moderno, responsivo e poderoso inspirado no Spotify, desenvolvido com **React 18**, **TypeScript**, **Tailwind CSS** e a **Web Audio API**.

![johnmusic Preview](https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Principais Funcionalidades

### 1. 🎛️ Motor de Áudio Web Audio API & Equalizador
- **Equalizador de 5 Bandas**: Ajuste de frequências (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz) com curva de resposta desenhada em tempo real no Canvas.
- **Presets Rápidos**: Bass Boost, Eletrônica/EDM, Rock, Pop Hits, Vocal Claro, Jazz, Chillout/Lofi e Flat.
- **Visualizador de Frequências em Tempo Real**:
  - *Barras Neon* com reflexo espelhado.
  - *Osciloscópio* em tempo real.
  - *Radial Cósmico* com pulso de partículas.
  - *Matrix Digital* no estilo cyberpunk.

### 2. 📂 Importação de Arquivos Locais (Músicas do seu PC)
- Arraste e solte arquivos ou pastas inteiras do seu computador (**MP3, WAV, FLAC, OGG, AAC, M4A**).
- Leitura automática de tags **ID3** (título, artista, álbum e capa embutida).
- Reprodução local com 100% de privacidade (nenhum arquivo é enviado para servidores externos).

### 3. 🌐 Integração com Spotify & Busca Global na Nuvem
- **Spotify Developer Connect**: Autenticação com OAuth 2.0 PKCE usando seu Client ID do Spotify Developer Dashboard.
- **Busca Online Global**: Encontre e escute prévias musicais de milhões de artistas e faixas do mundo todo direto no app.

### 4. 🎤 Modo Letras Sincronizadas (Karaokê)
- Visualização imersiva em tela cheia com letras sincronizadas no tempo exato da música.
- Rolagem automática focada no verso atual.

### 5. 📑 Gerenciamento de Playlists & Biblioteca
- Crie e personalize playlists salvas no `localStorage`.
- Sistema de **Músicas Curtidas (Favoritos)** com efeito comemorativo.
- Histórico dinâmico de reprodução da sessão.
- Fila de reprodução (Queue) interativa e editável.
- **Temporizador de Sono (Sleep Timer)**: Programe para pausar a música em 15, 30, 45 ou 60 minutos.

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

### 2. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`

### 3. Gerar Build de Produção
```bash
npm run build
```

---

Desenvolvido especialmente para o **johnmusic**! 🎧🚀
