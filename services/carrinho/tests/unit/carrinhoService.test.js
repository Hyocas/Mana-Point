const carrinhoService = require("../../src/services/carrinhoService");
const db = require("../../src/db");
const axios = require("axios");

jest.mock("../../src/db", () => ({
  pool: {
    connect: jest.fn(),
  },
  query: jest.fn(),
}));

jest.mock("axios");

describe("CarrinhoService - Testes de Unidade", () => {

  describe("validarToken()", () => {

    it("deve lançar erro 401 se nenhum token for enviado", async () => {
      await expect(carrinhoService.validarToken(null))
        .rejects.toMatchObject({ status: 401 });
    });

    it("deve retornar usuarioId e cargo quando o token for válido", async () => {
      axios.post.mockResolvedValue({
        data: { valido: true, usuario: { id: 10, cargo: "cliente" } }
      });

      const result = await carrinhoService.validarToken("abc");
      expect(result).toEqual({ usuarioId: 10, cargo: "cliente" });
    });

    it("deve lançar erro 401 se o serviço não retornar usuário válido", async () => {
      axios.post.mockResolvedValue({ data: { valido: false } });

      await expect(carrinhoService.validarToken("xxx"))
        .rejects.toMatchObject({ status: 401 });
    });

    it("deve lançar erro 401 se ocorrer erro no axios", async () => {
      axios.post.mockRejectedValue(new Error("falha"));

      await expect(carrinhoService.validarToken("abc"))
        .rejects.toMatchObject({ status: 401 });
    });
  });

  describe("adicionarItem()", () => {
    let mockClient;

    beforeEach(() => {
      mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValue(mockClient);
    });

    it("deve lançar 403 se o usuário for funcionário", async () => {
      await expect(
        carrinhoService.adicionarItem(1, "funcionario", 50, 1)
      ).rejects.toMatchObject({ status: 403 });
    });

    it("deve lançar 400 se faltar campos", async () => {
      await expect(
        carrinhoService.adicionarItem(null, "cliente", null, null)
      ).rejects.toMatchObject({ status: 400 });
    });

    it("deve lançar 400 se quantidade for inválida", async () => {
      await expect(
        carrinhoService.adicionarItem(1, "cliente", 5, 0)
      ).rejects.toMatchObject({ status: 400 });
    });

    it("deve lançar 400 se o produto não existir no catálogo", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        carrinhoService.adicionarItem(1, "cliente", 5, 1)
      ).rejects.toMatchObject({ status: 400 });
    });

    it("deve lançar 400 se o estoque for insuficiente", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ preco: 10, quantidade: 0 }] });

      await expect(
        carrinhoService.adicionarItem(1, "cliente", 5, 1)
      ).rejects.toMatchObject({ status: 400 });
    });

    it("deve inserir novo item quando não existe no carrinho", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ preco: 10, quantidade: 10 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 123, quantidade: 1 }] });

      const res = await carrinhoService.adicionarItem(1, "cliente", 5, 1);
      expect(res).toEqual({ id: 123, quantidade: 1 });
    });

    it("deve atualizar item existente", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ preco: 10, quantidade: 10 }] })
        .mockResolvedValueOnce({ rows: [{ id: 99, quantidade: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 99, quantidade: 4 }] });

      const res = await carrinhoService.adicionarItem(1, "cliente", 5, 2);
      expect(res).toEqual({ id: 99, quantidade: 4 });
    });

    it("deve lançar 500 em erro inesperado", async () => {
      mockClient.query.mockRejectedValueOnce(new Error("fail"));

      await expect(
        carrinhoService.adicionarItem(1, "cliente", 5, 1)
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("listarCarrinho()", () => {
    it("deve retornar lista do carrinho", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await carrinhoService.listarCarrinho(1);
      expect(result.length).toBe(2);
    });

    it("deve lançar erro 500 em erro no DB", async () => {
      db.query.mockRejectedValue(new Error("db fail"));

      await expect(carrinhoService.listarCarrinho(1))
        .rejects.toMatchObject({ status: 500 });
    });
  });

  describe("atualizarItem()", () => {
    let mockClient;

    beforeEach(() => {
      mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValue(mockClient);
    });

    it("deve lançar 400 para quantidade inválida", async () => {
      await expect(
        carrinhoService.atualizarItem(1, 10, 0)
      ).rejects.toMatchObject({ status: 400 });
    });

    it("deve lançar 404 se item não encontrado", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        carrinhoService.atualizarItem(1, 10, 5)
      ).rejects.toMatchObject({ status: 404 });
    });

    it("deve lançar 500 se produto inexistente", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ produto_id: 5 }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        carrinhoService.atualizarItem(1, 10, 5)
      ).rejects.toMatchObject({ status: 500 });
    });

    it("deve atualizar item com sucesso", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ produto_id: 5 }] })
        .mockResolvedValueOnce({ rows: [{ quantidade: 10 }] })
        .mockResolvedValueOnce({ rows: [{ id: 10, quantidade: 5 }] });

      const res = await carrinhoService.atualizarItem(1, 10, 5);
      expect(res).toEqual({ id: 10, quantidade: 5 });
    });
  });

  describe("removerItem()", () => {
    let mockClient;

    beforeEach(() => {
      mockClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValue(mockClient);
    });

    it("deve lançar 404 se item não existir", async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        carrinhoService.removerItem(1, 99)
      ).rejects.toMatchObject({ status: 404 });
    });

    it("deve remover item com sucesso", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ produto_id: 5 }] })
        .mockResolvedValueOnce({});

      const res = await carrinhoService.removerItem(1, 5);
      expect(res).toBe(true);
    });

    it("deve lançar 500 se erro inesperado acontecer", async () => {
      mockClient.query.mockRejectedValueOnce(new Error("fail"));

      await expect(
        carrinhoService.removerItem(1, 5)
      ).rejects.toMatchObject({ status: 500 });
    });
  });
});
