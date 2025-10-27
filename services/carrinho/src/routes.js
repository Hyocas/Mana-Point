const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');
const { jwtDecode } = require('jwt-decode');

const validarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticação inválido ou não fornecido.' });
    }
    const token = authHeader.split(' ')[1];

    try {
        await axios.post('http://usuarios_api:3000/api/usuarios/validar-token', { token });
        const decodedToken = jwtDecode(token);
        const usuarioId = decodedToken.id;

        if (!usuarioId) {
            throw new Error('ID do usuário ausente no token.');
        }
        req.usuarioId = usuarioId;
        next();
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[validarToken] Erro na validação/decodificação: ${errorMessage}`);
        return res.status(401).json({ message: 'Acesso não autorizado. Token inválido ou erro interno na validação.' });
    }
};

router.post('/carrinho', validarToken, async (req, res) => {
    const usuarioId = req.usuarioId;
    const { produto_id, quantidade } = req.body;

    if (!usuarioId || !produto_id || quantidade == null) {
        return res.status(400).json({ message: 'Campos obrigatórios: produto_id, quantidade.' });
    }
    if (typeof quantidade !== 'number' || quantidade <= 0) {
        return res.status(400).json({ message: 'Quantidade deve ser um número positivo.' });
    }

    try {
        const response = await axios.get(`http://catalogo_api:3000/api/cartas/${produto_id}`);
        const preco_unitario = response.data.preco;

        if (preco_unitario == null) {
             return res.status(404).json({ message: 'Não foi possível obter o preço do produto (produto não encontrado?).' });
        }

        const itemExistenteQuery = 'SELECT * FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2';
        const itemExistente = await db.query(itemExistenteQuery, [usuarioId, produto_id]);

        let result;
        if (itemExistente.rows.length > 0) {
            const existingItem = itemExistente.rows[0];
            const novaQuantidade = existingItem.quantidade + quantidade;
            const updateQuery = `UPDATE carrinho_itens SET quantidade = $1, preco_unitario = $2 WHERE id = $3 RETURNING *`;
            result = await db.query(updateQuery, [novaQuantidade, preco_unitario, existingItem.id]);
        } else {
            const insertQuery = `INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4) RETURNING *`;
            result = await db.query(insertQuery, [usuarioId, produto_id, quantidade, preco_unitario]);
        }

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`[POST /carrinho] Erro: ${error.message}`);
        return res.status(500).json({ message: 'Erro interno do servidor ao adicionar/atualizar item no carrinho.' });
    }
});

router.get('/carrinho/:usuario_id_param', validarToken, async (req, res) => {
    const usuarioId = req.usuarioId;
    const { usuario_id_param } = req.params;

    if (String(usuarioId) !== usuario_id_param) {
         return res.status(403).json({ message: 'Acesso proibido. Você só pode acessar seu próprio carrinho.' });
    }

    try {
        const query = 'SELECT * FROM carrinho_itens WHERE usuario_id = $1 ORDER BY adicionado_em DESC';
        const result = await db.query(query, [usuarioId]);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(`[GET /carrinho/:id] Erro: ${error.message}`);
        return res.status(500).json({ message: 'Erro interno do servidor ao buscar itens do carrinho.' });
    }
});

router.put('/carrinho/:item_id', validarToken, async (req, res) => {
    const usuarioId = req.usuarioId;
    const { item_id } = req.params;
    const { quantidade } = req.body;

    if (quantidade == null || typeof quantidade !== 'number' || quantidade <= 0) {
        return res.status(400).json({ message: 'A quantidade deve ser um número positivo.' });
    }

    try {
        const query = 'UPDATE carrinho_itens SET quantidade = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *';
        const result = await db.query(query, [quantidade, item_id, usuarioId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado ou não pertence a este usuário.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`[PUT /carrinho/:id] Erro: ${error.message}`);
        return res.status(500).json({ message: 'Erro interno do servidor ao atualizar item do carrinho.' });
    }
});

router.delete('/carrinho/:item_id', validarToken, async (req, res) => {
    const usuarioId = req.usuarioId;
    const { item_id } = req.params;

    try {
        const query = 'DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2 RETURNING *';
        const result = await db.query(query, [item_id, usuarioId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item do carrinho não encontrado ou não pertence a este usuário.' });
        }
        return res.status(204).send();
    } catch (error) {
        console.error(`[DELETE /carrinho/:id] Erro: ${error.message}`);
        return res.status(500).json({ message: 'Erro interno do servidor ao deletar item do carrinho.' });
    }
});

module.exports = router;