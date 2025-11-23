const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Validação de Token de Funcionários", () => {

  let tokenValido = null;

  const funcionario = {
    email: "funcionario.token@example.com",
    senha: "senhaToken123",
    nomeCompleto: "Funcionário Token",
    cpf: "11122233344",
    endereco: "Rua Token, 987",
    dataNascimento: "1985-05-15",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA || "MILTINHOOPISCAPISCA"
  };

  beforeAll(async () => {
    await db.query("DELETE FROM funcionarios;");

    await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionario);

    const loginRes = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: funcionario.email,
        senha: funcionario.senha
      });

    tokenValido = loginRes.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve validar token válido (200)", async () => {
    const res = await request(app)
      .post("/api/funcionarios/validar-token")
      .send({ token: tokenValido });

    expect(res.statusCode).toBe(200);
    expect(res.body.valido).toBe(true);
    expect(res.body.funcionario.email).toBe(funcionario.email);
  });

  it("deve retornar 401 para token inválido", async () => {
    const res = await request(app)
      .post("/api/funcionarios/validar-token")
      .send({ token: "token_invalido_teste_123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.valido).toBe(false);
    expect(res.body.message).toBe("Token inválido.");
  });

  it("deve retornar 400 quando o token não é enviado", async () => {
    const res = await request(app)
      .post("/api/funcionarios/validar-token")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.valido).toBe(false);
  });

});
