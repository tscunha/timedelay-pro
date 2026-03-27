@echo off
echo ========================================================
echo     TIMESHIFT CLOUD - TESTE RX (CAMADA FINAL)
echo ========================================================
echo.
echo Escolha o modo de teste:
echo [1] Teste direto no Nimble (HTTP M3U8)
echo [2] Teste Visceral Completo (VPS Daemon SRT Multiponto)
echo.
set /p escolha="Digite 1 ou 2: "

if "%escolha%"=="1" goto m3u8
if "%escolha%"=="2" goto srt
goto end

:m3u8
echo Iniciando 3 janelas FFPLAY (Via M3U8)...
echo = TS_001 (SBT)     - Atraso de 45 minutos
echo = TS_002 (ANDRE)   - Atraso de 35 minutos
echo = TS_003 (GLAUBER) - Atraso de 25 minutos
start "TS_001 M3U8 (45m)" ffplay -window_title "TS_001 M3U8 (45 MIN)" -fflags nobuffer "http://72.60.142.3:8081/live/ts_001/playlist_dvr_timeshift-2700.m3u8"
start "TS_002 M3U8 (35m)" ffplay -window_title "TS_002 M3U8 (35 MIN)" -fflags nobuffer "http://72.60.142.3:8081/live/ts_002/playlist_dvr_timeshift-2100.m3u8"
start "TS_003 M3U8 (25m)" ffplay -window_title "TS_003 M3U8 (25 MIN)" -fflags nobuffer "http://72.60.142.3:8081/live/ts_003/playlist_dvr_timeshift-1500.m3u8"
goto end

:srt
echo Iniciando 4 janelas FFPLAY (Via SRT Multiponto na VPS)...
echo Aqui o FFmpeg da VPS (Daemon) esta lendo o M3U8 e cuspindo SRT de volta pra voce!
echo.
echo = TS_001_delay30m (Porta 10001) - 30 minutos
echo = TS_001_delay60m (Porta 11001) - 60 minutos (Aguarde buffer encher p/ imagem rodar liso)
echo = TS_002_delay30m (Porta 10002) - 30 minutos
echo = TS_003_delay30m (Porta 10003) - 30 minutos (Pode picotar ate fechar os 30m gravados)
start "SRT 10001" ffplay -window_title "TS_001 SRT RELAY (30 MIN)" -fflags nobuffer "srt://72.60.142.3:10001?mode=caller"
start "SRT 11001" ffplay -window_title "TS_001 SRT RELAY (60 MIN)" -fflags nobuffer "srt://72.60.142.3:11001?mode=caller"
start "SRT 10002" ffplay -window_title "TS_002 SRT RELAY (30 MIN)" -fflags nobuffer "srt://72.60.142.3:10002?mode=caller"
start "SRT 10003" ffplay -window_title "TS_003 SRT RELAY (30 MIN)" -fflags nobuffer "srt://72.60.142.3:10003?mode=caller"
goto end

:end
echo.
echo Processo concluido. (Deixe o buffer do DVR encher se alguma janela der erro de imediato).
pause
