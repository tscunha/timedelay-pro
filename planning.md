# TimeDelay Pro - Planejamento Scrum e Execução (Planning)

## Escopo do MVP (Minimum Viable Product)
O foco central do MVP é entregar um software containerizado que seja capaz de subir um Listener SRT, fatiar esse conteúdo para um diretório local em HLS e re-expedir um atraso configurável (-60 min, -5 min) para outras portas SRT independentes sem gargalos de CPU.

## Epics & Sprints
### Sprint 1: Fundação do Motor (FFmpeg Core)
- **História 1:** Como engenheiro de ingestão, quero que a aplicação receba meu sinal SRT na porta 9000 e salve os chunks HLS no diretório `/buffer` com deleção circular de 12 horas.
- **História 2:** Como engenheiro de distribuição, quero um script/worker capaz de ler o arquivo HLS a partir de `-X` minutos no passado e roteá-lo para a porta SRT 9001 com pacing CBR.

### Sprint 2: Control Plane (Backend API)
- **História 3:** Como sistema, preciso de um banco de dados SQLite onde as tabelas `Inputs` e `Shifts` sejam arquitetadas para persistência.
- **História 4:** Como frontend, preciso consumir rotas REST (Ex: `POST /api/shifts`) para spawnar dinamicamente os `ChildProcesses` do Node chamando o FFmpeg.

### Sprint 3: Monitoramento e Telemetria (Dashboard)
- **História 5:** Como operador broadcast, quero um React Dashboard onde vejo o status "Running/Crashed" dos meus shifts.
- **História 6:** Integração com MCP (Model Context Protocol) Server no Backend, permitindo a auditores externos AI lerem o status dos nós SRT ativamente.

## Rituais do Scrum Master
- Daily de alinhamento focada em bloqueios de decodificação do FFmpeg.
- Revisão de código obrigatória nas pipelines de injeção de Timecode para garantir ausência de "Drift" de TSBPD do SRT.
