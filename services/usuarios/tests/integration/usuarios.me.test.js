const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Perfil do usuário (GET /usuarios/me)", () => {

  let userToken = null;
  let funcionarioToken = null;
  let userId = null;

  const usuario = {
    email: "me_usuario@example.com",
    senha: "senhaUser123",
    nomeCompleto: "Usuário Perfil",
    cpf: "44455566677",
    endereco: "Rua Perfil, 55",
    dataNascimento: "1990-02-20"
  };

  const funcionario = {
    email: "funcionario.me@example.com",
    senha: "senhaFunc123",
    nomeCompleto: "Funcionario Perfil",
    cpf: "55566677788",
    endereco: "Rua Func, 99",
    dataNascimento: "1980-01-15",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA || "MILTINHOOPISCAPISCA"
  };

  beforeAll(async () => {
    await db.query("DELETE FROM usuarios;");
    await db.query("DELETE FROM funcionarios;");

    const reg = await request(app)
      .post("/api/usuarios/registro")
      .send(usuario);

    userId = reg.body.usuario.id;

    const loginUser = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: usuario.email,
        senha: usuario.senha
      });

    userToken = loginUser.body.token;

    await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionario);

    const loginFunc = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: funcionario.email,
        senha: funcionario.senha
      });

    funcionarioToken = loginFunc.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar o perfil do usuário quando o token é válido (200)", async () => {
    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(usuario.email);
    expect(res.body.nome_completo).toBe(usuario.nomeCompleto);
  });

  it("deve retornar 401 quando o token não for enviado", async () => {
    const res = await request(app).get("/api/usuarios/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Acesso negado.");
  });

  it("deve retornar 403 quando um funcionário tentar acessar (rota exclusiva para usuários)", async () => {
    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Rota exclusiva para usuários.");
  });

  it("deve retornar 404 se o usuário não existir mais no banco", async () => {
    await db.query("DELETE FROM usuarios WHERE id = $1", [userId]);

    const res = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Usuário não encontrado.");
  });

});
