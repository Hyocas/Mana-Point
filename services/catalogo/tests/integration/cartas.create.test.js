jest.mock("axios", () => ({
  create: () => ({
    get: jest.fn(),
    post: jest.fn()
  }),
  post: jest.fn()
}));

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
  });

  it("deve criar carta via API corretamente", async () => {

    axios.post.mockResolvedValue({ status: 200 });

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

});
