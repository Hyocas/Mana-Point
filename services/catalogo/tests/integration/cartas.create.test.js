jest.mock("axios", () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    }
  };

  return {
    create: () => mockAxiosInstance,
    post: jest.fn(),
    mockInstance: mockAxiosInstance
  };
});

const axios = require("axios");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – POST /api/cartas", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post("/api/cartas")
      .send({ nome: "Teste" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token de autenticação não fornecido.");
  });

  it("deve retornar 401 se o token for inválido", async () => {
    axios.post.mockResolvedValue({
      data: { valido: false, usuario: { id: 1, cargo: "funcionario" } }
    });
    //axios.post.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer invalido")
      .send({ nome: "Teste" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Acesso não autorizado. Token inválido.");
  });

  it("deve retornar 400 se o nome não for enviado", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });
    //axios.post.mockResolvedValue({ status: 200 });

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer valido")
      .send({ nome: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("O nome da carta é obrigatório.");
  });

  it("deve retornar 200 se a carta já existir no sistema", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });
    //axios.post.mockResolvedValue({ status: 200 });

    await db.query(`
      INSERT INTO cartas (id, nome, tipo, quantidade, preco)
      VALUES (99, 'Carta Existente', 'Spell', 0, 10)
    `);

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer valido")
      .send({ nome: "Carta Existente" });

    expect(res.statusCode).toBe(200);
    expect(res.body.jaExistente).toBe(true);
    expect(res.body.carta.id).toBe(99);
  });

  it("deve criar carta via API corretamente (201)", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });
    // axios.post.mockResolvedValue({ status: 200 });

    axios.create().get.mockResolvedValue({
      data: {
        data: [{
          id: 555,
          name: "Mock Create",
          type: "Monster",
          atk: 1500,
          def: 1200,
          desc: "descricao",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer tokenFake")
      .send({ nome: "Mock Create" });

    expect(res.statusCode).toBe(201);

    const check = await db.query("SELECT * FROM cartas WHERE id = 555");
    expect(check.rows.length).toBe(1);
  });

  it("deve retornar 404 quando a carta não existir na API", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });
    //axios.post.mockResolvedValue({ status: 200 });

    axios.create().get.mockResolvedValue({ data: { data: [] } });

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer tokenFake")
      .send({ nome: "CartaInexistente" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Carta não encontrada na API YGOProDeck.");
  });

  it("deve retornar 500 em caso de erro inesperado ao cadastrar", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });
    //axios.post.mockResolvedValue({ status: 200 });
    jest.spyOn(db, "query").mockRejectedValueOnce(new Error("DB FAIL"));

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer tokenFake")
      .send({ nome: "Falha" });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Erro interno ao adicionar carta.");

    db.query.mockRestore();
  });

});
