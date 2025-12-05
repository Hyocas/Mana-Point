const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {

    async registrarFuncionario({ email, senha, nomeCompleto, dataNascimento, endereco, cpf }, codigoSeguranca, chaveMestra) {

        if (!email || !senha || !nomeCompleto || !cpf || !codigoSeguranca) {
            const e = new Error("Todos os campos são obrigatórios.");
            e.status = 400;
            throw e;
        }

        if (codigoSeguranca !== chaveMestra) {
            const e = new Error("Código de segurança incorreto.");
            e.status = 403;
            throw e;
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const query = `
            INSERT INTO funcionarios(email, senha_hash, nome_completo, data_nascimento, endereco, cpf)
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
                const e = new Error("Este e-mail ou CPF já está em uso por outro funcionário.");
                e.status = 409;
                throw e;
            }
            throw error;
        }
    },

    async loginFuncionario(email, senha) {

        if (!email || !senha) {
            const e = new Error("Email e senha são obrigatórios.");
            e.status = 400;
            throw e;
        }

        const result = await db.query("SELECT * FROM funcionarios WHERE email = $1", [email]);
        const funcionario = result.rows[0];

        if (!funcionario) {
            const e = new Error("Credenciais inválidas.");
            e.status = 401;
            throw e;
        }

        const senhaValida = await bcrypt.compare(senha, funcionario.senha_hash);
        if (!senhaValida) {
            const e = new Error("Credenciais inválidas.");
            e.status = 401;
            throw e;
        }

        return jwt.sign(
            {
                id: funcionario.id,
                email: funcionario.email,
                cargo: "funcionario",
                nome: funcionario.nome_completo
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    },

    validarTokenFuncionario(token) {
        if (!token) {
            const e = new Error("Token ausente.");
            e.status = 400;
            throw e;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.cargo !== "funcionario") {
                const e = new Error("Token não pertence a funcionário.");
                e.status = 403;
                throw e;
            }

            return decoded;

        } catch (err) {

            if (err.message === "Token não pertence a funcionário.") {
                throw err;
            }

            const e = new Error("Token inválido.");
            e.status = 401;
            throw e;
        }
    },

    async buscarPerfil(id) {
        const result = await db.query(
            'SELECT id, nome_completo, email, data_nascimento, endereco, cpf, criado_em FROM funcionarios WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    },

    async atualizar(id, body, senhaAtualHash) {
        const { nomeCompleto, dataNascimento, endereco, novaSenha, senhaAtual } = body;

        if (!senhaAtual) {
            const e = new Error("É necessário informar a senha atual para confirmar as alterações.");
            e.status = 400;
            throw e;
        }

        const senhaValida = await bcrypt.compare(senhaAtual, senhaAtualHash);

        if (!senhaValida) {
            const e = new Error("A senha atual está incorreta.");
            e.status = 401;
            throw e;
        }

        let senhaFinal = senhaAtualHash;

        if (novaSenha && novaSenha.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            senhaFinal = await bcrypt.hash(novaSenha, salt);
        }

        await db.query(`
            UPDATE funcionarios
               SET nome_completo = $1,
                   data_nascimento = $2,
                   endereco = $3,
                   senha_hash = $4
             WHERE id = $5
        `, [nomeCompleto, dataNascimento, endereco, senhaFinal, id]);

        return true;
    }
};
