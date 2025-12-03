const request = require("supertest");
const axios = require("axios");
const db = require("../../src/db");
const app = require("../../src/app");

jest.mock("axios");

describe("POST /api/carrinho", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM carrinho_itens;");
    await db.query("DELETE FROM cartas;");
    await db.query("DELETE FROM usuarios;");

    await db.query(`
      INSERT INTO usuarios (id, nome, email, senha, cargo)
      VALUES (1, 'Teste', 'teste@teste.com', '123', 'cliente')
    `);

    jest.clearAllMocks();
  });

  afterAll(async () => db.pool.end());

  it("401 → sem token", async () => {
    const res = await request(app).post("/api/carrinho").send({});
    expect(res.status).toBe(401);
  });

  it("403 → funcionário não pode comprar", async () => {
    axios.post.mockResolvedValue({
      data:{ valido:true, usuario:{ id:1, cargo:"funcionario" } }
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization","Bearer token")
      .send({ produto_id:1, quantidade:1 });

    expect(res.status).toBe(403);
  });

  it("400 → campos obrigatórios não enviados", async () => {
    axios.post.mockResolvedValue({
      data:{valido:true,usuario:{id:1,cargo:"cliente"}}
    });

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization","Bearer token")
      .send({ });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Campos obrigatórios: produto_id, quantidade.");
  });

  it("400 → estoque insuficiente", async () => {
    axios.post.mockResolvedValue({
      data:{valido:true,usuario:{id:1,cargo:"cliente"}}
    });

    await db.query(`
      INSERT INTO cartas 
      (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (1, 'Card', null, null, null, 'efeito', 20.00, 'img', 2)
    `);

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization","Bearer token")
      .send({ produto_id:1, quantidade:10 });

    expect(res.status).toBe(400);
  });

  it("201 → adiciona ao carrinho com sucesso", async () => {
    axios.post.mockResolvedValue({
      data:{valido:true,usuario:{id:1,cargo:"cliente"}}
    });

    await db.query(`
      INSERT INTO cartas 
      (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (1, 'Card', null, null, null, 'efeito', 20.00, 'img', 5)
    `);

    const res = await request(app)
      .post("/api/carrinho")
      .set("Authorization","Bearer token")
      .send({ produto_id:1, quantidade:2 });

    expect(res.status).toBe(201);
    expect(res.body.quantidade).toBe(2);
  });

});
