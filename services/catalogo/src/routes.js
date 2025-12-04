const express = require('express');
const router = express.Router();

const catalogoController = require('./controllers/catalogoController');
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Acesso negado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; 
        next();
    } catch (error) {
        return res.status(400).json({ message: "Token inválido." });
    }
};

// Adicionar carta pelo nome (apenas usuário autenticado)
router.post('/cartas', verificarToken, catalogoController.adicionar);

// Buscar por nome ou efeito (livre)
router.get('/cartas/search', catalogoController.buscar);

// Buscar lista .ydk (livre)
router.post('/cartas/ydk', catalogoController.processarYdk);

// Listar todas as cartas (livre)
router.get('/cartas', catalogoController.listarTodas);

// Buscar por ID (livre)
router.get('/cartas/:id', catalogoController.buscarPorId);

// Remover todas as cartas (apenas autenticado)
router.delete('/cartas', verificarToken, catalogoController.apagarTudo);

// Remover carta por ID (apenas autenticado)
router.delete('/cartas/:id', verificarToken, catalogoController.apagarPorId);

module.exports = router;
