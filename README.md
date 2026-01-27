# 🏛️ GovFlow Pro - Gestão de Finanças Públicas

Sistema avançado para controle de notas fiscais, empenhos e análise financeira com IA.

## 🚀 Como Rodar com Docker

A infraestrutura foi movida para o diretório `docker/` para melhor organização.

1.  **Configuração**: Crie um arquivo `.env` na raiz do projeto:
    ```bash
    API_KEY=sua_chave_gemini_aqui
    ```

2.  **Execução**:
    A partir da **raiz do projeto**, execute:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```

3.  **Acesso**:
    Navegue para `http://localhost:3000`

## 🛠️ Detalhes
- O build é otimizado em dois estágios.
- A aplicação é servida via `serve` (Node.js).
- Porta padrão: 3000.
