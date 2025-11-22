const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração - Registro de Usuários", () => {

  beforeAll(async () => {
    await db.query("DELETE FROM usuarios;");
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve registrar um usuário com sucesso (201)", async () => {
    const userData = {
      email: "teste@example.com",
      senha: "senha123",
      nomeCompleto: "Usuário Teste",
      dataNascimento: "1990-01-01",
      endereco: "Rua A, 123",
      cpf: "12345678901"
    };

    const res = await request(app)
      .post("/api/usuarios/registro")
      .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body.usuario.email).toBe(userData.email);
    expect(res.body.usuario.nome_completo).toBe(userData.nomeCompleto);
  });

  it("deve retornar 400 se faltar campos obrigatórios", async () => {
    const res = await request(app)
      .post("/api/usuarios/registro")
      .send({
        email: "",
        senha: "",
        nomeCompleto: "",
        cpf: ""
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Preencha todos os campos obrigatórios.");
  });

  it("deve retornar 409 se o e-mail já existir", async () => {
    const user = {
        email: "duplicado@example.com",
        senha: "senha123",
        nomeCompleto: "Usuário Original",
        dataNascimento: "1995-05-10",
        endereco: "Rua ABC",
        cpf: "98765432100"
    };

    await request(app)
        .post("/api/usuarios/registro")
        .send(user);

    const res = await request(app)
        .post("/api/usuarios/registro")
        .send(user);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Este e-mail ou CPF já está em uso.");
    });
});
