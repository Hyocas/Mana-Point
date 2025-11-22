const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const apiClient = axios.create({ timeout: 5000 });
axiosRetry(apiClient, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/cartas/ydk', async (req, res) => {
    const { deckList } = req.body;
    const usuarioId = req.usuarioId;

    if (!deckList || !Array.isArray(deckList)) {
        return res.status(400).json({ message: 'Deck list inválido.' });
    }

    try {
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

                if (!apiRes.data.data || apiRes.data.data.length === 0) continue;

                const carta = apiRes.data.data[0];
                const id = carta.id;
                const nome = carta.name;
                const tipo = carta.type || null;
                const ataque = carta.atk || null;
                const defesa = carta.def || null;
                const efeito = carta.desc || null;
                const preco = carta.card_prices?.[0]?.cardmarket_price * 5.37 || 0;
                const imagem_url = carta.card_images?.[0]?.image_url || null;
                const quantidade = 0;

                const insert = await db.query(
                    `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                     RETURNING *`,
                    [id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade]
                );

                cartasProcessadas.push(insert.rows[0]);

            } catch (err) {
                console.error(`[catalogo_api] Erro ao processar carta ${cardId}: ${err.message}`);
            }
        }

        console.log('[catalogo_api] Todas as cartas foram processadas.');

        const disponiveisQuery = `
            SELECT id, nome, quantidade, preco
            FROM cartas
            WHERE id = ANY($1::int[])
            AND quantidade > 0
        `;
        const disponiveisResult = await db.query(disponiveisQuery, [Object.keys(idCount).map(Number)]);
        const disponiveis = disponiveisResult.rows;

        return res.status(200).json({
            message: 'Cartas processadas com sucesso.',
            total: cartasProcessadas.length,
            disponiveis,
            idCount,
            prompt: 'Deseja adicionar ao carrinho as cartas que estão disponíveis em estoque?'
        });

    } catch (error) {
        console.error('[catalogo_api] Erro geral na rota /cartas/ydk:', error.message);
        return res.status(500).json({ message: 'Erro ao processar a lista de cartas.' });
    }
});

router.get('/cartas/search', async (req, res) => {
    const nome = req.query.nome;

    if (!nome || nome.trim() === '') {
        return res.status(400).json({ message: 'O parâmetro "nome" é obrigatório.' });
    }

    try {
        const resultNome = await db.query(
            'SELECT * FROM cartas WHERE nome ILIKE $1',
            [`%${nome}%`]
        );

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
                    const preco = carta.card_prices?.[0]?.cardmarket_price * 5.37 || 0;
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
            `SELECT * FROM cartas 
             WHERE efeito ILIKE $1`,
            [`%${nome}%`]
        );

        const respostas = [];

        if (resultNome.rows.length > 0) {
            respostas.push(...resultNome.rows);
        }

        if (cartaAdicionadaViaAPI) {
            respostas.push(cartaAdicionadaViaAPI);
        }

        const idsExistentes = new Set(respostas.map(c => c.id));
        for (const row of resultEfeito.rows) {
            if (!idsExistentes.has(row.id)) {
                respostas.push(row);
            }
        }

        if (respostas.length === 0) {
            return res.status(404).json({ message: 'Nenhuma carta encontrada.' });
        }

        return res.status(200).json(respostas);

    } catch (error) {
        console.error('[catalogo_api] Erro na rota /cartas/search:', error.message);
        if (error.response) {
            console.error('[YGOProDeck]', error.response.status, error.response.data);
        }
        return res.status(500).json({ message: 'Erro ao buscar carta.' });
    }
});

router.get('/cartas', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cartas ORDER BY id ASC');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar cartas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.get('/cartas/:id', async (req, res) => {
    const cardId = parseInt(req.params.id);

    if (isNaN(cardId)) {
        return res.status(400).json({ message: 'O ID fornecido é inválido.' });
    }

    try {
        const result = await db.query('SELECT * FROM cartas WHERE id = $1', [cardId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Carta não encontrada.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar carta com ID ${cardId}:`, error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/cartas', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[catalogo_api] Validando token para adição de carta:', token);

    try {
        await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });
    } catch (error) {
        console.error('[catalogo_api] Erro na validação do token:', error.message);
        return res.status(401).json({ message: 'Acesso não autorizado. Token inválido.' });
    }

    const { nome, quantidade } = req.body;
    if (!nome) {
        return res.status(400).json({ message: 'O nome da carta é obrigatório.' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM cartas WHERE nome ILIKE $1',
            [`%${nome}%`]
        );

        if (result.rows.length > 0) {
            return res.status(200).json({
                message: `A carta "${result.rows[0].nome}" já está cadastrada no sistema.`,
                carta: result.rows[0],
                jaExistente: true
            });
        }
        
        const apiRes = await apiClient.get(
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(nome)}`
        );

        if (!apiRes.data.data || apiRes.data.data.length === 0) {
            return res.status(404).json({ message: 'Carta não encontrada na API YGOProDeck.' });
        }

        const carta = apiRes.data.data[0];
        const id = carta.id || null;
        const nomeCarta = carta.name;
        const tipo = carta.type || null;
        const ataque = carta.atk || null;
        const defesa = carta.def || null;
        const efeito = carta.desc || null;
        const preco = carta.card_prices?.[0]?.cardmarket_price*5.37 || 0;

        //Extrair a URL da imagem
        const imagemUrl = carta.card_images?.[0]?.image_url || null;

        const insert = await db.query(
            `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [id, nomeCarta, tipo, ataque, defesa, efeito, preco, imagemUrl, quantidade || 0]
        );

        return res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('[catalogo_api] Erro ao adicionar carta:', error.message);
        if (error.response) {
            console.error('[catalogo_api] Detalhes do erro YGOProDeck:',  error.response.status, error.response.data);
        }
        return res.status(500).json({ message: 'Erro interno ao adicionar carta.' });
    }
});

router.delete('/cartas/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[catalogo_api] Tentando validar este token:', token);

    try {
        await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });

    } catch (error) {
        console.error('[catalogo_api] Erro na chamada para usuarios_api:', error.message);
        return res.status(401).json({ message: 'Acesso não autorizado. Token inválido.' });
    }

    try {
        const cardId = parseInt(req.params.id);
        if (isNaN(cardId)) {
            return res.status(400).json({ message: 'O ID fornecido é inválido.' });
        }

        await db.query('DELETE FROM cartas WHERE id = $1', [cardId]);
        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar carta:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;