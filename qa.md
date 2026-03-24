# TimeDelay Pro - Manual de Quality Assurance (QA)

A natureza assíncrona do SRT atrelada ao processamento do HLS exige rituais críticos de bateria de testes sob estresse. Nenhuma build será provisionada sem passar por estes check-points rigorosos de Qualidade.

## Cenário 1: Testes de Stress de Bufferbloat (Upload Simulado)
- **O que Testar:** Se o envio do HLS para SRT engasgar, como a aplicação se recupera no P-Frame subsequente?
- **Ferramenta:** Usar netem (`tc qdisc add dev eth0 root netem delay 100ms loss 5%`) no Docker para induzir 5% packet loss na malha de output UDP e checar se o `latency=2000` suporta o descarte sem pixelização bizarra no FFPLAY do testador.

## Cenário 2: Precisão Absoluta de Shift (Drift Check)
- **O que Testar:** Enviar feed de entrada com Burn-in real de T-0 (Relógio Realtime do Vmix originador). Instalar um Node configurado para T-60 minutos de atraso (`3600 segundos`).
- **QA Pass:** Ao capturar tela da fonte e do resultado simultaneamente em Mosaico WebRTC, o delta dos dois relógios na imagem deve ser **EXATAMENTE 3600 segundos**, sem flutuação maior que 0.8s (tamanho de GOP médio). Derivadas progressivas indicam flag defectiva do wallclock no FFmpeg.

## Cenário 3: Colapso Controlado de Processos (Chaos Monkey)
- **O que Testar:** Matar `kill -9 <PID>` propositalmente os processos do FFmpeg rodando o encoder Ingest.
- **QA Pass:** O sistema Node.js (`PM2` ou gerenciador Wrapper) deve detectar o signal `SIGKILL`, e fazer a ressurreição automática através da base SQLite dos canais mantendo log de queda.

## Cenário 4: Checagens de UX UI
- URL Click-to-Play (`ffplay srt://...`) devem vir formatados com `-fflags nobuffer` para renderização imediata.
- Interface avisando erro visual com Ícone Vermelho explícito em "Perda de Feed de Origem" no WebRTC Preview das Saídas Múltiplas.
