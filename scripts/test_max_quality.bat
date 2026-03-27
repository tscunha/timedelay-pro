@echo off
echo ========================================================
echo     TIMESHIFT CLOUD - TESTE RX (QUALIDADE MAXIMA 25 Mbps)
echo ========================================================
echo.
echo Iniciando as 2 janelas FFPLAY (SBT e Andre Mendonca)...
echo Aqui o FFmpeg da VPS esta repassando o video limpo via SRT!
echo.
start "SRT 10011" ffplay -window_title "TS_001 MAX QUALITY 25Mbps (SRT RELAY)" -fflags nobuffer "srt://72.60.142.3:10011?mode=caller"
start "SRT 10012" ffplay -window_title "TS_002 MAX QUALITY 25Mbps (SRT RELAY)" -fflags nobuffer "srt://72.60.142.3:10012?mode=caller"
pause
