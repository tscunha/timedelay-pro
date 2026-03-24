# Documentação do MVP (Prova de Conceito)

Este documento registra o case de sucesso do Minimum Viable Product do TimeDelay Pro, testado e validado em ambiente de produção (Nuvem WMSPanel Nimble Streamer + Relay Linux) em Março de 2026.

## Problema Original
A necessidade de transmitir feeds de vídeo 24/7 originados de um Encoder ao vivo (ex: vMix / SRT Caller) e repassar o mesmíssimo feed para múltiplos alvos com atrasos configuráveis (timeshifts de 5 min a horas) perfeitamente sincronizados.

## O Que Foi Testado
- Injeção: FFmpeg local copiando um arquivo de teste de altíssima qualidade (`CPI do Crime...mp4`) pela lib `srt` Caller na porta 9000 de uma VPS.
- Motor de DVR: O Nimble Streamer rodando na VPS ingeria a porta 9000 e fatiou o Transport Stream para o formato HLS, retendo 1 hora de atraso configurável em disco.

## O Gargalo Encontrado (E Resolvido)
A tentativa clássica de plugar um loopback direto de porta UDP no WMSPanel do Nimble (transformar os chunks de HLS de volta pra SRT) gerou Bufferbloat instantâneo. O formato HTTP do HLS enviava "tsunamis" (rajadas) de vídeo na interface de rede, superando o buffer do protocolo SRT (120ms), o que resultou em logs massivos de `RCV-DROPPED` e `PES Packet Size mismatch` corrompendo a imagem (Glitches P-Frame).

## A Solução de Alta Engenharia do MVP
A prova de conceito foi migrar o "transmuxing" para um processo Linux Dedicado usando FFmpeg.
Rodamos o seguinte serviço Systemd imune a reboots:

```bash
ffmpeg -re -i "http://127.0.0.1:8081/live/canal1/playlist_dvr_timeshift-3600.m3u8" -c copy -pes_payload_size 1316 -f mpegts "srt://0.0.0.0:9001?mode=listener&latency=2000"
```

### Por que funcionou de forma brilhante?
- **-re (Native Rate De-jitter):** O FFmpeg leu o "tsunami" HTTP mas soterrou a rajada, cuspindo o vídeo byte-a-byte na interface SRT na mesmíssima cadência matemática real da filmagem.
- **-c copy:** 0% de uso de CPU do servidor, garantindo rentabilidade da Cloud.
- **latency=2000 & 1316 size:** Proteção absurda contra corrupções UDP pela rede.

Este case de sucesso prova cabalmente que a arquitetura ideal do SaaS é separar um "Storage Core" passivo que descarrega os blocos em disco e um "Orquestrador Dinâmico de FFmpegs" lendo os índices para garantir o compasso em tempo real de cada Shift.
