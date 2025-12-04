const funcionariosController = require("../../src/controllers/funcionariosController");
const funcionariosService = require("../../src/services/funcionariosService");
const db = require("../../src/db");

jest.mock("../../src/db");
jest.mock("../../src/services/funcionariosService");

describe("Controller: Funcionários", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, usuarioId: null };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe("registrar()", () => {
        it("deve registrar funcionário com sucesso", async () => {
            req.body = { email: "func@x.com", senha: "123", codigoSeguranca: process.env.CHAVE_MESTRA_LOJA };

            funcionariosService.registrarFuncionario.mockResolvedValue({
                id: 1,
                email: "func@x.com"
            });

            await funcionariosController.registrar(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                funcionario: {
                    id: 1,
                    email: "func@x.com"
                },
                message: "Funcionário registrado com sucesso!"
            });
        });

        it("deve retornar erro do service", async () => {
            funcionariosService.registrarFuncionario.mockRejectedValue({
                status: 403,
                message: "Código de segurança incorreto."
            });

            await funcionariosController.registrar(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Código de segurança incorreto."
            });
        });
    });

    describe("login()", () => {
        it("deve retornar token", async () => {
            req.body = { email: "x@x.com", senha: "123" };

            funcionariosService.loginFuncionario.mockResolvedValue("TOKENFUNC");

            await funcionariosController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Login de funcionário bem-sucedido!",
                token: "TOKENFUNC" });
        });

        it("deve retornar erro retornado pelo service", async () => {
            funcionariosService.loginFuncionario.mockRejectedValue({
                status: 400,
                message: "Email e senha são obrigatórios."
            });

            await funcionariosController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email e senha são obrigatórios."
            });
        });
    });

    describe("meuPerfil()", () => {
        it("deve retornar perfil", async () => {
            req.usuario = { id: 10, cargo: "funcionario" };

            funcionariosService.buscarPerfil.mockResolvedValue({
                id: 10,
                nome: "João"
            });

            await funcionariosController.meuPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                id: 10,
                nome: "João"
            });
        });

        it("deve retornar 404 se não existir", async () => {
            req.usuario = { id: 999, cargo: "funcionario" };

            funcionariosService.buscarPerfilFuncionario.mockResolvedValue(null);

            await funcionariosController.meuPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Funcionário não encontrado."
            });
        });
    });

    describe("atualizar()", () => {
        it("deve atualizar com sucesso", async () => {
            req.usuario = { id: 10, cargo: "funcionario" };
            req.body = { nomeCompleto: "X", senhaAtual: "123" };

            db.query.mockResolvedValueOnce({
                rows: [{ senha_hash: "HASH_ATUAL" }]
            });

            funcionariosService.atualizar.mockResolvedValue(true);

            await funcionariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Perfil atualizado com sucesso!"
            });
        });

        it("deve retornar erro do service", async () => {
            req.usuario = { id: 10, cargo: "funcionario" };

            db.query.mockResolvedValueOnce({
                rows: [{ senha_hash: "HASH_ATUAL" }]
            });

            funcionariosService.atualizar.mockRejectedValue({
                status: 401,
                message: "A senha atual está incorreta."
            });

            await funcionariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "A senha atual está incorreta."
            });
        });
    });
});
