const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Login de Funcionários", () => {

  const funcionario = {
    email: "funcionario@example.com",
    senha: "senhaFuncionario123",
    nomeCompleto: "Funcionário Teste",
    cpf: "99988877766",
    endereco: "Rua dos Testes, 123",
    dataNascimento: "1990-10-10",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA
  };

  beforeAll(async () => {
    await db.query("DELETE FROM funcionarios;");

    await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionario);
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve fazer login com sucesso (200)", async () => {
    const res = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: funcionario.email,
        senha: funcionario.senha
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.message).toBe("Login de funcionário bem-sucedido!");
  });

  it("deve retornar 400 quando faltar email ou senha", async () => {
    const res = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: "",
        senha: ""
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email e senha são obrigatórios.");
  });

  it("deve retornar 401 quando o funcionário não existe", async () => {
    const res = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: "inexistente@example.com",
        senha: "qualquerSenha"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas.");
  });

  it("deve retornar 401 quando a senha estiver incorreta", async () => {
    const res = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: funcionario.email,
        senha: "senhaErrada123"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas.");
  });

});
