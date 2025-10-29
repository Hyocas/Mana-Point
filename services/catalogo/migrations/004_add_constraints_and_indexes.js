exports.up = pgm => {
  pgm.addConstraint('carrinho_itens', 'fk_carrinho_usuario', {
    foreignKeys: {
      columns: 'usuario_id',
      references: 'usuarios(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('carrinho_itens', 'fk_carrinho_produto', {
    foreignKeys: {
      columns: 'produto_id',
      references: 'cartas(id)',
      onDelete: 'RESTRICT',
    },
  });

  pgm.createIndex('carrinho_itens', ['usuario_id', 'produto_id'], {
    unique: true,
    name: 'uniq_carrinho_usuario_produto',
  });

  pgm.addConstraint(
    'cartas',
    'check_quantidade_nao_negativa',
    'CHECK (quantidade >= 0)'
  );

  pgm.addConstraint(
    'carrinho_itens',
    'check_quantidade_carrinho_pos',
    'CHECK (quantidade > 0)'
  );

  pgm.addConstraint(
    'cartas',
    'check_preco_nao_negativo',
    'CHECK (preco >= 0)'
  );

  pgm.createIndex('carrinho_itens', 'usuario_id');
  pgm.createIndex('carrinho_itens', 'produto_id');
};

exports.down = pgm => {
  pgm.dropIndex('carrinho_itens', 'produto_id');
  pgm.dropIndex('carrinho_itens', 'usuario_id');
  pgm.dropConstraint('cartas', 'check_preco_nao_negativo');
  pgm.dropConstraint('carrinho_itens', 'check_quantidade_carrinho_pos');
  pgm.dropConstraint('cartas', 'check_quantidade_nao_negativa');
  pgm.dropIndex('carrinho_itens', 'uniq_carrinho_usuario_produto');
  pgm.dropConstraint('carrinho_itens', 'fk_carrinho_produto');
  pgm.dropConstraint('carrinho_itens', 'fk_carrinho_usuario');
};