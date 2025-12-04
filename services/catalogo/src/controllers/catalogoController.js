const catalogoService = require('../services/catalogoService');

module.exports = {

  async processarYdk(req, res) {
    const { deckList } = req.body;
    try {
      const resultado = await catalogoService.processarYdk(deckList);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('[catalogo_api] Erro geral na rota /cartas/ydk:', error.message);
      return res.status(error.status || 500).json({ message: error.message || 'Erro ao processar a lista de cartas.' });
    }
  },

  async buscar(req, res) {
    const nome = req.query.nome;
    try {
      const resultado = await catalogoService.buscarPorNomeOuEfeito(nome);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('[catalogo_api] Erro na rota /cartas/search:', error.message);
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      if (error.response) {
        console.error('[YGOProDeck]', error.response.status, error.response.data);
      }
      return res.status(500).json({ message: 'Erro ao buscar carta.' });
    }
  },

  async listar(req, res) {
    try {
      const rows = await catalogoService.listarCartas();
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar cartas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const card = await catalogoService.buscarCartaPorId(req.params.id);
      return res.status(200).json(card);
    } catch (error) {
      console.error(`Erro ao buscar carta com ID ${req.params.id}:`, error);
      return res.status(error.status || 500).json({ message: error.message || 'Erro interno do servidor.' });
    }
  },

  async adicionar(req, res) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader ? tokenHeader.split(' ')[1] : null;
    const { nome, quantidade } = req.body;

    try {
      const resultado = await catalogoService.adicionarCartaPorNome(nome, quantidade, token);
      if (resultado && resultado.jaExistente) {
        return res.status(200).json(resultado);
      }
      return res.status(201).json(resultado);
    } catch (error) {
      console.error('[catalogo_api] Erro ao adicionar carta:', error.message);
      if (error.response) {
        console.error('[catalogo_api] Detalhes do erro YGOProDeck:', error.response.status, error.response.data);
      }
      return res.status(error.status || 500).json({ message: error.message || 'Erro interno ao adicionar carta.' });
    }
  },

  async apagarCatalogo(req, res) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader ? tokenHeader.split(' ')[1] : null;
    try {
      await catalogoService.apagarCatalogo(token);
      return res.status(204).send();
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({ message: error.message || 'Token inválido.' });
      }
      console.error('Erro ao apagar catálogo:', error);
      return res.status(error.status || 500).json({ message: error.message || 'Erro interno ao limpar catálogo.' });
    }
  },

  async apagarPorId(req, res) {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader ? tokenHeader.split(' ')[1] : null;
    try {
      await catalogoService.apagarCartaPorId(req.params.id, token);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar carta:', error);
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
};
