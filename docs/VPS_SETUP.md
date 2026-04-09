# 🖥️ Configuração da VPS — TimeShift Pro
**VPS:** Ubuntu 22.04 LTS | `72.60.142.3`

---

## 1. Requisitos de Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4 GB | 8 GB |
| Disco | 100 GB SSD | 200 GB SSD |
| Banda | 100 Mbps | 1 Gbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

---

## 2. Nimble Streamer

### Instalação

```bash
wget https://nimblestreamer.com/nimble_streamer_ubuntu.sh
chmod +x nimble_streamer_ubuntu.sh
sudo ./nimble_streamer_ubuntu.sh
sudo apt-get install nimble-srt
```

### Configuração via WMSPanel

1. Acesse [wmspanel.com](https://wmspanel.com) e registre o servidor
2. **MPEGTS In → Add SRT stream:**
   - Receive mode: **Pull**
   - Remote host: `IP_DO_ENCODER`
   - Remote port: `PORTA_DO_ENCODER`
   - Application: `live`
   - Stream name: `feed_sbt_sp` (ou nome desejado)
3. **DVR → Add DVR setting:**
   - Application: `live`
   - Stream name: `feed_sbt_sp`
   - Loop recording duration: `1 hour`

---

## 3. FFmpeg

```bash
# Verificar versão instalada
ffmpeg -version

# Ubuntu 22.04 já inclui FFmpeg 4.4
sudo apt-get install -y ffmpeg
```

---

## 4. Serviços systemd

Copie os arquivos de `docs/systemd/` para `/etc/systemd/system/`:

```bash
# Exemplo: FEED SBT GMT-4 (1h de delay)
cat > /etc/systemd/system/ffmpeg-feed-gmt4.service << 'EOF'
[Unit]
Description=FFmpeg FEED SBT GMT-4 -1h SRT :11001
After=network.target nimble.service
Wants=nimble.service

[Service]
Type=simple
Restart=always
RestartSec=30
StartLimitIntervalSec=0
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/ffmpeg -loglevel warning -re \
  -i http://127.0.0.1:8081/live/feed_sbt_sp/playlist_dvr_timeshift-3600.m3u8 \
  -c copy -pes_payload_size 1316 -f mpegts \
  srt://0.0.0.0:11001?mode=listener&latency=2000&sndbuf=6710886464
StandardOutput=append:/var/log/ffmpeg-feed-gmt4.log
StandardError=append:/var/log/ffmpeg-feed-gmt4.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now ffmpeg-feed-gmt4
```

---

## 5. Monitoramento

```bash
# Status de todos os serviços FFmpeg
systemctl status 'ffmpeg-*'

# Logs em tempo real
journalctl -u ffmpeg-feed-gmt4 -f

# Uso de disco DVR
du -sh /var/cache/nimble/dvr/live/*/

# Banda de rede atual (intervalo de 5s)
sar -n DEV 5 1

# Processos ativos
ps aux | awk '/ffmpeg/{print $1,$2,$3,$11}'
```

---

## 6. Manutenção

### Liberar espaço DVR

```bash
# Ver tamanho de cada stream
du -sh /var/cache/nimble/dvr/live/*/

# Limpar stream específico (⚠️ para o DVR primeiro no WMSPanel)
rm -rf /var/cache/nimble/dvr/live/STREAM_NAME/
```

### Reconfigurar delay

```bash
# Editar o serviço
nano /etc/systemd/system/ffmpeg-feed-gmt4.service
# Altere o número em playlist_dvr_timeshift-NUMERO.m3u8

# Aplicar
systemctl daemon-reload
systemctl restart ffmpeg-feed-gmt4
```
