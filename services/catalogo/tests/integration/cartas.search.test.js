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

describe("Integração – GET /api/cartas/search", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 quando 'nome' não for informado", async () => {
    const res = await request(app).get("/api/cartas/search?nome=");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('O parâmetro "nome" é obrigatório.');
  });

  it("deve retornar 200 e buscar diretamente do banco quando existir correspondência por nome", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (1,'Dark Magician',null,null,null,'efeito',0,null,0)
    `);

    const res = await request(app).get("/api/cartas/search?nome=Magician");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("deve retornar 200 adicionando automaticamente via API quando não existir no banco", async () => {
    axios.create().get.mockResolvedValue({
      data:{
        data:[{
          id:10,
          name:"ViaAPI",
          type:null,
          desc:null,
          atk:null,
          def:null,
          card_prices:[{cardmarket_price:1}],
          card_images:[{image_url:null}]
        }]
      }
    });

    const res = await request(app).get("/api/cartas/search?nome=ViaAPI");

    expect(res.status).toBe(200);
    expect(res.body[0].nome).toBe("ViaAPI");
  });

  it("deve retornar 404 quando o nome não existir nem no banco nem na API", async () => {
    axios.create().get.mockRejectedValue(new Error("not found"));

    const res = await request(app).get("/api/cartas/search?nome=NADA");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Nenhuma carta encontrada.");
  });

  it("deve retornar 500 em caso de erro inesperado durante a busca", async () => {
    jest.spyOn(db,"query").mockRejectedValue(new Error("fail"));

    const res = await request(app).get("/api/cartas/search?nome=test");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro ao buscar carta.");

    db.query.mockRestore();
  });

});
