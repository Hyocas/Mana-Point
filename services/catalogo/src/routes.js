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

module.exports = router;