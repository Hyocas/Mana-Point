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

router.post('/checkout', validarToken, async (req, res) => {
    const usuarioId = req.usuarioId;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const itensCarrinho = await client.query(
            'SELECT * FROM carrinho_itens WHERE usuario_id = $1 FOR UPDATE', 
            [usuarioId]
        );
        if (itensCarrinho.rows.length === 0) {
            return res.status(400).json({ message: 'Seu carrinho está vazio.' });
        }

        let valorTotal = 0;

        for (const item of itensCarrinho.rows) {
            const produtoId = item.produto_id;
            const quantidadeDesejada = item.quantidade;

            const cartaResult = await client.query(
                'SELECT quantidade, preco, version FROM cartas WHERE id = $1 FOR UPDATE', 
                [produtoId]
            );
            
            if (cartaResult.rows.length === 0) {
                throw new Error(`Item do carrinho (ID: ${produtoId}) não encontrado no catálogo.`);
            }
            
            const estoqueAtual = cartaResult.rows[0].quantidade;
            const precoAtual = cartaResult.rows[0].preco;
            // const versao = cartaResult.rows[0].version;

            if (estoqueAtual < quantidadeDesejada) {
                throw new Error(`Estoque insuficiente para a carta (ID: ${produtoId}). Desejado: ${quantidadeDesejada}, Disponível: ${estoqueAtual}`);
            }

            await client.query(
                'UPDATE cartas SET quantidade = quantidade - $1 WHERE id = $2', 
                [quantidadeDesejada, produtoId]
            );

            valorTotal += (precoAtual * quantidadeDesejada);
        }
        
        console.log(`[pagamento_api] Pagamento simulado de R$ ${valorTotal} para UsuarioId: ${usuarioId} APROVADO.`);

        const pedidoResult = await client.query(
            'INSERT INTO pedidos (usuario_id, valor_total, status) VALUES ($1, $2, $3) RETURNING id',
            [usuarioId, valorTotal, 'concluido']
        );
        const pedidoId = pedidoResult.rows[0].id;

        const queryItens = `
            INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
            SELECT $1, produto_id, quantidade, preco_unitario 
            FROM carrinho_itens WHERE usuario_id = $2
        `;
        await client.query(queryItens, [pedidoId, usuarioId]);

        await client.query('DELETE FROM carrinho_itens WHERE usuario_id = $1', [usuarioId]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Compra concluída com sucesso!', pedidoId: pedidoId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[pagamento_api] Erro no checkout para UsuarioId: ${usuarioId}: ${error.message}`, error.stack);
        return res.status(500).json({ message: error.message || 'Erro interno do servidor no checkout.' });
    } finally {
        client.release();
    }
});

module.exports = router;