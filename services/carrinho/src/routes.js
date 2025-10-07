const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

const validarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }
    const token = authHeader.split(' ')[1];

    try {
        await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });
        next();
    } catch (error) {
        console.error('[carrinho_api] Erro na validação do token:', error.message);
        return res.status(401).json({ message: 'Acesso não autorizado. Token inválido.' });
    }
};

router.post('/carrinho', validarToken, async (req, res) => {
    const { usuario_id, produto_id, quantidade } = req.body;

    if (!usuario_id || !produto_id || !quantidade) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios: usuario_id, produto_id, quantidade.' });
    }

    try {
        const response = await axios.get(`http://catalogo_api:3000/api/cartas/${produto_id}`);
        const preco_unitario = response.data.preco;

        if (!preco_unitario) {
             return res.status(404).json({ message: 'Não foi possível obter o preço do produto.' });
        }

        const itemExistente = await db.query(
            'SELECT * FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2',
            [usuario_id, produto_id]
        );

        let result;
        if (itemExistente.rows.length > 0) {
            const novaQuantidade = itemExistente.rows[0].quantidade + quantidade;
            result = await db.query(
                `UPDATE carrinho_itens SET quantidade = $1, preco_unitario = $2 
                 WHERE id = $3 RETURNING *`,
                [novaQuantidade, preco_unitario, itemExistente.rows[0].id]
            );
        } else {
            result = await db.query(
                `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [usuario_id, produto_id, quantidade, preco_unitario]
            );
        }

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('[carrinho_api] Erro ao adicionar item ao carrinho:', error.message);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.get('/carrinho/:usuario_id', validarToken, async (req, res) => {
    const { usuario_id } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM carrinho_itens WHERE usuario_id = $1 ORDER BY adicionado_em DESC',
            [usuario_id]
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('[carrinho_api] Erro ao buscar itens do carrinho:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.put('/carrinho/:item_id', validarToken, async (req, res) => {
    const { item_id } = req.params;
    const { quantidade } = req.body;

    if (!quantidade || quantidade <= 0) {
        return res.status(400).json({ message: 'A quantidade deve ser um número positivo.' });
    }

    try {
        const result = await db.query(
            'UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2 RETURNING *',
            [quantidade, item_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('[carrinho_api] Erro ao atualizar item do carrinho:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


router.delete('/carrinho/:item_id', validarToken, async (req, res) => {
    const { item_id } = req.params;

    try {
        const result = await db.query('DELETE FROM carrinho_itens WHERE id = $1 RETURNING *', [item_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado.' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('[carrinho_api] Erro ao deletar item do carrinho:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;