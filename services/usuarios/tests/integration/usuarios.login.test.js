const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração - Login de Usuários", () => {

  beforeAll(async () => {
    await db.query("DELETE FROM usuarios;");

    await request(app)
      .post("/api/usuarios/registro")
      .send({
        email: "login@example.com",
        senha: "senha123",
        nomeCompleto: "Usuário Login",
        dataNascimento: "1990-01-01",
        endereco: "Rua Teste",
        cpf: "11111111111"
      });
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve fazer login com sucesso e retornar 200 + token", async () => {
    const res = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: "login@example.com",
        senha: "senha123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toBe("Login bem-sucedido!");
  });

  it("deve retornar 400 quando faltar email ou senha", async () => {
    const res = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: "",
        senha: ""
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email e senhas são obrigatórios.");
  });

  it("deve retornar 401 quando o usuário não existir", async () => {
    const res = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: "naoexiste@example.com",
        senha: "senha123"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas.");
  });

  it("deve retornar 401 quando a senha estiver incorreta", async () => {
    const res = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: "login@example.com",
        senha: "senhaErrada"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas.");
  });

});