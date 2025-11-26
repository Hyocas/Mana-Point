const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Perfil do Funcionário (GET /funcionarios/me)", () => {

  let funcionarioToken = null;
  let usuarioToken = null;
  let funcionarioId = null;

  const funcionario = {
    email: "func_me@example.com",
    senha: "senhaFunc123",
    nomeCompleto: "Funcionario Teste",
    cpf: "11223344556",
    endereco: "Rua Func, 10",
    dataNascimento: "1980-10-10",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA
  };

  const usuario = {
    email: "usuario_me@example.com",
    senha: "senhaUser123",
    nomeCompleto: "Usuário Teste",
    cpf: "99887766554",
    endereco: "Rua User, 55",
    dataNascimento: "1990-01-01"
  };

  beforeAll(async () => {
    await db.query("DELETE FROM funcionarios;");
    await db.query("DELETE FROM usuarios;");

    const regFunc = await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionario);

    funcionarioId = regFunc.body.funcionario.id;

    const loginFunc = await request(app)
      .post("/api/funcionarios/login")
      .send({
        email: funcionario.email,
        senha: funcionario.senha
      });

    funcionarioToken = loginFunc.body.token;

    await request(app)
      .post("/api/usuarios/registro")
      .send(usuario);

    const loginUser = await request(app)
      .post("/api/usuarios/login")
      .send({
        email: usuario.email,
        senha: usuario.senha
      });

    usuarioToken = loginUser.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar o perfil do funcionário quando o token é válido (200)", async () => {
    const res = await request(app)
      .get("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(funcionario.email);
    expect(res.body.nome_completo).toBe(funcionario.nomeCompleto);
  });

  it("deve retornar 401 quando nenhum token for enviado", async () => {
    const res = await request(app).get("/api/funcionarios/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Acesso negado.");
  });

  it("deve retornar 403 quando um usuário tentar acessar rota de funcionário", async () => {
    const res = await request(app)
      .get("/api/funcionarios/me")
      .set("Authorization", `Bearer ${usuarioToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Rota exclusiva para funcionários.");
  });

  it("deve retornar 404 caso o funcionário tenha sido deletado (mesmo com token válido)", async () => {
    await db.query("DELETE FROM funcionarios WHERE id = $1", [funcionarioId]);

    const res = await request(app)
      .get("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Funcionário não encontrado.");
  });

});
