# E-commerce de Cartas - Projeto de Sistemas Distribuídos

## Descrição

Este projeto é um sistema de e-commerce para a compra e venda de cartas colecionáveis, desenvolvido para a disciplina de Sistemas Distribuídos. A arquitetura foi projetada utilizando um modelo de microsserviços na nuvem AWS, focando em escalabilidade, tolerância a falhas e desacoplamento.

## Arquitetura Proposta

A solução utiliza uma arquitetura moderna e coesa, baseada nos seguintes serviços e tecnologias da AWS:

* **Middleware:** Elastic Load Balancing (ALB), AWS Cloud Map
* **Virtualização:** Docker, ECS com Fargate
* **Comunicação:** API Gateway, REST, Amazon SQS
* **Nomeação:** Route 53
* **Banco de Dados:** Amazon Aurora (PostgreSQL)
* **Tolerância a Falhas:** Health Checks, ECS Service Auto Scaling, CloudWatch Alarms
* **Segurança:** Amazon Cognito, JWT, TLS, AWS KMS

*(https://docs.google.com/document/d/1aFgZAJ70XRf536KjZPcr71ky2JfjTSXAkjaOY5Pd4gY/edit?tab=t.0#heading=h.ddx9t545013z)*

## Funcionalidades Planejadas

* [ ] Cadastro e Autenticação de Usuários
* [ ] Catálogo de Cartas (visualização e busca)
* [ ] Sistema de Carrinho de Compras
* [ ] Finalização de Pedido (Checkout)
* [ ] Histórico de Pedidos do Usuário

## Como Executar

*(Esta seção será preenchida futuramente)*

```sh
# Instruções de setup e execução do projeto serão adicionadas aqui.
```

## Membros da Equipe

* [Gabriel Mendonca]
* [Leandro Balbino]
* [Yago Armand]