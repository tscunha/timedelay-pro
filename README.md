# TimeShift Pro — Suite de Infraestrutura SRT

Sistema de orquestração de delays configuráveis para feeds SRT ao vivo, com suporte a REMI (roteamento de baixa latência), Simulcast para redes sociais e gravação de compliance.

## Pré-requisitos

- **VPS Linux** (Ubuntu 22.04+ recomendado)
- **Docker** + **Docker Compose** instalados
- **Nimble Streamer** instalado e configurado na mesma VPS
  - O Nimble deve estar escutando na porta `8081` (HTTP)
  - Cada canal deve ter um `streamid` único configurado no WMSPanel

---

## Instalação via Docker (Produção)

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/timedelay-pro.git
cd timedelay-pro
```

### 2. Configurar o ambiente
```bash
# Edite as variáveis antes de subir
nano docker-compose.yml
```

Localize e preencha as variáveis obrigatórias:

| Variável | Descrição | Exemplo |
|---|---|---|
| `SERVER_HOST` | IP público da VPS | `177.99.12.34` |
| `TENANT_API_KEYS` | `tenant_id:api_key` | `minhaemissora:chave-super-secreta` |
| `NIMBLE_HOST` | IP do Nimble (normalmente `127.0.0.1`) | `127.0.0.1` |
| `NIMBLE_PORT` | Porta HTTP do Nimble | `8081` |

> **Gerar uma chave segura:**
> ```bash
> openssl rand -hex 32
> ```

### 3. Build e iniciar
```bash
docker compose up -d --build
```

### 4. Verificar se está rodando
```bash
docker compose ps
docker compose logs -f timeshift-api
```

O painel estará disponível em: `http://SEU_IP:3000`

---

## Uso do Painel

### Configurar a API Key no browser
1. Abra `http://SEU_IP:3000`
2. Clique em **[ ⚙ API KEY ]** no cabeçalho
3. Digite a chave configurada em `TENANT_API_KEYS`
4. Clique **[ SALVAR E RECONECTAR ]**

### Cadastrar um Sinal (Canal)
1. Clique em **[ + NOVO CANAL ]**
2. Informe o **Nome** do canal e o **Stream ID** (deve coincidir com o `streamid` configurado no Nimble)
3. Confirmar

### Criar um TimeShift (Atraso)
1. Na aba **[1] TIMESHIFT (ATRASO)**
2. Selecione o canal de origem
3. Informe o atraso em segundos (ex: `3600` = 1 hora)
4. Informe a porta SRT de saída (ex: `9001`)
5. Clique **[ ENGAGE ]**
6. O link SRT real aparecerá com botão de cópia: `srt://SEU_IP:9001`

### Testar o stream recebido
```bash
# No computador do receptor:
ffplay -fflags nobuffer srt://SEU_IP:9001
```

---

## Atualizar após mudanças
```bash
git pull
docker compose up -d --build
```

## Parar o sistema
```bash
docker compose down
```

Os dados do banco SQLite são persistidos no volume `timeshift_db`.

---

## Arquitetura resumida

```
[Encoder vMix/SRT] → [Nimble Streamer DVR :8081] → [ring buffer HLS no disco]
                                                          ↓
                          [TimeShift Pro API] spawna FFmpegS lendo HLS
                                                          ↓
                               [SRT Output :9001, :9002, :9003...]
                                                          ↓
                           [Decoder do cliente em qualquer lugar]
```

- **O motor de transmissão (FFmpeg) é completamente independente do painel**. Se o painel cair, os streams continuam. Se a VPS reiniciar, os streams são restaurados automaticamente.
