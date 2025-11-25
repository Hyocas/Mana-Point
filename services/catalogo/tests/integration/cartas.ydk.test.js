jest.mock("axios", () => {
  const mockAxiosInstance = {
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

  it("deve retornar 400 quando 'deckList' estiver ausente ou inválida", async () => {
    const res = await request(app).post("/api/cartas/ydk").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Deck list inválido.");
  });

  it("deve retornar 200 ao processar as cartas com sucesso", async () => {
    axios.create().get.mockResolvedValue({
      data: {
        data: [{
          id: 100,
          name: "Mock",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: null }]
        }]
      }
    });

    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList:[100] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it("deve retornar 200 mesmo quando uma das cartas falhar ao consultar a API", async () => {
    axios.create().get
      .mockRejectedValueOnce(new Error("api fail"))
      .mockResolvedValueOnce({
        data:{
          data:[{
            id:200,
            name:"OK",
            card_prices:[{cardmarket_price:1}],
            card_images:[{image_url:null}]
          }]
        }
      });

    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList:[1,2] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it("deve retornar 500 quando ocorrer falha geral no processamento do banco", async () => {
    jest.spyOn(db,"query").mockRejectedValue(new Error("boom"));

    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList:[1] });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro ao processar a lista de cartas.");

    db.query.mockRestore();
  });

});
