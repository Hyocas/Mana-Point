const express = require('express');
const router = express.Router();

const mockCards = [
    { id: 1, nome: "Dragão Branco de Olhos Azuis", tipo: "Monstro", ataque: 3000, defesa: 2500, preco: 99.90 },
    { id: 2, nome: "Mago Negro", tipo: "Mago", ataque: 2500, defesa: 2100, preco: 89.90 },
    { id: 3, nome: "Buraco Negro", tipo: "Magia", efeito: "Destrói todos os monstros no campo.", preco: 75.50 },
    { id: 4, nome: "Cilindro Mágico", tipo: "Armadilha", efeito: "Nega um ataque e inflige dano ao oponente.", preco: 79.00 }
];

router.get('/cartas', (req, res) => {
    res.status(200).json(mockCards);
});

router.get('/cartas/:id', (req, res) => {
    const cardId = parseInt(req.params.id);

    const card = mockCards.find(c => c.id === cardId);

    if (card) {
        res.status(200).json(card);
    } else {
        res.status(404).json({ message: "Carta não encontrada." });
    }
});

module.exports = router;