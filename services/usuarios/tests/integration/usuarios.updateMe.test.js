const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");
const bcrypt = require("bcryptjs");

describe("Integração – Atualização do Perfil do Usuário (PUT /usuarios/me)", () => {

  let userToken = null;
  let funcionarioToken = null;
  let userId = null;

  const usuario = {
    email: "put_usuario@example.com",
    senha: "senhaOriginal123",
    nomeCompleto: "Usuário Original",
    cpf: "12312312399",
    endereco: "Rua Original, 1",
    dataNascimento: "1990-03-10"
  };

  const funcionario = {
    email: "funcionario.put@example.com",
    senha: "senhaFuncPUT123",
    nomeCompleto: "Funcionario PUT",
    cpf: "33322211144",
    endereco: "Rua FuncPUT, 22",
    dataNascimento: "1980-01-01",
    codigoSeguranca: process.env.CHAVE_MESTRA_LOJA
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
      .send({ email: usuario.email, senha: usuario.senha });

    userToken = loginUser.body.token;

    await request(app)
      .post("/api/funcionarios/registro")
      .send(funcionario);

    const loginFunc = await request(app)
      .post("/api/funcionarios/login")
      .send({ email: funcionario.email, senha: funcionario.senha });

    funcionarioToken = loginFunc.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve atualizar o perfil com sucesso (200)", async () => {
    const res = await request(app)
      .put("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        nomeCompleto: "Usuário Atualizado",
        dataNascimento: "1991-01-01",
        endereco: "Rua Nova, 123",
        senhaAtual: usuario.senha,
        novaSenha: ""
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Perfil atualizado com sucesso!");
  });

  it("deve retornar 400 quando a senha atual não for enviada", async () => {
    const res = await request(app)
      .put("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        nomeCompleto: "Falha Sem Senha Atual"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("É necessário informar a senha atual para confirmar as alterações.");
  });

  it("deve retornar 403 quando um funcionário tentar atualizar o perfil", async () => {
    const res = await request(app)
      .put("/api/usuarios/me")
      .set("Authorization", `Bearer ${funcionarioToken}`)
      .send({
        nomeCompleto: "Funcionario Tentando",
        senhaAtual: funcionario.senha
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Acesso restrito a usuários.");
  });

  it("deve retornar 401 quando a senha atual estiver incorreta", async () => {
    const res = await request(app)
      .put("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        nomeCompleto: "Tentativa Errada",
        endereco: "Nada muda",
        senhaAtual: "senhaErrada777"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("A senha atual está incorreta.");
  });

  it("deve retornar 404 se o usuário tiver sido deletado após obter o token", async () => {
    await db.query("DELETE FROM usuarios WHERE id = $1", [userId]);

    const res = await request(app)
      .put("/api/usuarios/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        nomeCompleto: "Depois de deletado",
        endereco: "Qualquer",
        senhaAtual: usuario.senha
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Usuário não encontrado.");
  });
//a
});
