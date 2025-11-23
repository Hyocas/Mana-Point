const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração - Validação de Token do Usuário", () => {

  let tokenValido;

  beforeAll(async () => {
    await db.query("DELETE FROM usuarios;");

    const user = {
      email: "validartoken@example.com",
      senha: "senha123",
      nomeCompleto: "Usuário Token",
      dataNascimento: "1990-01-01",
      endereco: "Rua Token Teste",
      cpf: "22222222222"
    };

    await request(app)
      .post("/api/usuarios/registro")
      .send(user);

    const resLogin = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: user.email,
        senha: user.senha
      });

    tokenValido = resLogin.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve validar um token válido (200)", async () => {
    const res = await request(app)
      .post("/api/usuarios/validar-token")
      .send({ token: tokenValido });

    expect(res.statusCode).toBe(200);
    expect(res.body.valido).toBe(true);

    expect(res.body.usuario.email).toBe("validartoken@example.com");
    expect(res.body.usuario.cargo).toBe("usuario");
  });

  it("deve retornar 400 se nenhum token for enviado", async () => {
    const res = await request(app)
      .post("/api/usuarios/validar-token")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.valido).toBe(false);
  });

  it("deve retornar 401 para token inválido", async () => {
    const res = await request(app)
      .post("/api/usuarios/validar-token")
      .send({ token: "token_invalido_123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.valido).toBe(false);
    expect(res.body.message).toBe("Token inválido.");
  });

});
