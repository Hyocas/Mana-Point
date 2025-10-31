const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

router.post('/cartas/ydk', async (req, res) => {
    const { deckList } = req.body;

    if (!deckList || !Array.isArray(deckList)) {
        return res.status(400).json({ message: 'Deck list inválido.' });
    }

    try {
        // 1. Usamos um array normal para guardar os resultados
        const cartasProcessadas = [];
        
        // 2. Criamos um contador APENAS para as requisições à API
        let apiRequestCount = 0;

        // 3. Trocamos Promise.all por um loop for...of para processar sequencialmente
        for (const cardId of deckList) {
            
            // Usamos um try/catch interno para que um card com falha não pare o loop
            try {
                const result = await db.query('SELECT * FROM cartas WHERE id = $1', [cardId]);

                // Se a carta já existe no DB, adicione ao resultado e pule para a próxima
                if (result.rows.length > 0) {
                    cartasProcessadas.push(result.rows[0]);
                    continue; // Pula para o próximo cardId sem contar como requisição de API
                }

                // --- LÓGICA DE RATE LIMIT ---
                // Se a carta NÃO está no DB, vamos buscar na API.
                // Verificamos se já atingimos o limite de 19 requisições.
                if (apiRequestCount > 0 && apiRequestCount % 19 === 0) {
                    console.log(`[catalogo_api] Limite de 19 requisições atingido. Pausando por 2 segundos...`);
                    await sleep(2000); // Pausa por 2000ms (2 segundos)
                }
                // ---------------------------

                console.warn(`[catalogo_api] Carta ID ${cardId} não encontrada no DB. Buscando na API...`);
                
                const apiRes = await axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
                
                // Incrementamos o contador APÓS a chamada bem-sucedida
                apiRequestCount++;

                if (!apiRes.data.data || apiRes.data.data.length === 0) {
                    console.warn(`[catalogo_api] Carta com ID ${cardId} não encontrada na API YGOProDeck.`);
                    continue; // Pula esta carta
                }

                const carta = apiRes.data.data[0];

                // Mapeamento dos dados
                const nomeCarta = carta.name;
                const id = carta.id || null;
                const tipo = carta.type || null;
                const ataque = carta.atk || null;
                const defesa = carta.def || null;
                const efeito = carta.desc || null;
                const preco = carta.card_prices?.[0]?.cardmarket_price * 5.37 || 0;
                const imagemUrl = carta.card_images?.[0]?.image_url || null;
                const quantidade = 0; 

                // Inserir no DB
                const insert = await db.query(
                    `INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING *`,
                    [id, nomeCarta, tipo, ataque, defesa, efeito, preco, imagemUrl, quantidade]
                );

                cartasProcessadas.push(insert.rows[0]);

            } catch (error) {
                console.error(`[catalogo_api] Falha ao processar card ID ${cardId}: ${error.message}`);
                // Continua o loop mesmo se um card falhar
            }
        }

        // 4. Envia a resposta final com todas as cartas processadas
        return res.status(200).json(cartasProcessadas);

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
        const result = await db.query(
            'SELECT * FROM cartas WHERE nome ILIKE $1',
            [`%${nome}%`]
        );

        if (result.rows.length > 0) {
            return res.status(200).json(result.rows);
        }

        const apiRes = await axios.get(
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(nome)}&format=tcg`
        );

        if (!apiRes.data.data || apiRes.data.data.length === 0) {
            return res.status(404).json({ message: 'Carta não encontrada na API YGOProDeck.' });
        }

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

        return res.status(201).json(insert.rows);
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
        
        const apiRes = await axios.get(
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