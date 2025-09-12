const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/usuarios/registro', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha){
        return res.status(400).json({ message: "Email e senhas são obrigatórios."});
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const queryInserir = 'INSERT INTO usuarios(email, senha_hash) VALUES($1, $2) RETURNING id, email';
        const queryRetorno = [email, senhaHash];

        const queryResultado = await db.query(queryInserir, queryRetorno);
        const novoUsuario = queryResultado.rows[0];

        res.status(201).json({
            message: "Usuário criado com sucesso",
            usuario: novoUsuario
        });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
})

router.post('/usuarios/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha){
        return res.status(400).json({ message: "Email e senhas são obrigatórios."});
    }

    try {
        const resultado = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(401).json({ message: "Credenciais inválidas."});
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ message: "Credenciais inválidas."});
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        )

        res.status(200).json({ message: "Login bem-sucedido!", token: token });
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    
})

module.exports = router;