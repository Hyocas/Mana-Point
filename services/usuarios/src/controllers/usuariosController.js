const usuarioService = require('../services/usuarioService');
const db = require('../db');

module.exports = {

    async registrar(req, res) {
        try {
            const usuario = await usuarioService.registrarUsuario(req.body);
            res.status(201).json({ message: "Usuário criado com sucesso", usuario });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async login(req, res) {
        try {
            const token = await usuarioService.loginUsuario(req.body.email, req.body.senha);
            res.status(200).json({ message: "Login bem-sucedido!", token });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    },

    async validarToken(req, res) {
        try {
            const usuario = usuarioService.validarTokenUsuario(req.body.token);
            res.status(200).json({ valido: true, usuario });

        } catch (error) {
            res.status(error.status || 500).json({ valido: false, message: error.message });
        }
    },

    async meuPerfil(req, res) {
        try {
            const perfil = await usuarioService.buscarPerfil(req.usuario.id);

            if (!perfil) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            if (req.usuario.cargo !== "usuario") {
                return res.status(403).json({ message: "Rota exclusiva para usuários." });
            }

            res.json(perfil);

        } catch (_) {
            res.status(500).json({ message: "Erro ao buscar perfil." });
        }
    },

    async atualizar(req, res) {
        try {
            const resultSenha = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);

            if (resultSenha.rows.length === 0) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            if (req.usuario.cargo !== "usuario") {
                return res.status(403).json({ message: "Acesso restrito a usuários." });
            }

            const senhaHashAtual = resultSenha.rows[0].senha_hash;

            await usuarioService.atualizarPerfil(req.usuario.id, req.body, senhaHashAtual);

            res.json({ message: "Perfil atualizado com sucesso!" });

        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    }
};
