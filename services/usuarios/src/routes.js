const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CHAVE_MESTRA_LOJA = process.env.CHAVE_MESTRA_LOJA || "MILTINHOOPISCAPISCA";

if (!CHAVE_MESTRA_LOJA) {
    console.error("ERRO FATAL: A variável CHAVE_MESTRA_LOJA não está definida no arquivo .env");
    process.exit(1);
}

router.post('/usuarios/registro', async (req, res) => {
    const { email, senha, nomeCompleto, dataNascimento, endereco, cpf } = req.body;

    if (!email || !senha || !nomeCompleto || !cpf){
        return res.status(400).json({ message: "Preencha todos os campos obrigatórios."});
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const queryInserir = 'INSERT INTO usuarios(email, senha_hash, nome_completo, data_nascimento, endereco, cpf) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, email, nome_completo';
        const queryRetorno = [email, senhaHash, nomeCompleto, dataNascimento, endereco, cpf];

        const queryResultado = await db.query(queryInserir, queryRetorno);
        const novoUsuario = queryResultado.rows[0];

        res.status(201).json({
            message: "Usuário criado com sucesso",
            usuario: novoUsuario
        });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ message: 'Este e-mail ou CPF já está em uso.' });
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
            { 
                id: usuario.id, 
                email: usuario.email,
                cargo: 'usuario'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        res.status(200).json({ message: "Login bem-sucedido!", token: token });
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    
})

router.post('/usuarios/validar-token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valido: false });

    console.log('[usuarios_api] Requisição de validação recebida com o corpo (body):', req.body);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[usuarios_api] Token verificado com sucesso!');
        res.status(200).json({ valido: true, usuario: decoded });
    } catch (error) {
        console.error('[usuarios_api] ERRO na verificação do JWT:', error.message);
        res.status(401).json({ valido: false, message: 'Token inválido.' });
    }
})

console.log('--- CHAVE SECRETA CARREGADA ---');
console.log('Valor de JWT_SECRET:', process.env.JWT_SECRET);
console.log('-----------------------------');

router.post('/funcionarios/registro', async (req, res) => {
    const { email, senha, codigoSeguranca, nomeCompleto, dataNascimento, endereco, cpf } = req.body;

    if (!email || !senha || !codigoSeguranca || !nomeCompleto || !cpf ) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    if (codigoSeguranca !== CHAVE_MESTRA_LOJA) {
        return res.status(403).json({ message: "Código de segurança da loja incorreto. Você não tem permissão para registrar uma conta de funcionário." });
    }

    try {
        // Gerar hash da senha (faltava e causava ReferenceError/500)
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const query = `
            INSERT INTO funcionarios (email, senha_hash, nome_completo, data_nascimento, endereco, cpf)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, nome_completo
        `;

        const result = await db.query(query, [
            email,
            senhaHash,
            nomeCompleto,
            dataNascimento || null,
            endereco || null,
            cpf
        ]);

        res.status(201).json({
            message: "Funcionário registrado com sucesso!",
            funcionario: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: "Este E-mail ou CPF já está em uso por outro funcionário." });
        }
        console.error("Erro ao registrar funcionário:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

router.post('/funcionarios/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: "Email e senha e são obrigatórios." });
    }

    try {
        const result = await db.query("SELECT * FROM funcionarios WHERE email = $1", [email]);
        const funcionario = result.rows[0];

        if (!funcionario) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const senhaValida = await bcrypt.compare(senha, funcionario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const token = jwt.sign(
            {
                id: funcionario.id,
                email: funcionario.email,
                cargo: "funcionario",
                nome: funcionario.nome_completo
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: "Login de funcionário bem-sucedido!", token });

    } catch (error) {
        console.error("Erro no login do funcionário:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

router.post('/funcionarios/validar-token', (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(400).json({ valido: false });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.cargo !== "funcionario") {
            return res.status(403).json({ valido: false, message: "Token não pertence a funcionário." });
        }

        res.status(200).json({ valido: true, funcionario: decoded });

    } catch (error) {
        console.error("Erro ao validar token:", error);
        res.status(401).json({ valido: false, message: "Token inválido." });
    }
});

module.exports = router;