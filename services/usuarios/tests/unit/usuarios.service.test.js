const usuariosService = require("../../src/services/usuariosService");
const db = require("../../src/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../src/db");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Service: Usuários", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("registrarUsuario()", () => {

        it("deve lançar erro se faltar campos obrigatórios", async () => {
            await expect(
                usuariosService.registrarUsuario({ email: "a", senha: "b" })
            ).rejects.toThrow("Preencha todos os campos obrigatórios.");
        });

        it("deve registrar usuário com hash de senha", async () => {
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("senhaHasheada");

            db.query.mockResolvedValue({
                rows: [{ id: 1, email: "teste@teste.com" }]
            });

            const res = await usuariosService.registrarUsuario({
                email: "teste@teste.com",
                senha: "123",
                nomeCompleto: "Fulano",
                dataNascimento: "2000-01-01",
                endereco: "Rua A",
                cpf: "123"
            });

            expect(db.query).toHaveBeenCalled();
            expect(res.email).toBe("teste@teste.com");
        });

        it("deve lançar erro 409 ao tentar cadastrar duplicado", async () => {
            const error = new Error();
            error.code = "23505";
            db.query.mockRejectedValue(error);

            await expect(
                usuariosService.registrarUsuario({
                    email: "teste@teste.com",
                    senha: "123",
                    nomeCompleto: "Fulano",
                    dataNascimento: "2000",
                    endereco: "Rua",
                    cpf: "123"
                })
            ).rejects.toThrow("Este e-mail ou CPF já está em uso.");
        });
    });

    describe("loginUsuario()", () => {

        it("deve lançar erro se faltar email ou senha", async () => {
            await expect(usuariosService.loginUsuario(null, "123"))
                .rejects.toThrow("Email e senhas são obrigatórios.");
        });

        it("deve falhar se usuário não existir", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(
                usuariosService.loginUsuario("x@x.com", "123")
            ).rejects.toThrow("Credenciais inválidas.");
        });

        it("deve falhar com senha inválida", async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, senha_hash: "hash123" }]
            });

            bcrypt.compare.mockResolvedValue(false);

            await expect(
                usuariosService.loginUsuario("a@a.com", "123")
            ).rejects.toThrow("Credenciais inválidas.");
        });

        it("deve retornar token se login for válido", async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, email: "a@a.com", senha_hash: "hash" }]
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("TOKEN123");

            const token = await usuariosService.loginUsuario("a@a.com", "123");

            expect(token).toBe("TOKEN123");
        });
    });

    describe("validarTokenUsuario()", () => {

        it("deve falhar sem token", () => {
            expect(() => usuariosService.validarTokenUsuario(null))
                .toThrow("Token ausente.");
        });

        it("deve falhar com token inválido", () => {
            jwt.verify.mockImplementation(() => { throw new Error(); });

            expect(() => usuariosService.validarTokenUsuario("abc"))
                .toThrow("Token inválido.");
        });

        it("deve retornar token decodificado", () => {
            jwt.verify.mockReturnValue({ id: 1 });

            const decoded = usuariosService.validarTokenUsuario("TOKEN");

            expect(decoded).toEqual({ id: 1 });
        });
    });

    describe("buscarPerfil()", () => {

        it("deve retornar perfil", async () => {
            db.query.mockResolvedValue({ rows: [{ id: 1, nome: "Teste" }] });

            const perfil = await usuariosService.buscarPerfil(1);

            expect(perfil.id).toBe(1);
        });

        it("deve retornar null se usuário não existir", async () => {
            db.query.mockResolvedValue({ rows: [] });

            const perfil = await usuariosService.buscarPerfil(99);

            expect(perfil).toBe(null);
        });
    });

    describe("atualizarPerfil()", () => {

        it("deve falhar se não enviar senhaAtual", async () => {
            await expect(
                usuariosService.atualizarPerfil(1, {}, "hash")
            ).rejects.toThrow("É necessário informar a senha atual para confirmar as alterações.");
        });

        it("deve falhar se senha atual estiver incorreta", async () => {
            bcrypt.compare.mockResolvedValue(false);

            await expect(
                usuariosService.atualizarPerfil(1, { senhaAtual: "errada" }, "HASHBD")
            ).rejects.toThrow("A senha atual está incorreta.");
        });

        it("deve atualizar sem trocar senha", async () => {
            bcrypt.compare.mockResolvedValue(true);
            db.query.mockResolvedValue({});

            const result = await usuariosService.atualizarPerfil(
                1,
                { senhaAtual: "correta" },
                "HASH_ATUAL"
            );

            expect(result).toBe(true);
        });

        it("deve atualizar trocando senha nova", async () => {
            bcrypt.compare.mockResolvedValue(true);

            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("NOVOHASH");

            const result = await usuariosService.atualizarPerfil(
                1,
                { senhaAtual: "atual", novaSenha: "123" },
                "HASHVELHO"
            );

            expect(result).toBe(true);
        });
    });
});
