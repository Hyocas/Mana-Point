const db = require('../db');
const axios = require('axios');
const { axiosRetry, exponentialDelay } = require('axios-retry');

const apiClient = axios.create({ timeout: 5000 });
axiosRetry(apiClient, { retries: 3, retryDelay: exponentialDelay });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {

  async processarYdk(deckList) {
    if (!Array.isArray(deckList)) {
      const e = new Error('Deck list inválido.');
      e.status = 400;
      throw e;
    }

    const idCount = {};
    deckList.forEach(id => {
      idCount[id] = (idCount[id] || 0) + 1;
    });

    const cartasProcessadas = [];
    let apiRequestCount = 0;

    for (const cardId of deckList) {
      try {
        const result = await db.query('SELECT * FROM cartas WHERE id = $1', [cardId]);
        if (result.rows.length > 0) {
          cartasProcessadas.push(result.rows[0]);
          continue;
        }

        if (apiRequestCount > 0 && apiRequestCount % 19 === 0) {
          console.log(`[catalogo_api] Aguardando 2s para respeitar limite da API...`);
          await sleep(2000);
          apiRequestCount = 0;
        }

        const apiRes = await apiClient.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
        apiRequestCount++;

        if (!apiRes?.data?.data || apiRes.data.data.length === 0) {
          continue;
        }

        const carta = apiRes.data.data[0];
        const id = carta.id;
        const nome = carta.name;
        const tipo = carta.type || null;
        const ataque = carta.atk ?? null;
        const defesa = carta.def ?? null;
        const efeito = carta.desc ?? null;
        const preco = (carta.card_prices?.[0]?.cardmarket_price ? Number(carta.card_prices[0].cardmarket_price) : 0) * 5.37;
        const imagem_url = carta.card_images?.[0]?.image_url ?? null;
        const quantidade = 0;

        const insert = await db.query(
          `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING *`,
          [id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade]
        );

        cartasProcessadas.push(insert.rows[0]);

      } catch (err) {
        if (!err.status) err.status = 500;
        console.error(`[catalogo_api] Erro ao processar carta ${cardId}:`, err.message);
      }
    }

    console.log('[catalogo_api] Todas as cartas foram processadas.');

    try {
      const disponiveisQuery = `
        SELECT id, nome, quantidade, preco
        FROM cartas
        WHERE id = ANY($1::int[])
        AND quantidade > 0
      `;
      const disponiveisResult = await db.query(disponiveisQuery, [Object.keys(idCount).map(Number)]);
      const disponiveis = disponiveisResult.rows;

      return {
        message: 'Cartas processadas com sucesso.',
        total: cartasProcessadas.length,
        disponiveis,
        idCount,
        prompt: 'Deseja adicionar ao carrinho as cartas que estão disponíveis em estoque?'
      };
    } catch (err) {
      console.error('[catalogo_api] Erro ao buscar cartas disponíveis:', err.message);
      const e = new Error('Erro ao processar a lista de cartas.');
      e.status = 500;
      throw e;
    }
  },

  async buscarPorNomeOuEfeito(nome) {
    if (!nome || nome.trim() === '') {
      const e = new Error('O parâmetro "nome" é obrigatório.');
      e.status = 400;
      throw e;
    }

    const resultNome = await db.query('SELECT * FROM cartas WHERE nome ILIKE $1', [`%${nome}%`]);

    let cartaAdicionadaViaAPI = null;
    if (resultNome.rows.length === 0) {
      try {
        const apiRes = await apiClient.get(
          `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(nome)}&format=tcg`
        );

        if (apiRes.data?.data?.length > 0) {
          const carta = apiRes.data.data[0];

          const nomeCarta = carta.name;
          const id = carta.id || null;
          const tipo = carta.type || null;
          const ataque = carta.atk || null;
          const defesa = carta.def || null;
          const efeito = carta.desc || null;
          const preco = (carta.card_prices?.[0]?.cardmarket_price ? Number(carta.card_prices[0].cardmarket_price) : 0) * 5.37 || 0;
          const imagemUrl = carta.card_images?.[0]?.image_url || null;
          const quantidade = 0;

          const insert = await db.query(
            `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, nomeCarta, tipo, ataque, defesa, efeito, preco, imagemUrl, quantidade]
          );

          cartaAdicionadaViaAPI = insert.rows[0];
        }

      } catch (err) {
        console.warn("[YGOProDeck] Nenhuma carta encontrada na API.");
      }
    }

    const resultEfeito = await db.query(
      `SELECT * FROM cartas WHERE efeito ILIKE $1`,
      [`%${nome}%`]
    );

    const respostas = [];
    if (resultNome.rows.length > 0) respostas.push(...resultNome.rows);
    if (cartaAdicionadaViaAPI) respostas.push(cartaAdicionadaViaAPI);

    const idsExistentes = new Set(respostas.map(c => c.id));
    for (const row of resultEfeito.rows) {
      if (!idsExistentes.has(row.id)) {
        respostas.push(row);
      }
    }

    if (respostas.length === 0) {
      const e = new Error('Nenhuma carta encontrada.');
      e.status = 404;
      throw e;
    }

    return respostas;
  },

  async listarCartas() {
    const result = await db.query('SELECT * FROM cartas ORDER BY id ASC');
    return result.rows;
  },

  async buscarCartaPorId(id) {
    const cardId = parseInt(id);
    if (Number.isNaN(cardId)) {
      const e = new Error('O ID fornecido é inválido.');
      e.status = 400;
      throw e;
    }

    const result = await db.query('SELECT * FROM cartas WHERE id = $1', [cardId]);
    if (result.rows.length === 0) {
      const e = new Error('Carta não encontrada.');
      e.status = 404;
      throw e;
    }
    return result.rows[0];
  },

  async adicionarCartaPorNome(nome, quantidade, token) {
    if (!token) {
      const e = new Error('Token de autenticação não fornecido.');
      e.status = 401;
      throw e;
    }

    let tokenRes;
    try {
      tokenRes = await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });
    } catch (err) {
      console.error('[catalogo_api] Erro na validação do token:', err.message);
      const e = new Error('Acesso não autorizado. Token inválido.');
      e.status = 401;
      throw e;
    }

    if (!tokenRes?.data?.valido) {
      const e = new Error('Acesso não autorizado. Token inválido.');
      e.status = 401;
      throw e;
    }

    if (!nome || nome.trim() === '') {
      const e = new Error('O nome da carta é obrigatório.');
      e.status = 400;
      throw e;
    }

    const result = await db.query('SELECT * FROM cartas WHERE nome ILIKE $1', [`%${nome}%`]);
    if (result.rows.length > 0) {
      return {
        message: `A carta "${result.rows[0].nome}" já está cadastrada no sistema.`,
        carta: result.rows[0],
        jaExistente: true
      };
    }

    let apiRes;
    try {
      apiRes = await apiClient.get(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(nome)}`
      );
    } catch (err) {
      console.error('[catalogo_api] Erro ao acessar YGOProDeck:', err.message);
      const e = new Error('Erro ao consultar a API YGOProDeck.');
      e.status = 500;
      throw e;
    }

    if (!apiRes?.data?.data || apiRes.data.data.length === 0) {
      const e = new Error('Carta não encontrada na API YGOProDeck.');
      e.status = 404;
      throw e;
    }

    const carta = apiRes.data.data[0];
    const id = carta.id || null;
    const nomeCarta = carta.name;
    const tipo = carta.type || null;
    const ataque = carta.atk || null;
    const defesa = carta.def || null;
    const efeito = carta.desc || null;
    const preco = (carta.card_prices?.[0]?.cardmarket_price ? Number(carta.card_prices[0].cardmarket_price) : 0) * 5.37 || 0;
    const imagemUrl = carta.card_images?.[0]?.image_url || null;

    let insert;
    try {
      insert = await db.query(
        `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [id, nomeCarta, tipo, ataque, defesa, efeito, preco, imagemUrl, quantidade || 0]
      );
    } catch (err) {
      console.error('[catalogo_api] Erro ao inserir carta no DB:', err.message);
      const e = new Error('Erro interno ao adicionar carta.');
      e.status = 500;
      throw e;
    }

    return insert.rows[0];
  },

  async apagarCatalogo(token) {
    if (!token) {
      const e = new Error('Token obrigatório.');
      e.status = 401;
      throw e;
    }

    try {
      await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });
      await db.query('DELETE FROM cartas');
      return;
    } catch (error) {
      if (error.response?.status === 401) {
        const e = new Error('Token inválido.');
        e.status = 401;
        throw e;
      }
      console.error('Erro ao apagar catálogo:', error);
      const e = new Error('Erro interno ao limpar catálogo.');
      e.status = 500;
      throw e;
    }
  },

  async buscarCartaPorId(id) {
    const cardId = parseInt(id);
    if (Number.isNaN(cardId)) {
      const e = new Error('O ID fornecido é inválido.');
      e.status = 400;
      throw e;
    }

    try {
      const result = await db.query('SELECT * FROM cartas WHERE id = $1', [cardId]);

      if (result.rows.length === 0) {
        const e = new Error('Carta não encontrada.');
        e.status = 404;
        throw e;
      }

      return result.rows[0];
    } catch (err) {
      if (err.status) {
        throw err;
      }

      console.error(`[catalogo_api] Erro ao buscar carta ID ${cardId}:`, err.message);
      const e = new Error('Erro interno do servidor.');
      e.status = 500;
      throw e;
    }
  },
  
  async apagarCartaPorId(id, token) {
    if (!token) {
      const e = new Error('Token de autenticação não fornecido.');
      e.status = 401;
      throw e;
    }

    const cardId = parseInt(id);
    if (Number.isNaN(cardId)) {
      const e = new Error('O ID fornecido é inválido.');
      e.status = 400;
      throw e;
    }

    try {
      const tokenRes = await axios.post(
        'http://usuarios_api:3000/api/usuarios/validar-token',
        { token }
      );

      if (!tokenRes?.data?.valido) {
        const e = new Error('Acesso não autorizado. Token inválido.');
        e.status = 401;
        throw e;
      }

      const result = await db.query(
        'DELETE FROM cartas WHERE id = $1 RETURNING *',
        [cardId]
      );

      if (result.rows.length === 0) {
        const e = new Error('Carta não encontrada.');
        e.status = 404;
        throw e;
      }

      return result.rows[0];

    } catch (err) {
      console.error('[catalogo_api] Erro ao apagar carta:', err.message);
      if (err.status) throw err;

      const e = new Error('Erro interno do servidor.');
      e.status = 500;
      throw e;
    }
  }

};
