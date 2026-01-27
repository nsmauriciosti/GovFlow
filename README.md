# 🏛️ GovFlow Pro - Gestão de Finanças Públicas

Sistema avançado para controle de notas fiscais, empenhos e análise financeira com IA.

## 🚀 Como Rodar com Docker

A infraestrutura agora está organizada no diretório `docker/`.

1.  **Configuração**: Crie um arquivo `.env` na **raiz do projeto** (mesmo nível da `package.json`):
    ```bash
    API_KEY=sua_chave_gemini_aqui
    ```

2.  **Execução**:
    Abra o terminal na **raiz do projeto** e execute:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```

3.  **Acesso**:
    Navegue para `http://localhost:3000` no seu navegador.

## 🛠️ Detalhes da Imagem
- **Build**: Multi-stage (Node 20).
- **Servidor**: `serve` (Node.js Static Server).
- **Porta**: 3000.
