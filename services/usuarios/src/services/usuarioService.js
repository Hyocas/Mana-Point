const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {

    async registrarUsuario({ email, senha, nomeCompleto, dataNascimento, endereco, cpf }) {

        if (!email || !senha || !nomeCompleto || !cpf) {
            const e = new Error("Preencha todos os campos obrigatórios.");
            e.status = 400;
            throw e;
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const query = `
            INSERT INTO usuarios(email, senha_hash, nome_completo, data_nascimento, endereco, cpf)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, nome_completo
        `;

        try {
            const result = await db.query(query, [
                email, senhaHash, nomeCompleto, dataNascimento, endereco, cpf
            ]);

            return result.rows[0];

        } catch (error) {
            if (error.code === '23505') {
                const e = new Error("Este e-mail ou CPF já está em uso.");
                e.status = 409;
                throw e;
            }
            throw error;
        }
    },

    async loginUsuario(email, senha) {

        if (!email || !senha) {
            const e = new Error("Email e senhas e são obrigatórios.");
            e.status = 400;
            throw e;
        }

        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        if (!usuario) {
            const e = new Error("Credenciais inválidas.");
            e.status = 401;
            throw e;
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            const e = new Error("Credenciais inválidas.");
            e.status = 401;
            throw e;
        }

        return jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                cargo: "usuario"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    },

    validarTokenUsuario(token) {
        if (!token) {
            const e = new Error("Token ausente.");
            e.status = 400;
            throw e;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (_) {
            const e = new Error("Token inválido.");
            e.status = 401;
            throw e;
        }
    },

    async buscarPerfil(id) {
        const result = await db.query(
            'SELECT id, nome_completo, email, data_nascimento, endereco, cpf, criado_em FROM usuarios WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    },

    async atualizarPerfil(id, body, senhaHashAtual) {
        const { nomeCompleto, dataNascimento, endereco, novaSenha, senhaAtual } = body;

        if (!senhaAtual) {
            const e = new Error("É necessário informar a senha atual para confirmar as alterações.");
            e.status = 400;
            throw e;
        }

        const senhaCorreta = await bcrypt.compare(senhaAtual, senhaHashAtual);

        if (!senhaCorreta) {
            const e = new Error("A senha atual está incorreta.");
            e.status = 401;
            throw e;
        }

        let senhaFinal = senhaHashAtual;

        if (novaSenha && novaSenha.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            senhaFinal = await bcrypt.hash(novaSenha, salt);
        }

        await db.query(`
            UPDATE usuarios
               SET nome_completo = $1,
                   data_nascimento = $2,
                   endereco = $3,
                   senha_hash = $4
             WHERE id = $5
        `, [nomeCompleto, dataNascimento, endereco, senhaFinal, id]);

        return true;
    }
};
