exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.sql(`
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
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        DROP TABLE carrinho_itens;
        DROP TABLE cartas;
        DROP TABLE usuarios;
    `);
};