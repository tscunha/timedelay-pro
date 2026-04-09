# ⏱️ TimeShift Pro — SRT Broadcast Delay Suite

> **Infraestrutura profissional de time-delay e roteamento de vídeo via SRT, com DVR, auditoria e controle multi-tenant.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Nimble Streamer](https://img.shields.io/badge/Nimble-4.2-blue)](https://wmspanel.com)
[![SRT Protocol](https://img.shields.io/badge/Protocol-SRT-orange)](https://www.haivision.com/products/srt-secure-reliable-transport/)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação Local (Dev)](#instalação-local-dev)
5. [Configuração da VPS](#configuração-da-vps)
6. [Como Usar](#como-usar)
7. [Portas e Endpoints](#portas-e-endpoints)
8. [Systemd Watchdog](#systemd-watchdog)
9. [Deploy com Docker](#deploy-com-docker)
10. [Documentação Adicional](#documentação-adicional)

---

## Visão Geral

O **TimeShift Pro** é uma suíte de operações de broadcast que permite:

- **TimeShift**: atraso de sinal SRT com precisão de segundos (ex: 1h de delay para fusos horários)
- **REMI**: roteamento de sinal para operações remotas
- **Simulcast**: distribuição simultânea para múltiplas plataformas
- **Compliance**: gravação contínua para auditoria e conformidade regulatória

### Caso de uso principal

```
Encoder (encoder hardware/OBS/vMix)
    │ SRT 11 Mbps
    ▼
Nimble Streamer (VPS)
    │ DVR Ring Buffer (1h)
    ▼
FFmpeg Daemons (systemd watchdog)
    │ SRT passthrough -c copy (zero recompressão)
    ├──► :11001 → FEED GMT-4 (Brasília -1h)
    ├──► :11002 → FEED GMT-5 (Manaus -2h)
    └──► :11003 → Teste -10min
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VPS Linux (Ubuntu 22.04)                     │
│                                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐   │
│  │   Nimble Streamer   │    │     FFmpeg Daemons (systemd)     │   │
│  │                     │    │                                  │   │
│  │  SRT Pull Caller ◄──┼────┼── Encoder (189.x.x.x:30114)     │   │
│  │  DVR Ring Buffer    │    │                                  │   │
│  │  HLS :8081          │    │  ffmpeg-feed-gmt4  → SRT :11001  │   │
│  │                     │───►│  ffmpeg-feed-gmt5  → SRT :11002  │   │
│  └─────────────────────┘    │  ffmpeg-feed-test  → SRT :11003  │   │
│                             │  ffmpeg-ts001      → SRT :10001  │   │
│                             │  ffmpeg-ts002      → SRT :10012  │   │
│                             └──────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              TimeShift Pro API (Fastify + SQLite)           │   │
│  │              Painel React (Vite)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

Para a arquitetura completa com diagramas Mermaid, veja [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Pré-requisitos

### Desenvolvimento local

- Node.js 18+
- npm 9+
- FFmpeg (opcional para testes locais)

### VPS (produção)

- Ubuntu 22.04 LTS
- Nimble Streamer 4.2+ com módulo SRT
- FFmpeg 4.4+
- 4 GB RAM mínimo
- 100 GB disco (para DVR de múltiplos streams)

---

## Instalação Local (Dev)

```bash
# 1. Clone o repositório
git clone https://github.com/tscunha/timedelay-pro.git
cd timedelay-pro

# 2. Instale dependências (raiz + cliente)
npm install
cd client && npm install && cd ..

# 3. Configure o ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Inicie o servidor de desenvolvimento
npm run dev
# API: http://localhost:3000
# UI:  http://localhost:5173
```

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia API em modo desenvolvimento (ts-node) |
| `npm run build` | Compila backend TypeScript |
| `npm run build:all` | Compila backend + frontend (produção) |
| `npm start` | Inicia servidor compilado |

---

## Configuração da VPS

### 1. Instalar Nimble Streamer

```bash
wget https://nimblestreamer.com/nimble_streamer_ubuntu.sh
chmod +x nimble_streamer_ubuntu.sh
sudo ./nimble_streamer_ubuntu.sh
sudo apt-get install nimble-srt
```

### 2. Configurar via WMSPanel

1. Acesse [wmspanel.com](https://wmspanel.com)
2. Adicione o servidor pela IP pública da VPS
3. Em **Nimble Streamer → Live streams settings → MPEGTS In**:
   - Clique **Add SRT stream**
   - Receive mode: **Pull** (Caller)
   - Remote host: IP do encoder
   - Remote port: porta do encoder
   - Stream name: `feed_sbt_sp` / Application: `live`
4. Em **DVR**: adicione entrada para `live/feed_sbt_sp` com 1 hora

### 3. Instalar serviços systemd (watchdog)

```bash
# Copie os arquivos de serviço para a VPS
scp docs/systemd/*.service root@SUA_VPS:/etc/systemd/system/

# Ative e inicie
systemctl daemon-reload
systemctl enable --now ffmpeg-feed-gmt4 ffmpeg-feed-test10m
```

Veja exemplos completos em [`docs/systemd/`](./docs/systemd/).

---

## Como Usar

### Acessar o painel

```
http://localhost:5173  (desenvolvimento)
http://SUA_VPS:3000   (produção)
```

### Fluxo de uso

1. **Configure a API Key** → botão `[ ⚙ API KEY ]` no header
2. **Crie um canal** → `[ + NOVO CANAL ]` com nome e Stream ID do Nimble
3. **Crie um TimeShift** → aba `[1] TIMESHIFT`, selecione canal, defina segundos e porta SRT
4. **Clique ENGAGE** → daemon FFmpeg é spawnado automaticamente
5. **Copie o link SRT** → `srt://SUA_VPS:PORTA` para usar no decodificador

---

## Portas e Endpoints

### SRT (conectar decodificador hardware/software)

| Canal | Porta | Delay |
|-------|-------|-------|
| FEED SBT GMT-4 | `:11001` | -1 hora |
| FEED SBT GMT-5 | `:11002` | -2 horas |
| Teste 10min | `:11003` | -10 minutos |
| ts_001 | `:10001` | -30 minutos |
| ts_002 | `:10012` | -60 segundos |

```bash
# Testar no ffplay
ffplay srt://72.60.142.3:11003

# Testar no VLC
vlc srt://72.60.142.3:11001
```

### HLS (player web / VLC)

```
# Ao vivo
http://72.60.142.3:8081/live/feed_sbt_sp/playlist.m3u8

# Com delay de 10 minutos
http://72.60.142.3:8081/live/feed_sbt_sp/playlist_dvr_timeshift-600.m3u8

# Com delay de 1 hora
http://72.60.142.3:8081/live/feed_sbt_sp/playlist_dvr_timeshift-3600.m3u8
```

### API REST

```
GET  /api/v1/channels          # Lista canais do tenant
POST /api/v1/channels          # Cria canal
DELETE /api/v1/channels/:id    # Remove canal e daemon

GET  /api/v1/shifts            # Lista shifts ativos
POST /api/v1/shifts            # Cria shift (spawna FFmpeg)
DELETE /api/v1/shifts/:id      # Para shift
```

---

## Systemd Watchdog

Os daemons FFmpeg são gerenciados pelo systemd com reinicialização automática:

```ini
[Service]
Restart=always
RestartSec=30
StartLimitIntervalSec=0
```

**Comportamento:**
- Se o FFmpeg morrer por qualquer motivo, o systemd reinicia em 30 segundos
- `StartLimitIntervalSec=0` = tentativas infinitas
- Sobrevive a reboots da VPS (`WantedBy=multi-user.target`)
- Logs em `/var/log/ffmpeg-*.log`

```bash
# Ver status de todos os serviços
systemctl status 'ffmpeg-*'

# Ver logs em tempo real
journalctl -u ffmpeg-feed-gmt4 -f

# Reiniciar um serviço
systemctl restart ffmpeg-feed-gmt4
```

---

## Deploy com Docker

```bash
# Build completo (backend + frontend)
docker-compose up --build

# Ou manualmente
npm run build:all
docker build -t timedelay-pro .
docker run -p 3000:3000 --env-file .env timedelay-pro
```

---

## Documentação Adicional

| Arquivo | Descrição |
|---------|-----------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitetura completa E2E com diagramas |
| [`docs/VPS_SETUP.md`](./docs/VPS_SETUP.md) | Guia de configuração da VPS |
| [`docs/SYSTEMD.md`](./docs/SYSTEMD.md) | Configuração dos watchdogs |
| [`docs/API.md`](./docs/API.md) | Referência da API REST |
| [`docs/STREAMS.md`](./docs/STREAMS.md) | Links e portas dos streams ativos |
| [`security.md`](./security.md) | Política de segurança |
| [`qa.md`](./qa.md) | Plano de QA e testes |
| [`.env.example`](./.env.example) | Variáveis de ambiente |

---

## Licença

Proprietário — © 2026 TimeShift Pro. Todos os direitos reservados.
