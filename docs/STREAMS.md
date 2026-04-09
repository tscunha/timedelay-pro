# 📡 Streams Ativos — TimeShift Pro
**VPS:** `72.60.142.3` | **Atualizado:** 2026-04-09

---

## Entrada (Ingest)

| Sinal | Origem | Protocolo | Codec | Resolução | Bitrate |
|-------|--------|-----------|-------|-----------|---------|
| FEED SBT SP | `189.42.141.43:30114` | SRT Pull | H.264 Main L4.1 | 1920×1080 | 11 Mbps |
| ts_001 | Push externo | SRT Listen :9001 | — | — | — |
| ts_002 | Push externo | SRT Listen :9002 | — | — | — |
| ts_003 | Push externo | SRT Listen :9003 | — | — | — |

---

## Saídas SRT (conectar decodificador)

```bash
# FEED SBT SP — teste com 10 minutos de delay
srt://72.60.142.3:11003

# FEED SBT GMT-4 — 1 hora de delay (fuso Brasília → Manaus)
srt://72.60.142.3:11001

# ts_001 — 30 minutos de delay
srt://72.60.142.3:10001

# ts_002 — 60 segundos de delay
srt://72.60.142.3:10012
```

**Parâmetros de conexão recomendados para o cliente:**
```
latency=2000
mode=caller
```

---

## Saídas HLS (player web / VLC)

```
# FEED SBT SP — ao vivo
http://72.60.142.3:8081/live/feed_sbt_sp/playlist.m3u8

# FEED SBT SP — -10 minutos
http://72.60.142.3:8081/live/feed_sbt_sp/playlist_dvr_timeshift-600.m3u8

# FEED SBT SP — -1 hora
http://72.60.142.3:8081/live/feed_sbt_sp/playlist_dvr_timeshift-3600.m3u8

# ts_001 — ao vivo
http://72.60.142.3:8081/live/ts_001/playlist.m3u8

# ts_001 — -30 minutos
http://72.60.142.3:8081/live/ts_001/playlist_dvr_timeshift-1800.m3u8

# ts_002 — -60 segundos
http://72.60.142.3:8081/live/ts_002/playlist_dvr_timeshift-60.m3u8
```

---

## Testar no terminal

```bash
# Verificar sinal ativo (ffprobe)
ffprobe -v quiet -print_format json -show_streams \
  "srt://72.60.142.3:11003?mode=caller"

# Reproduzir
ffplay "srt://72.60.142.3:11003?mode=caller"

# Ou via HLS
ffplay "http://72.60.142.3:8081/live/feed_sbt_sp/playlist_dvr_timeshift-600.m3u8"
```

---

## DVR — Buffer disponível

| Stream | DVR | Tamanho estimado | Status |
|--------|-----|------------------|--------|
| feed_sbt_sp | 1 hora | ~5 GB | 🟢 Ativo |
| ts_001 | 1 dia | ~65 GB | 🟢 Ativo |
| ts_002 | 1 dia | ~65 GB | 🟢 Ativo |
| ts_003 | 1 dia | ~65 GB | 🟢 Ativo |

> ⚠️ O DVR do feed_sbt_sp precisa acumular o tempo configurado de delay
> antes que a saída correspondente esteja disponível.
> Ex: GMT-4 (-1h) fica disponível **1 hora** após o início do ingest.
