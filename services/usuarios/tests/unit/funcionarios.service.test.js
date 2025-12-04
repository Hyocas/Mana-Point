const funcionariosService = require("../../src/services/funcionariosService");
const db = require("../../src/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.CHAVE_MESTRA_LOJA = "TESTE_CHAVE";

jest.mock("../../src/db");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Service: Funcionários", () => {

    beforeAll(() => {
        process.env.CHAVE_MESTRA_LOJA = "TESTE_CHAVE";
    });
    
    beforeEach(() => {
        jest.clearAllMocks();
        jwt.verify.mockReset();
    });

    describe("registrarFuncionario()", () => {

        it("deve falhar ao não enviar campos obrigatórios", async () => {
            await expect(
                funcionariosService.registrarFuncionario({ email: "a", senha: "b" })
            ).rejects.toThrow("Todos os campos são obrigatórios.");
        });

        it("deve registrar funcionário com sucesso", async () => {
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("senhaHasheada");

            db.query.mockResolvedValue({
                rows: [{ id: 1, email: "funcionario@example.com" }]
            });

            const res = await funcionariosService.registrarFuncionario({
                email: "funcionario@example.com",
                senha: "senha123",
                nomeCompleto: "Funcionário Teste",
                dataNascimento: "1990-01-01",
                endereco: "Rua Teste",
                cpf: "11111111111",
                codigoSeguranca: "TESTE_CHAVE"
            });

            expect(db.query).toHaveBeenCalled();
            expect(res.email).toBe("funcionario@example.com");
        });

        it("deve falhar se código de segurança for incorreto", async () => {
            await expect(
                funcionariosService.registrarFuncionario({
                    email: "funcionario@example.com",
                    senha: "senha123",
                    nomeCompleto: "Funcionário Teste",
                    dataNascimento: "1990-01-01",
                    endereco: "Rua Teste",
                    cpf: "11111111111",
                    codigoSeguranca: "CODIGO_ERRADO"
                })
            ).rejects.toThrow("Código de segurança incorreto.");
        });

        it("deve lançar erro 409 ao tentar registrar duplicado", async () => {
            const err = new Error();
            err.code = "23505";
            db.query.mockRejectedValue(err);

            await expect(
                funcionariosService.registrarFuncionario({
                    email: "funcionario@example.com",
                    senha: "senha123",
                    nomeCompleto: "Funcionário Teste",
                    dataNascimento: "1990-01-01",
                    endereco: "Rua Teste",
                    cpf: "11111111111",
                    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA
                })
            ).rejects.toThrow("Este e-mail ou CPF já está em uso por outro funcionário.");
        });
    });

    describe("loginFuncionario()", () => {

        it("deve falhar ao faltar email ou senha", async () => {
            await expect(
                funcionariosService.loginFuncionario(null, "123")
            ).rejects.toThrow("Email e senha são obrigatórios.");
        });

        it("deve falhar se funcionário não existir", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await expect(
                funcionariosService.loginFuncionario("x@x.com", "123")
            ).rejects.toThrow("Credenciais inválidas.");
        });

        it("deve falhar com senha incorreta", async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, senha_hash: "HASH" }]
            });

            bcrypt.compare.mockResolvedValue(false);

            await expect(
                funcionariosService.loginFuncionario("x@x.com", "123")
            ).rejects.toThrow("Credenciais inválidas.");
        });

        it("deve retornar token válido", async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, email: "func@x.com", senha_hash: "HASH" }]
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("TOKENFUNC123");

            const res = await funcionariosService.loginFuncionario("func@x.com", "123");

            expect(res).toBe("TOKENFUNC123");
        });
    });

    describe("validarTokenFuncionario()", () => {

        it("deve falhar se token não for enviado", () => {
            expect(() => funcionariosService.validarTokenFuncionario(null))
                .toThrow("Token ausente.");
        });

        it("deve falhar se token não pertencer a funcionário", () => {
            jwt.verify.mockReturnValue({ id: 1, cargo: "usuario" });

            expect(() => funcionariosService.validarTokenFuncionario("token"))
                .toThrow("Token não pertence a funcionário.");
        });

        it("deve falhar se token for inválido", () => {
            jwt.verify.mockImplementation(() => { throw new Error(); });

            expect(() => funcionariosService.validarTokenFuncionario("abc"))
                .toThrow("Token inválido.");
        });

        it("deve retornar token decodificado", () => {
            jwt.verify.mockReturnValue({ id: 10, cargo: "funcionario" });

            const decoded = funcionariosService.validarTokenFuncionario("VALIDO");

            expect(decoded).toEqual({ id: 10, cargo: "funcionario" });
        });
    });

    describe("buscarPerfil()", () => {

        it("deve retornar perfil", async () => {
            db.query.mockResolvedValue({ rows: [{ id: 1, nome: "Fulano" }] });

            const perfil = await funcionariosService.buscarPerfil(1);

            expect(perfil.id).toBe(1);
        });

        it("deve retornar null se não existir", async () => {
            db.query.mockResolvedValue({ rows: [] });

            const perfil = await funcionariosService.buscarPerfil(99);

            expect(perfil).toBe(null);
        });
    });

    describe("atualizar()", () => {

        it("deve falhar sem senha atual", async () => {
            await expect(
                funcionariosService.atualizar(
                    1,
                    {},
                    "HASH_ATUAL"
                )
            ).rejects.toThrow("É necessário informar a senha atual para confirmar as alterações.");
        });

        it("deve falhar com senha atual incorreta", async () => {
            bcrypt.compare.mockResolvedValue(false);

            await expect(
                funcionariosService.atualizar(
                    1,
                    { senhaAtual: "errada" },
                    "HASH"
                )
            ).rejects.toThrow("A senha atual está incorreta.");
        });

        it("deve atualizar sem trocar senha", async () => {
            bcrypt.compare.mockResolvedValue(true);
            db.query.mockResolvedValue({});

            const result = await funcionariosService.atualizar(
                1,
                { senhaAtual: "correta" },
                "HASH"
            );

            expect(result).toBe(true);
        });

        it("deve atualizar trocando a senha", async () => {
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("NOVOHASH");

            const result = await funcionariosService.atualizar(
                1,
                { senhaAtual: "atual", novaSenha: "123" },
                "HASHVELHO"
            );

            expect(result).toBe(true);
        });
    });
});
