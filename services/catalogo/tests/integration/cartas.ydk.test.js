jest.mock("axios", () => ({
  create: () => ({
    get: jest.fn().mockResolvedValue({
      data: {
        data: [{
          id: 3000,
          name: "Mock YDK",
          type: "Spell",
          desc: "efeito",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    }),
    post: jest.fn()
  }),
  post: jest.fn()
}));

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – POST /api/cartas/ydk", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve processar lista YDK simulada", async () => {
    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList: [3000] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

});
