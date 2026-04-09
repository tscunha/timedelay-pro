# 🏗️ Arquitetura Completa — TimeShift Pro
**Versão:** 2026-04-09 | **VPS:** `72.60.142.3` | **Stack:** Nimble 4.2 + FFmpeg 4.4 + Fastify + React

---

## 1. Visão Macro — End-to-End

```
[Encoder Origem]
189.42.141.43:30114
H.264 Main L4.1 / 1080p / 29.97fps / 11 Mbps
SRT Listener Mode
        │
        │ SRT Pull (Caller) ~13.7 Mbps bruto
        ▼
┌─────────────────────────────────────────┐
│         Nimble Streamer 4.2             │
│         VPS 72.60.142.3                 │
│                                         │
│  Port :44981 (efêmera, SRT outbound)    │
│  Stream: live/feed_sbt_sp               │
│  DVR Ring Buffer: 1 hora (~5 GB)        │
│  HLS Segmenter: :8081                   │
└──────────────┬──────────────────────────┘
               │ HLS interno 127.0.0.1:8081
               │ playlist_dvr_timeshift-Xs.m3u8
               ▼
┌─────────────────────────────────────────┐
│     FFmpeg Daemons (systemd watchdog)   │
│                                         │
│  ffmpeg-feed-test10m  -10min → :11003   │
│  ffmpeg-feed-gmt4     -1h   → :11001   │
│  ffmpeg-ts001         -30m  → :10001   │
│  ffmpeg-ts002         -60s  → :10012   │
│                                         │
│  Todos com: -c copy (zero recompressão) │
└──────────────┬──────────────────────────┘
               │ SRT Listener (público)
               ▼
┌─────────────────────────────────────────┐
│     Decodificadores / Players           │
│                                         │
│  Hardware decoder, VLC, ffplay          │
│  ou outro encoder SRT downstream        │
└─────────────────────────────────────────┘
```

---

## 2. Componentes Detalhados

### 2.1 Nimble Streamer

| Propriedade | Valor |
|---|---|
| Versão | 4.2.0-7 |
| PID | 622 (systemd service `nimble`) |
| CPU | ~12.5% de 2 vCPUs |
| RAM | ~608 MB |
| Porta HTTP | :8081 (HLS streaming + admin) |
| Porta admin local | :40551 (127.0.0.1 apenas) |
| Gestão | WMSPanel (wmspanel.com) |

**Streams configurados no Nimble:**

| Stream | Modo | Porta | DVR |
|--------|------|-------|-----|
| FEED SBT SP (`live/feed_sbt_sp`) | SRT Pull Caller | :44981 → 189.42.141.43:30114 | 1 hora |
| ts_001 | SRT Listen | :9001 | 1 dia |
| ts_002 | SRT Listen | :9002 | 1 dia |
| ts_003 | SRT Listen | :9003 | 1 dia |
| PC Vmix | SRT Listen | :4201 | — |

### 2.2 FFmpeg Daemons

Todos os daemons usam o padrão:
```bash
ffmpeg \
  -loglevel warning \
  -re \                                          # velocidade real-time
  -i "http://127.0.0.1:8081/live/STREAM/playlist_dvr_timeshift-Xs.m3u8" \
  -c copy \                                      # zero recompressão
  -pes_payload_size 1316 \                       # MTU compatível SRT
  -f mpegts \
  "srt://0.0.0.0:PORTA?mode=listener&latency=2000&sndbuf=6710886464"
```

| Serviço systemd | Entrada HLS | Saída SRT | Delay |
|---|---|---|---|
| `ffmpeg-feed-test10m` | `feed_sbt_sp/playlist_dvr_timeshift-600.m3u8` | `:11003` | 10 min |
| `ffmpeg-feed-gmt4` | `feed_sbt_sp/playlist_dvr_timeshift-3600.m3u8` | `:11001` | 1 hora |
| `ffmpeg-ts001` | `ts_001/playlist_dvr_timeshift-1800.m3u8` | `:10001` | 30 min |
| `ffmpeg-ts002` | `ts_002/playlist_dvr_timeshift-60.m3u8` | `:10012` | 60 seg |

### 2.3 TimeShift Pro API

```
Fastify (Node.js 18+)
├── Auth Hook: X-API-Key → TENANT_API_KEYS (lazy load do .env)
├── /api/v1/channels  → CRUD de canais ingest
├── /api/v1/shifts    → CRUD de delays + spawn FFmpeg
├── /api/v1/remi      → roteamento de sinal
└── /api/v1/simulcast → distribuição multi-plataforma

SQLite (better-sqlite3, síncrono)
├── channels (id, tenant_id, name, stream_id, server_host)
├── shifts (id, channel_id, delay_seconds, srt_port, status, pid)
└── [outras tabelas multitenant]
```

### 2.4 TimeShift Pro Frontend

```
React 18 + Vite 8 + TypeScript
├── App.tsx           → Header + modal de canais + API Key
├── TimeShiftTab.tsx  → Criar delays, links SRT copiáveis
├── RemiTab.tsx       → Roteamento REMI/IFB
├── SimulcastTab.tsx  → Distribuição redes sociais
└── ComplianceTab.tsx → Auditoria e gravação

Proxy Vite (dev): /api/* → http://localhost:3000
```

---

## 3. Mapa de Portas

| Porta | Protocolo | Processo | Modo | Descrição |
|-------|-----------|----------|------|-----------|
| 3000 | TCP | Fastify | — | API REST (dev/prod) |
| 4201 | UDP/SRT | Nimble | Listen | PC Vmix ingest |
| 5173 | TCP | Vite | — | Frontend (dev only) |
| 8081 | TCP/HTTP | Nimble | — | HLS + admin API |
| 9001 | UDP/SRT | Nimble | Listen | ts_001 ingest |
| 9002 | UDP/SRT | Nimble | Listen | ts_002 ingest |
| 9003 | UDP/SRT | Nimble | Listen | ts_003 ingest |
| 10001 | UDP/SRT | FFmpeg | Listen | ts_001 saída -30min |
| 10012 | UDP/SRT | FFmpeg | Listen | ts_002 saída -60s |
| 11001 | UDP/SRT | FFmpeg | Listen | FEED SBT GMT-4 -1h |
| 11003 | UDP/SRT | FFmpeg | Listen | FEED SBT SP -10min |
| 40551 | TCP | Nimble | — | Admin local (127.0.0.1 apenas) |
| 44981 | UDP/SRT | Nimble | Caller | Pull do encoder remoto |

---

## 4. Watchdog — Fluxo de Resiliência

```
FFmpeg inicia (via systemd start)
        │
        ├─► Conecta HLS DVR do Nimble
        │          │
        │          ├─► Buffer disponível → stream ativo ✅
        │          │
        │          └─► Buffer vazio → "Empty segment" → exit code 1
        │
        └─► systemd detecta saída (< 1s)
                   │
                   ▼
            aguarda RestartSec=30s
                   │
                   ▼
            reinicia automaticamente
            (StartLimitIntervalSec=0 = infinito)
```

**Por que 30 segundos?**
- Evita loop agressivo que sobrecarrega o Nimble
- Dá tempo para o DVR acumular mais buffer entre tentativas
- Configurável em `/etc/systemd/system/ffmpeg-*.service`

---

## 5. Fluxo do Sinal — Análise de Latência

```
Encoder → SRT → Nimble → DVR → HLS → FFmpeg → SRT → Decoder
  0ms     2000ms  ~5ms   buffer   ~2s   ~50ms  2000ms  ~5ms

Total de overhead de rede/protocolo: ~4 segundos além do delay configurado
Ex: configurar 600s → usuário recebe entre 604-606 segundos de delay
```

**Integridade do sinal:**
- Nenhuma recompressão em qualquer etapa
- SRT usa ARQ (Automatic Repeat reQuest) para zero packet loss
- Bitrate de entrada = bitrate de saída (11 Mbps → 11 Mbps)

---

## 6. Recursos e Limites

### Hardware atual (VPS)

| Recurso | Total | Uso atual | Alerta |
|---------|-------|-----------|--------|
| CPU | 2 vCPUs | ~20% | > 80% |
| RAM | 3.9 GB | 940 MB | > 3 GB |
| Disco | 49 GB | 33 GB usados | > 45 GB ⚠️ |
| Banda entrada | ~100 Mbps | ~14 Mbps | > 80 Mbps |
| Banda saída | ~100 Mbps | < 2 Mbps | > 80 Mbps |

### Cálculo de disco por DVR

```
Bitrate × Duração ÷ 8 = GB

feed_sbt_sp: 11 Mbps × 3600s ÷ 8 = ~5 GB (1h DVR)
ts_001:       6 Mbps × 86400s ÷ 8 = ~65 GB (1 dia DVR) ⚠️
```

**Recomendação:** Expandir disco para 200 GB ou reduzir DVR do ts_001/ts_002/ts_003.

---

## 7. Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor Fastify | `3000` |
| `NIMBLE_HOST` | IP do Nimble Streamer | `127.0.0.1` |
| `NIMBLE_PORT` | Porta HTTP do Nimble | `8081` |
| `SERVER_HOST` | IP público da VPS (para gerar links SRT) | `72.60.142.3` |
| `TENANT_API_KEYS` | Mapa JSON de chaves por tenant | `{"tenant1":"chave-secreta"}` |

---

## 8. Segurança

- API autenticada via `X-API-Key` header
- Sem passphrase SRT (adicionar para produção: `?passphrase=X&pbkeylen=16`)
- Porta admin Nimble (:40551) vinculada apenas a 127.0.0.1
- Swap desabilitado na VPS (risco de OOM em pico)
