const usuariosController = require("../../src/controllers/usuariosController");
const usuariosService = require("../../src/services/usuariosService");

jest.mock("../../src/services/usuariosService");

describe("Controller: Usuários", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, headers: {}, usuarioId: null };
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        jest.clearAllMocks();
    });

    describe("registrar()", () => {
        it("deve retornar 201 e os dados do usuário registrado", async () => {
            req.body = {
                email: "a@a.com",
                senha: "123",
                nomeCompleto: "Teste",
                cpf: "123"
            };

            usuariosService.registrarUsuario.mockResolvedValue({
                id: 1,
                email: "a@a.com"
            });

            await usuariosController.registrar(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Usuário criado com sucesso",
                usuario: {
                    id: 1,
                    email: "a@a.com"
                }
            });
        });

        it("deve retornar o erro do service", async () => {
            req.body = {};

            usuariosService.registrarUsuario.mockRejectedValue({
                status: 400,
                message: "Preencha todos os campos obrigatórios."
            });

            await usuariosController.registrar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Preencha todos os campos obrigatórios."
            });
        });
    });

    describe("login()", () => {
        it("deve retornar token no login correto", async () => {
            req.body = { email: "a@a.com", senha: "123" };

            usuariosService.loginUsuario.mockResolvedValue("TOKEN123");

            await usuariosController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Login bem-sucedido!",
                token: "TOKEN123" });
        });

        it("deve retornar falha do service", async () => {
            usuariosService.loginUsuario.mockRejectedValue({
                status: 401,
                message: "Credenciais inválidas."
            });

            await usuariosController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Credenciais inválidas."
            });
        });
    });

    describe("meuPerfil()", () => {
        it("deve retornar o perfil do usuário", async () => {
            req.usuario = { id: 10 };

            usuariosService.buscarPerfil.mockResolvedValue({
                id: 10, nome_completo: "Fulano"
            });

            await usuariosController.meuPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                id: 10,
                nome_completo: "Fulano"
            });
        });

        it("deve retornar 404 se perfil não existir", async () => {
            req.usuario = { id: 999 };

            usuariosService.buscarPerfil.mockResolvedValue(null);

            await usuariosController.meuPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Usuário não encontrado."
            });
        });
    });

    describe("atualizar()", () => {
        it("deve atualizar com sucesso", async () => {
            req.usuarioId = 1;
            req.body = { nomeCompleto: "X", senhaAtual: "123" };

            usuariosService.atualizarPerfil.mockResolvedValue(true);

            await usuariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Perfil atualizado com sucesso."
            });
        });

        it("deve retornar erro do service", async () => {
            usuariosService.atualizarPerfil.mockRejectedValue({
                status: 400,
                message: "Senha atual incorreta."
            });

            await usuariosController.atualizar(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Senha atual incorreta."
            });
        });
    });
});
