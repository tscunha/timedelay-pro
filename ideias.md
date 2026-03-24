# TimeDelay Pro - Central de Ideias e Abstrações

## Visão Geral do Produto
O TimeDelay Pro será uma aplicação de classe broadcast projetada para resolver a dor de emissoras e transmissores que precisam repassar sinais ao vivo em diferentes fusos horários mantendo a integridade do feed 100% nativa.

## Ideias Principais e Filosóficas da Arquitetura
1. **O Motor de Força Bruta (FFmpeg):** Absolutamente todo o processamento de áudio/vídeo deve ser feito utilizando o FFmpeg de forma bruta, sem wrappers complexos ou middlewares opacos que escondam os logs de telemetria. 
2. **Buffer de Disco Inquebrável:** A retenção do sinal (Timeshift) não deve ocorrer na memória RAM, sob risco de colapso do sistema (Out of Memory). Utiliza-se um ring buffer persistindo TS (Transport Stream) segmentado no disco via `-f hls` ou `-f segment`.
3. **Controle via Painel:** A abstração técnica (Criação de delays, offsets como -60 minutos, -120 minutos, etc.) deve ser mascarada por uma roleta ou slider simples na UI (Dashboard React).
4. **Agente MCP Integrado:** Para além do simples painel, integrar um servidor MCP (Model Context Protocol). O MCP rodará paralelo à API Node e exporá recursos e ferramentas nativas para LLMs acessarem a pipeline de broadcast interativamente (ex: bot para monitorar streams, reportar drops e ligar/desligar instâncias via assistente text-based).

## Abstrações de Design
- **Ingest Node:** Entidade que representa uma Porta SRT receptora. Uma entidade = 1 FFmpeg Daemon gravando no disco.
- **Shift Node:** Entidade que representa uma porta de Emissão. Uma entidade = 1 FFmpeg Demuxer que lê o diretório HLS do Ingest descontando os X minutos configurados no Banco de Dados SQLite.
- **Sincronismo Global:** Módulo de injeção de Timecode/NTP a frio direto no header do TS de ingestão, para os receptores terem uma timeline balizada independente do protocolo.
