jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const apiClient = require("../../src/apiClient");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – POST /api/cartas/ydk", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 se deckList for inválido", async () => {
    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList: "invalido" });

    expect(res.statusCode).toBe(400);
  });

  it("deve processar carta via API corretamente", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          id: 1234,
          name: "Mock YDK Card",
          type: "Monster",
          atk: 1000,
          def: 1000,
          desc: "mock desc",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList: [1234] });

    expect(res.statusCode).toBe(200);

    const check = await db.query("SELECT * FROM cartas WHERE id = 1234");
    expect(check.rows.length).toBe(1);
  });

});
