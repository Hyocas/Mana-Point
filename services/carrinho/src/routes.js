const express = require('express');
const router = express.Router();

const carrinhoController = require('./controllers/carrinhoController');

// POST
router.post('/carrinho', carrinhoController.adicionar);

// GET
router.get('/carrinho/:usuario_id_param', carrinhoController.listar);

// PUT
router.put('/carrinho/:item_id', carrinhoController.atualizar);

// DELETE
router.delete('/carrinho/:item_id', carrinhoController.remover);

module.exports = router;
