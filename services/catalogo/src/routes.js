const express = require('express');
const router = express.Router();

const catalogoController = require('./controllers/catalogoController');

// Adicionar carta pelo nome (apenas usuário autenticado)
router.post('/cartas', catalogoController.adicionar);

// Buscar por nome ou efeito (livre)
router.get('/cartas/search', catalogoController.buscar);

// Buscar lista .ydk (livre)
router.post('/cartas/ydk', catalogoController.processarYdk);

// Listar todas as cartas (livre)
router.get('/cartas', catalogoController.listar);

// Buscar por ID (livre)
router.get('/cartas/:id', catalogoController.buscarPorId);

// Remover todas as cartas (apenas autenticado)
router.delete('/cartas', catalogoController.apagarCatalogo);

// Remover carta por ID (apenas autenticado)
router.delete('/cartas/:id', catalogoController.apagarPorId);

module.exports = router;
