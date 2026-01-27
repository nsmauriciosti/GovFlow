# 🏛️ GovFlow Pro - Gestão de Finanças Públicas

Sistema avançado para controle de notas fiscais, empenhos e análise financeira com IA.

## 🚀 Como Rodar com Docker

A infraestrutura está centralizada na pasta `docker/`. Para rodar o sistema corretamente, siga estes passos da **raiz do projeto**:

1.  **Configuração**: Crie um arquivo `.env` na raiz do projeto:
    ```bash
    API_KEY=sua_chave_gemini_aqui
    ```

2.  **Execução**:
    Execute o comando abaixo na raiz do projeto (onde está o seu `package.json`):
    ```bash
    docker-compose -f docker/docker-compose.yml up --build -d
    ```

3.  **Acesso**:
    A aplicação estará disponível em: `http://localhost:3000`

## 🛠️ Detalhes do Ambiente
- **Build**: Multi-stage (Node 20 -> Dist)
- **Servidor**: Static serve (Production-ready)
- **Porta**: 3000 (Mapeada no docker-compose)
