const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("POST /api/carrinho", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM carrinho_itens;");
    await db.query("DELETE FROM cartas;");
    await db.query("DELETE FROM usuarios;");

    await db.query(`
      INSERT INTO usuarios (id, email, senha_hash)
      VALUES (1, 'teste@teste.com', 'hash123')
    `);

    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, quantidade)
      VALUES (1, 'Dragão Branco', 'Monstro', 3000, 2500, 'Brabo', 20.00, 5)
    `);
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test("401 → sem token", async () => {
    const res = await request(app)
      .post("/api/carrinho")
      .send({ produto_id: 1, quantidade: 1 });

    expect(res.status).toBe(401);
  });

  test("403 → funcionário não pode comprar", async () => {
    jest.spyOn(require("axios"), "post").mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer mocked")
      .send({ produto_id: 1, quantidade: 1 });

    expect(res.status).toBe(403);
  });

  test("400 → campos obrigatórios não enviados", async () => {
    jest.spyOn(require("axios"), "post").mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer token")
      .send({});

    expect(res.status).toBe(400);
  });

  test("400 → estoque insuficiente", async () => {
    jest.spyOn(require("axios"), "post").mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer abc")
      .send({ produto_id: 1, quantidade: 10 });

    expect(res.status).toBe(400);
  });

  test("201 → adiciona ao carrinho com sucesso", async () => {
    jest.spyOn(require("axios"), "post").mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer abc")
      .send({ produto_id: 1, quantidade: 2 });

    expect(res.status).toBe(201);
    expect(res.body.quantidade).toBe(2);
  });

});
