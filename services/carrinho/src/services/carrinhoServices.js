const db = require('../db');
const axios = require('axios');

module.exports = {

  async validarToken(token) {
    if (!token) {
      const e = new Error("Token de autenticação inválido ou não fornecido.");
      e.status = 401;
      throw e;
    }

    try {
      const response = await axios.post(
        "http://usuarios_api:3000/api/usuarios/validar-token",
        { token }
      );

      if (!response.data?.valido || !response.data?.usuario?.id) {
        const e = new Error("Acesso não autorizado. Token inválido.");
        e.status = 401;
        throw e;
      }

      return {
        usuarioId: response.data.usuario.id,
        cargo: response.data.usuario.cargo
      };

    } catch (err) {
      const e = new Error("Acesso não autorizado. Token inválido ou erro interno na validação.");
      e.status = 401;
      throw e;
    }
  },

  async adicionarItem(usuarioId, usuarioCargo, produto_id, quantidade) {
    if (usuarioCargo === "funcionario") {
      const e = new Error("Funcionários não podem realizar compras. Entre com uma conta de cliente.");
      e.status = 403;
      throw e;
    }

    if (!usuarioId || !produto_id || quantidade == null) {
      const e = new Error("Campos obrigatórios: produto_id, quantidade.");
      e.status = 400;
      throw e;
    }
    if (typeof quantidade !== "number" || quantidade <= 0) {
      const e = new Error("Quantidade deve ser um número positivo.");
      e.status = 400;
      throw e;
    }

    const client = await db.pool.connect();
    console.log(`[POST /carrinho] - UsuarioId: ${usuarioId}, Adicionando produtoId: ${produto_id}, Qtd: ${quantidade}`);

    try {
      await client.query("BEGIN");

      const cartaResult = await client.query(
        "SELECT preco, quantidade FROM cartas WHERE id = $1",
        [produto_id]
      );

      if (cartaResult.rows.length === 0) {
        await client.query("ROLLBACK");
        const e = new Error("Produto não encontrado no catálogo.");
        e.status = 400;
        throw e;
      }

      const carta = cartaResult.rows[0];
      const estoqueAtual = carta.quantidade;
      const preco_unitario = carta.preco;

      if (estoqueAtual < quantidade) {
        await client.query("ROLLBACK");
        const e = new Error("Estoque insufienciente para a quantidade solicitada.");
        e.status = 400;
        throw e;
      }

      const itemExistente = await client.query(
        "SELECT id, quantidade FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2",
        [usuarioId, produto_id]
      );

      let result;
      if (itemExistente.rows.length > 0) {
        const existingItem = itemExistente.rows[0];
        const novaQuantidade = existingItem.quantidade + quantidade;

        if (estoqueAtual < novaQuantidade) {
          await client.query("ROLLBACK");
          const e = new Error(
            `Estoque insuficiente. Você já tem ${existingItem.quantidade} no carrinho e o estoque total é ${estoqueAtual}.`
          );
          e.status = 400;
          throw e;
        }

        result = await client.query(
          "UPDATE carrinho_itens SET quantidade = $1, preco_unitario = $2 WHERE id = $3 RETURNING *",
          [novaQuantidade, preco_unitario, existingItem.id]
        );
      } else {
        result = await client.query(
          "INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *",
          [usuarioId, produto_id, quantidade, preco_unitario]
        );
      }

      await client.query("COMMIT");
      return result.rows[0];

    } catch (err) {
      console.error("ERRO REAL:", err);
      await client.query("ROLLBACK");

      if (err.code === "23505") {
        const e = new Error("Este item já está sendo adicionado ao carrinho. Tente atualizar a quantidade.");
        e.status = 409;
        throw e;
      }

      const e = new Error("Erro interno do servidor ao processar o carrinho");
      e.status = 500;
      throw e;

    } finally {
      client.release();
    }
  },

  async listarCarrinho(usuarioId) {
    try {
      const result = await db.query(
        "SELECT * FROM carrinho_itens WHERE usuario_id = $1 ORDER BY adicionado_em DESC",
        [usuarioId]
      );
      return result.rows;

    } catch (err) {
      console.error("Erro ao listar carrinho:", err.message);
      const e = new Error("Erro interno do servidor ao buscar itens do carrinho.");
      e.status = 500;
      throw e;
    }
  },

  async atualizarItem(usuarioId, itemId, novaQuantidade) {
    if (novaQuantidade == null || typeof novaQuantidade !== "number" || novaQuantidade <= 0) {
      const e = new Error("A quantidade deve ser um número positivo.");
      e.status = 400;
      throw e;
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const itemResult = await client.query(
        "SELECT produto_id, quantidade FROM carrinho_itens WHERE id = $1 AND usuario_id = $2 FOR UPDATE",
        [itemId, usuarioId]
      );

      if (itemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        const e = new Error("Item do carrinho não encontrado ou não pertence a este usuário.");
        e.status = 404;
        throw e;
      }

      const produtoId = itemResult.rows[0].produto_id;

      const cartaResult = await client.query(
        "SELECT quantidade FROM cartas WHERE id = $1",
        [produtoId]
      );

      if (cartaResult.rows.length === 0) {
        await client.query("ROLLBACK");
        const e = new Error("Erro: Produto associado ao carrinho não encontrado no catálogo.");
        e.status = 500;
        throw e;
      }

      const estoqueAtual = cartaResult.rows[0].quantidade;

      if (novaQuantidade > estoqueAtual) {
        await client.query("ROLLBACK");
        const e = new Error(`Estoque insuficiente. Apenas ${estoqueAtual} unidades disponíveis.`);
        e.status = 400;
        throw e;
      }

      const update = await client.query(
        "UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *",
        [novaQuantidade, itemId, usuarioId]
      );

      await client.query("COMMIT");
      return update.rows[0];

    } catch (err) {
      await client.query("ROLLBACK");
      const e = new Error("Erro interno do servidor ao processar atualização do carrinho.");
      e.status = 500;
      throw e;

    } finally {
      client.release();
    }
  },

  async removerItem(usuarioId, itemId) {
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      const itemResult = await client.query(
        "SELECT produto_id FROM carrinho_itens WHERE id = $1 AND usuario_id = $2 FOR UPDATE",
        [itemId, usuarioId]
      );

      if (itemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        const e = new Error("Item do carrinho não encontrado ou não pertence a este usuário.");
        e.status = 404;
        throw e;
      }

      await client.query(
        "DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2",
        [itemId, usuarioId]
      );

      await client.query("COMMIT");
      return true;

    } catch (err) {
      await client.query("ROLLBACK");
      const e = new Error("Erro interno do servidor ao processar remoção do carrinho.");
      e.status = 500;
      throw e;

    } finally {
      client.release();
    }
  }

};
