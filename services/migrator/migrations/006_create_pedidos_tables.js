exports.up = pgm => {
    pgm.createTable('pedidos', {
        id: 'id',
        usuario_id: { type: 'integer', notNull: true, references: 'usuarios(id)', onDelete: 'SET NULL' },
        valor_total: { type: 'numeric(10, 2)', notNull: true },
        status: { type: 'varchar(50)', notNull: true, default: 'processando' },
        criado_em: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    pgm.createTable('pedido_itens', {
        id: 'id',
        pedido_id: { type: 'integer', notNull: true, references: 'pedidos(id)', onDelete: 'CASCADE' },
        produto_id: { type: 'integer', notNull: true, references: 'cartas(id)', onDelete: 'RESTRICT' },
        quantidade: { type: 'integer', notNull: true },
        preco_unitario: { type: 'numeric(10, 2)', notNull: true }
    });

    pgm.createIndex('pedido_itens', 'pedido_id');
    pgm.createIndex('pedido_itens', 'produto_id');
};

exports.down = pgm => {
    pgm.dropTable('pedido_itens');
    pgm.dropTable('pedidos');
};