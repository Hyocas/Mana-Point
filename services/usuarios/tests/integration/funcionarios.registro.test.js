const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração - Registro de Funcionários", () => {

  beforeAll(async () => {
    await db.query("DELETE FROM funcionarios;");
  });

  afterAll(async () => {
    await db.end();
  });

  const funcionarioBase = {
    email: "funcionario@example.com",
    senha: "senha123",
    codigoSeguranca: "MILTINHOOPISCAPISCA",
    nomeCompleto: "Funcionário Teste",
    dataNascimento: "1990-01-01",
    endereco: "Rua Teste",
    cpf: "11111111111"
  };

  it("deve registrar um funcionário com sucesso (201)", async () => {
    const res = await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionarioBase);

    expect(res.statusCode).toBe(201);
    expect(res.body.funcionario.email).toBe(funcionarioBase.email);
    expect(res.body.funcionario.nome_completo).toBe(funcionarioBase.nomeCompleto);
  });

  it("deve retornar 400 se faltar campos obrigatórios", async () => {
    const res = await request(app)
      .post("/api/funcionarios/registro")
      .send({
        email: "",
        senha: "",
        codigoSeguranca: "",
        nomeCompleto: "",
        cpf: ""
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Todos os campos são obrigatórios.");
  });

  it("deve retornar 403 se o código de segurança estiver incorreto", async () => {
    const res = await request(app)
      .post("/api/funcionarios/registro")
      .send({
        ...funcionarioBase,
        email: "func2@example.com",
        cpf: "22222222222",
        codigoSeguranca: "CODIGO_ERRADO"
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe(
      "Código de segurança da loja incorreto. Você não tem permissão para registrar uma conta de funcionário."
    );
  });

  it("deve retornar 409 se o e-mail ou CPF já estiverem em uso", async () => {
    const funcionarioDuplicado = {
      ...funcionarioBase,
      email: "func_dup@example.com",
      cpf: "33333333333",
      codigoSeguranca: "MILTINHOOPISCAPISCA"
    };

    await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionarioDuplicado);

    const res = await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionarioDuplicado);

    expect(res.statusCode).toBe(409);
    expect(res.body.message)
      .toBe("Este E-mail ou CPF já está em uso por outro funcionário.");
  });

});
