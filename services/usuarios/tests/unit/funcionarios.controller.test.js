const funcionariosController = require("../../src/controllers/funcionariosController");
const funcionariosService = require("../../src/services/funcionarioService");

jest.mock("../../src/services/funcionarioService");

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
            req.body = { email: "func@x.com", senha: "123", codigoSeguranca: "AAA" };

            funcionariosService.registrarFuncionario.mockResolvedValue({
                id: 1,
                email: "func@x.com"
            });

            await funcionariosController.registrar(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                id: 1,
                email: "func@x.com"
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
            expect(res.json).toHaveBeenCalledWith({ token: "TOKENFUNC" });
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

    describe("me()", () => {
        it("deve retornar perfil", async () => {
            req.usuarioId = 5;

            funcionariosService.buscarPerfilFuncionario.mockResolvedValue({
                id: 5,
                nome: "João"
            });

            await funcionariosController.me(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                id: 5,
                nome: "João"
            });
        });

        it("deve retornar 404 se não existir", async () => {
            req.usuarioId = 5;

            funcionariosService.buscarPerfilFuncionario.mockResolvedValue(null);

            await funcionariosController.me(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Funcionário não encontrado."
            });
        });
    });

    describe("atualizar()", () => {
        it("deve atualizar com sucesso", async () => {
            req.usuarioId = 1;
            req.body = { senhaAtual: "123" };

            funcionariosService.atualizarPerfilFuncionario.mockResolvedValue(true);

            await funcionariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Perfil de funcionário atualizado com sucesso."
            });
        });

        it("deve retornar erro do service", async () => {
            funcionariosService.atualizarPerfilFuncionario.mockRejectedValue({
                status: 401,
                message: "Senha atual incorreta."
            });

            await funcionariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Senha atual incorreta."
            });
        });
    });
});
