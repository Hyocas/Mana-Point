const carrinhoService = require('../services/carrinhoService');

exports.adicionar = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { usuarioId, cargo } = await carrinhoService.validarToken(token);

    const { produto_id, quantidade } = req.body;

    const result = await carrinhoService.adicionarItem(
      usuarioId, cargo, produto_id, quantidade
    );

    return res.status(201).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { usuarioId, cargo } = await carrinhoService.validarToken(token);

    const usuarioParam = req.params.usuario_id_param;

    if (cargo === "funcionario") {
      return res.status(403).json({ message: "Funcionários não possuem acesso ao carrinho." });
    }

    if (String(usuarioId) !== usuarioParam) {
      return res.status(403).json({ message: "Acesso proibido. Você só pode acessar seu próprio carrinho." });
    }

    const itens = await carrinhoService.listarCarrinho(usuarioId);
    return res.status(200).json(itens);

  } catch (error) {
    console.error(`[GET /carrinho/:id] Erro: ${error.message}`);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { usuarioId } = await carrinhoService.validarToken(token);

    const itemId = req.params.item_id;
    const qtd = req.body.quantidade;

    const result = await carrinhoService.atualizarItem(usuarioId, itemId, qtd);

    return res.status(200).json(result);

  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.remover = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { usuarioId } = await carrinhoService.validarToken(token);

    const itemId = req.params.item_id;

    await carrinhoService.removerItem(usuarioId, itemId);

    return res.status(204).send();

  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};
