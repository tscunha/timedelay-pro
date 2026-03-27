# Time Shift Pro: Estrutura SaaS Corporativa (Integrated Cloud)

Com a fundação ("Tractor Architecture") solidificada, expandimos o Time Shift Pro para um ecossistema 100% SaaS Corporativo com capacidades avançadas de Multitenancy, Inteligência Artificial Assistiva (MCP) e Telemetria de Nível Militar.

## 1. Multitenancy Múltiplo (Isolamento de Dados)
O sistema foi arquitetado para abrigar múltiplos clientes na mesma nuvem isolando o uso de recursos, logs e faturamento.
* **Database Isolation (Tenant ID):** Cada registro de Canal (`channels`), Shift (`shifts`) e Logs (`audit_logs`) contém um campo indexado `tenant_id`. 
* **Worker Nodes Dinâmicos:** Tenants VIP recebem Nodes (VPS FFmpeg) dedicados para evitar _Noisy Neighbor_ (vizinho barulhento consumindo CPU/Rede). Tenants menores podem partilhar "Shared Nodes", mas sempre roteados via portas lógicas isoladas.
* **Faturamento por Consumo (Billing):** Contabilização por Gigabyte Roteado (Traffic Out) e Tempo de Máquina (Horas de Shift ativo).

## 2. Abordagem de Autenticação (Zero Trust)
* **Auth do Usuário Final / Operador:** JWT (JSON Web Tokens) com tempos de expiração curtos. Suporte nativo a OAuth2/SSO para clientes corporativos (Entra ID, Google Workspace) via Keycloak/Auth0 no API Gateway.
* **Auth de Worker Nodes:** Nenhuma máquina FFmpeg se conecta "crua" ao orquestrador master. Utiliza-se _Mutual TLS_ (mTLS) e chaves estáticas de API por Node para atestar que o container reportando telemetria ao SaaS é uma entidade legítima do sistema.

## 3. Inteligência Multi-Camadas: A Tríade MCP (Model Context Protocol)
A grande vantagem competitiva é a assistência ativa de IA dividida por cargos e escopos hierárquicos de poder:

### 3.1. MCP do Cliente (Nível 1 - Autoatendimento)
* **Escopo:** Acesso restrito apenas aos dados e nós (`tenant_id`) do próprio cliente.
* **Ferramentas Práticas:**
  * Solicitar a criação de Shifts via prompt natural: *"Crie um delay de 2 horas na minha câmera Master de SP"*.
  * Consultar o faturamento diário.
  * Analisar mini-relatórios de estabilidade ("*Tivemos quedas de sinal hoje?*").

### 3.2. MCP do Suporte Técnico (Nível 2 - Controle de Tráfego Operacional)
* **Escopo:** Acesso Cross-Tenant focado apenas em troubleshooting (somente leitura global e restart local).
* **Ferramentas Práticas:**
  * Ler logs cruzados para debug (ex: *"Mostre-me os erros `RCV-DROPPED` do cliente X na porta 9002 nos últimos 15 min"*).
  * Executar a ferramenta `restart_node` para reiniciar o container de um cliente que travou na matriz.
  * Emitir laudos técnicos humanizados após queda global explicando a falha da operadora de trânsito UDP.

### 3.3. MCP de Orquestração / Chaos Monkey (Nível 3 - Engenharia SRE)
* **Escopo:** Acesso infraestrutural global/SaaS (Deity Level).
* **Ferramentas Práticas:**
  * Escalar automaticamente a infraestrutura ("*Temos evento grande em SP, faça spin-up de +3 VPS na DigitalOcean via Terraform e conecte-as ao Master API*").
  * Realizar migrações de bancos de dados.
  * Realizar simulação Chaos: Derrubar nós intencionalmente para atestar que a API central repassa os Listeners SRT para outras VPS secundárias em até 2 segundos.

## 4. O Dashboard Global NOC
Além do **Cockpit Tático** isolado por cliente, o **NOC SaaS** possui uma visão holística:
* **Mosaico WebRTC Híbrido:** Agrupamento de miniaturas de sub-streams (iframes HTML5 `-fflags nobuffer`) para que o suporte veja o retorno de vídeo global em tempo real.
* **Topologia Dinâmica de Nodes:** Mapa de grafos exibindo qual VPS (Worker) está processando os canais de qual `tenant_id` agora, permitindo um "Drag and Drop" para rebalancear clientes de uma máquina sobrecarregada para uma vazia.

## 5. Telemetria: Logs Militares e Filtros Inteligentes
Logs não podem ser text-files estáticos quando se fala de múltiplas correntes SRT processando HLS sem parar.
* **Centralização (ELK Stack ou Loki/Grafana):** Todos os contêineres FFmpeg em todas as VPS despejam seu stderr num socket UDP para um vetor de telemetria (Vector.dev ou Promtail).
* **Filtros Estratégicos Essenciais:**
  * Filtrar por `tenant_id`
  * Filtrar por Nível (`FATAL`, `ERROR`, `WARN-LATENCY`)
  * Filtrar por Evento FFmpeg específico: `Non-monotonous DTS`, `PES Packet size mismatch`, `loss over margin`.
  * Visualização de Timeseries: Gráfico que mostra a estabilidade do fluxo em P-Frames ao longo do tempo.
