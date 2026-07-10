---
name: dominio-negocio-costura
description: Garante que modelagem de dados, UX e regras de negócio reflitam a operação real de uma confecção artesanal personalizada, evitando features genéricas de e-commerce que não se aplicam.
---

# dominio-negocio-costura

## Quando usar

Em qualquer decisão de modelagem de dados, fluxo de tela ou regra de negócio do app.

## Como usar

1. Cor não é atributo fixo de catálogo — é campo de texto livre (ou combobox editável com sugestões das cores já usadas em pedidos anteriores), pois cada pedido é personalizado.
2. Preço nasce de um valor base vinculado ao produto/categoria, mas é sempre editável no momento do registro do pedido — nunca campo somente-leitura.
3. Cadastro de produto é enxuto: categoria, nome, quantidade, cor, cliente, valor, foto. Sem campo de descrição longa.
4. Ciclo de vida do pedido é único, sequencial, sem estados paralelos:
   `a_produzir` → `em_andamento` → `finalizado` → `aguardando_entrega` → `entregue`
5. Não implementar telas, rotas ou lógica de permissão diferenciada por usuário — todo colaborador autenticado vê e edita tudo (sem RBAC).
6. Cliente final nunca tem login, link de rastreio ou qualquer exposição pública do sistema — 100% das telas são internas.
7. Cadastro de cliente: telefone é o dado principal (obrigatório), e-mail é opcional (pensando em uso futuro por marketing).

## Anti-padrões a evitar

- Não criar tabela `cores` como catálogo fixo.
- Não travar `valor` do pedido como read-only vindo do produto.
- Não adicionar `descricao_longa` em produtos.
- Não criar status de pedido fora da sequência definida (ex.: "cancelado" pode existir como estado terminal excepcional, mas não como estado paralelo ao fluxo principal — confirmar com o usuário antes de adicionar).
- Não criar telas públicas, login de cliente, ou papéis de acesso.
