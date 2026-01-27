
# 🏛️ GovFlow Pro - Gestão de Finanças Públicas

Sistema avançado para controle de notas fiscais, empenhos e análise financeira com IA.

## 🚀 Como Rodar com Docker (Modo App Server)

Este container roda apenas a aplicação. Você deve usar seu **Nginx local** para servir o tráfego externo.

1.  **Configuração**: Crie um arquivo `.env` na raiz:
    ```bash
    API_KEY=sua_chave_gemini_aqui
    ```
2.  **Execução**:
    ```bash
    docker-compose up --build -d
    ```
3.  A aplicação estará disponível internamente em: `http://localhost:3000`

## 🛡️ Configuração do seu Nginx Local

Adicione um bloco de servidor no seu Nginx para encaminhar o tráfego:

```nginx
server {
    listen 80;
    server_name govflow.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Tecnologias
- **Frontend**: React 19 + TypeScript
- **IA**: Google Gemini API
- **Container**: Docker (Node.js 20)
- **Proxy**: Nginx Local (Externo)
