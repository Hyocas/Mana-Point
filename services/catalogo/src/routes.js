const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/cartas', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cartas ORDER BY id ASC');
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar cartas:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
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
        
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(`Erro ao buscar carta com ID ${cardId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/cartas', async (req, res) => {
    // 1. Recebe os campos corretos, que existem na sua tabela
    const { nome, tipo, ataque, defesa, efeito, preco } = req.body;

    // 2. Valida os campos que são obrigatórios no banco de dados (NOT NULL)
    if (!nome || preco === undefined) { // 'preco' pode ser 0, então checamos se foi definido
        return res.status(400).json({ message: 'Os campos "nome" e "preco" são obrigatórios.' });
    }

    try {
        // 3. Monta a query INSERT com as colunas corretas
        const queryText = `
            INSERT INTO cartas (nome, tipo, ataque, defesa, efeito, preco) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *
        `;

        // 4. Cria o array de valores na ordem correta
        const values = [nome, tipo, ataque, defesa, efeito, preco];

        const result = await db.query(queryText, values);
        
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao criar carta:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    // 5. A linha extra que estava aqui foi removida.
});

module.exports = router;