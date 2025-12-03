const funcionarioService = require('../services/funcionarioService');
const db = require('../db');
const CHAVE_MESTRA_LOJA = process.env.CHAVE_MESTRA_LOJA;

module.exports = {

    async registrar(req, res) {
        try {
            const funcionario = await funcionarioService.registrarFuncionario(
                req.body,
                req.body.codigoSeguranca,
                CHAVE_MESTRA_LOJA
            );

            res.status(201).json({ 
                message: "Funcionário registrado com sucesso!",
                funcionario 
            });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async login(req, res) {
        try {
            const token = await funcionarioService.loginFuncionario(req.body.email, req.body.senha);

            res.status(200).json({ message: "Login de funcionário bem-sucedido!", token });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async validarToken(req, res) {
        try {
            const funcionario = funcionarioService.validarTokenFuncionario(req.body.token);

            res.status(200).json({ valido: true, funcionario });

        } catch (error) {
            res.status(error.status || 500).json({ valido: false, message: error.message });
        }
    },

    async meuPerfil(req, res) {
        try {
            const perfil = await funcionarioService.buscarPerfil(req.usuario.id);

            if (!perfil) {
                return res.status(404).json({ message: "Funcionário não encontrado." });
            }

            if (req.usuario.cargo !== "funcionario") {
                return res.status(403).json({ message: "Rota exclusiva para funcionários." });
            }

            res.json(perfil);

        } catch (_) {
            res.status(500).json({ message: "Erro ao buscar perfil." });
        }
    },

    async atualizar(req, res) {
        try {
            const resultSenha = await db.query(
                'SELECT senha_hash FROM funcionarios WHERE id = $1',
                [req.usuario.id]
            );

            if (resultSenha.rows.length === 0) {
                return res.status(404).json({ message: "Funcionário não encontrado." });
            }

            await funcionarioService.atualizar(
                req.usuario.id,
                req.body,
                resultSenha.rows[0].senha_hash
            );

            res.json({ message: "Perfil atualizado com sucesso!" });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    }
};
