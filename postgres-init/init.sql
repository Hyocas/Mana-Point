CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cartas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    ataque INT,
    defesa INT,
    efeito TEXT,
    preco NUMERIC(10, 2) NOT NULL
);

CREATE TABLE carrinho_itens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO cartas (nome, tipo, ataque, defesa, efeito, preco) VALUES 
('Dragão Branco de Olhos Azuis', 'Dragão/Normal', 3000, 2500, 'Um dragão lendário que é uma poderosa máquina de destruição.', 99.90),
('Mago Negro', 'Mago/Normal', 2500, 2100, 'O mago definitivo em termos de ataque e defesa.', 89.90),
('Cilindro Mágico', 'Magia', NULL, NULL, 'Quando um monstro do oponente declara um ataque, escolha o monstro atacante como alvo; troque o alvo do ataque para outro monstro que você controla.', 79.00);