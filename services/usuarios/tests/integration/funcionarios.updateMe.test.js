const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");
const bcrypt = require("bcryptjs");

describe("Integração – Atualização do Funcionário (PUT /funcionarios/me)", () => {

  let funcionarioToken = null;
  let usuarioToken = null;
  let funcionarioId = null;

  const funcionario = {
    email: "func_update@example.com",
    senha: "senhaFunc123",
    nomeCompleto: "Funcionario Atualizar",
    cpf: "77889911223",
    endereco: "Rua FuncUpdate, 99",
    dataNascimento: "1985-05-05",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA || "MILTINHOOPISCAPISCA"
  };

  const usuario = {
    email: "usuario_comum_update@example.com",
    senha: "senhaUser123",
    nomeCompleto: "Usuário Comum",
    cpf: "66554433221",
    endereco: "Rua UserUpdate, 33",
    dataNascimento: "1993-03-03"
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

  it("deve atualizar os dados do funcionário quando o token é válido e a senha atual está correta (200)", async () => {
    const res = await request(app)
      .put("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`)
      .send({
        nomeCompleto: "Funcionario Atualizado",
        dataNascimento: "1986-06-06",
        endereco: "Rua Atualizada, 444",
        senhaAtual: funcionario.senha,
        novaSenha: "novaSenha456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Perfil atualizado com sucesso!");
  });

  it("deve retornar 400 quando a senha atual não for enviada", async () => {
    const res = await request(app)
      .put("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`)
      .send({
        nomeCompleto: "Qualquer",
        dataNascimento: "1990-10-10",
        endereco: "Rua Teste"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("É necessário informar a senha atual para confirmar as alterações.");
  });

  it("deve retornar 403 quando um usuário tentar acessar rota de funcionário", async () => {
    const res = await request(app)
      .put("/api/funcionarios/me")
      .set("Authorization", `Bearer ${usuarioToken}`)
      .send({
        nomeCompleto: "Teste",
        senhaAtual: "qualquer"
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Acesso restrito a funcionários.");
  });

  it("deve retornar 401 quando a senha atual estiver incorreta", async () => {
    const res = await request(app)
      .put("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`)
      .send({
        nomeCompleto: "Teste",
        dataNascimento: "1999-09-09",
        endereco: "Rua Qualquer",
        senhaAtual: "senhaErrada123"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("A senha atual está incorreta.");
  });

  it("deve retornar 404 quando o funcionário tiver sido removido após obter o token", async () => {
    await db.query("DELETE FROM funcionarios WHERE id = $1", [funcionarioId]);

    const res = await request(app)
      .put("/api/funcionarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`)
      .send({
        nomeCompleto: "Teste",
        dataNascimento: "2000-01-01",
        endereco: "Rua Teste",
        senhaAtual: "novaSenha456"
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Funcionário não encontrado.");
  });

});
