const express = require('express');
const router = express.Router();

const usuarioController = require('./controllers/usuarioController');
const funcionarioController = require('./controllers/funcionarioController');
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Acesso negado." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();

    } catch (error) {
        return res.status(400).json({ message: "Token inválido." });
    }
};

// Registrar novo usuário
router.post('/usuarios/registro', usuarioController.registrar);

// Login de usuário
router.post('/usuarios/login', usuarioController.login);

// Validar token de usuário
router.post('/usuarios/validar-token', usuarioController.validarToken);

// Consultar perfil (usuário autenticado)
router.get('/usuarios/me', verificarToken, usuarioController.meuPerfil);

// Atualizar perfil do usuário autenticado
router.put('/usuarios/me', verificarToken, usuarioController.atualizar);

// Registrar funcionário
router.post('/funcionarios/registro', funcionarioController.registrar);

// Login funcionário
router.post('/funcionarios/login', funcionarioController.login);

// Validar token funcionário
router.post('/funcionarios/validar-token', funcionarioController.validarToken);

// Consultar perfil funcionário autenticado
router.get('/funcionarios/me', verificarToken, funcionarioController.meuPerfil);

// Atualizar perfil funcionário autenticado
router.put('/funcionarios/me', verificarToken, funcionarioController.atualizar);


module.exports = router;
