# Manapoint - E-commerce de Card Games

<p align="center">
  <img src="./frontend/public/logo-transparente.jpg" alt="Logo ManaPoint" width="250"/>
</p>

O **Manapoint** é uma plataforma de e-commerce distribuída e baseada em microsserviços, especializada na compra e venda de cartas colecionáveis (Yu-Gi-Oh!). Desenvolvido para a disciplina de Engenharia de Software e Sistemas Distribuídos, o projeto foca em escalabilidade, desacoplamento e robustez.

O sistema se diferencia pela **integração automática com a API externa YGOProDeck**, permitindo o povoamento dinâmico do catálogo, além de implementar padrões de resiliência e observabilidade completa.

## Arquitetura e Tecnologias

A solução utiliza uma arquitetura de microsserviços containerizada, orquestrada via Docker Compose para desenvolvimento e preparada para implantação em nuvem (AWS).

* **Linguagem & Framework:** Node.js com Express.
* **Gateway & Proxy Reverso:** Nginx.
* **Banco de Dados:** PostgreSQL.
* **Comunicação:** Síncrona via HTTP/REST (Axios).
* **Segurança:**
    * Autenticação via JWT.
    * Hashing de senhas com Bcrypt.
    * Headers de segurança com Helmet.
* **Resiliência & Tolerância a Falhas:**
    * *Retry Pattern* (axios-retry) para chamadas externas.
    * *Deep Health Checks* para verificação de dependências.
    * Transações de Banco de Dados.
* **Observabilidade:**
    * **Prometheus:** Coleta de métricas técnicas e de negócio.
    * **Grafana:** Visualização de dashboards em tempo real.

## Funcionalidades

* [x] **Gestão de Identidade:** Cadastro e autenticação segura de clientes e funcionários.
* [x] **Catálogo Inteligente:** Busca local e importação automática de cartas via API externa (YGOProDeck).
* [x] **Carrinho de Compras:** Gestão de itens com validação de estoque em tempo real.
* [x] **Checkout Transacional:** Processamento de pedidos com baixa atômica de estoque.
* [x] **Monitoramento:** Dashboards de vendas, latência e saúde dos serviços.

## Como Executar

### Pré-requisitos
* [Docker](https://www.docker.com/) e Docker Compose instalados.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/manapoint.git](https://github.com/seu-usuario/manapoint.git)
    cd manapoint
    ```

2.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo (ajuste as senhas se desejar):

    ```env
    # Configurações do Banco de Dados
    DB_HOST=db
    DB_PORT=5432
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=manapoint_db
    DB_SSL=false

    # Segurança (Token JWT)
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

3.  **Suba a aplicação:**
    ```bash
    docker compose up --build -d
    ```

4.  **Acesse os Serviços:**
    * **API Gateway (Frontend):** `http://localhost:80`
    * **Grafana (Monitoramento):** `http://localhost:3005` (Login: admin / Senha: admin)
    * **Prometheus:** `http://localhost:9090`

## Membros da Equipe

* [Gabriel Mendonca]
* [Jeanluca Caleare]
* [Leandro Balbino]
* [Yago Armand]