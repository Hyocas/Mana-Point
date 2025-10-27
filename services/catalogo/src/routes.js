const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

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
        const apiRes = await axios.get(
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(nome)}&language=pt`
        );

        if (!apiRes.data.data || apiRes.data.data.length === 0) {
            return res.status(404).json({ message: 'Carta não encontrada na API YGOProDeck.' });
        }

        const carta = apiRes.data.data[0];
        const nomeCarta = carta.name;
        const tipo = carta.type || null;
        const ataque = carta.atk || null;
        const defesa = carta.def || null;
        const efeito = carta.desc || null;
        const preco = carta.card_prices?.[0]?.cardmarket_price*5.37 || 0;

        //Extrair a URL da imagem
        const imagemUrl = carta.card_images?.[0]?.image_url || null;

        const result = await db.query(
            `INSERT INTO cartas (nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nomeCarta, tipo, ataque, defesa, efeito, preco, imagemUrl, quantidade || 0]
        );

        return res.status(201).json(result.rows[0]);
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