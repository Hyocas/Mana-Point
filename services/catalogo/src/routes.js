const express = require('express');
const router = express.Router();
const catalogoController = require('./controllers/catalogoController');

// POST /api/cartas/ydk
router.post('/cartas/ydk', catalogoController.processarYdk);

// GET /api/cartas/search?nome=...
router.get('/cartas/search', catalogoController.buscar);

// GET /api/cartas
router.get('/cartas', catalogoController.listar);

// GET /api/cartas/:id
router.get('/cartas/:id', catalogoController.buscarPorId);

// POST /api/cartas
router.post('/cartas', catalogoController.adicionar);

// DELETE /api/cartas
router.delete('/cartas', catalogoController.apagarCatalogo);

// DELETE /api/cartas/:id
router.delete('/cartas/:id', catalogoController.apagarPorId);

module.exports = router;
