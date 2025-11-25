jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const apiClient = require("../../src/apiClient");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – POST /api/cartas", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post("/api/cartas")
      .send({ nome: "Teste" });

    expect(res.statusCode).toBe(401);
  });

  it("deve criar carta via API corretamente", async () => {

    apiClient.post.mockResolvedValue({ status: 200 });

    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          id: 555,
          name: "Mock Create",
          type: "Monster",
          desc: "descricao",
          atk: 1500,
          def: 1200,
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

});
