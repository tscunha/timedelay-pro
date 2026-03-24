# TimeDelay Pro - Diretrizes de Segurança (Security)

## Exposição de Portas e Superfície de Ataque
O TimeDelay lida essencialmente com transporte de rede livre (UDP). Como não há firewall nativo no protocolo SRT sem criptografia pre-shared, as regras de segurança recaem sobre a orquestração do contêiner e o isolamento das portas.

### Portas Mapeadas (Com base no Docker-Compose)
- **Porta 3000 (TCP):** Painel Web e API (React/Express). DEVE ser enclausurada atrás de um Proxy Reverso (NGINX/Traefik) com Autenticação Basic/Bearer. NUNCA expor crua para a internet.
- **Porta 9000 (UDP):** SRT Ingest Listener. Recomendado configurar a flag de `streamid` e fechar conexões desconhecidas no wrapper FFmpeg para evitar envenenamento pontual.
- **Portas 9001-9005 (UDP):** SRT Output Listeners.

## Backend Security (Boas Práticas de API)
1. **Sanitização Extrema de Comandos:** Como a API do Node.js chamará `spawn()` e `exec()` rodopiando comandos de shell contra o sistema (invocação de chaves CLI do FFmpeg), os inputs (número da porta, minutos de delay) DEVEM passar por validação Zod/Joi estrita antes da concatenação da string de execução do terminal. Zero injeção de payloads!
2. **SQLite Constraints:** Validações UNIQUE constraints em portas (não deve ser possível configurar dois shifts para rodarem Listeners na mesma porta 9001, causando colisão e queda de serviço).

## Privacidade do Ring Buffer
- O diretório `/buffer` contém material bruto de transmissão ao vivo (VOD provisório). Restringir a montagem desse volume Docker com `chmod 700` bloqueando acesso de outros usuários no host local da VPS. Em cloud, os EBS/S3 devem estar sob criptografia AES-256 on rest se a retenção perdurar mais que T-24h.
