exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('funcionarios', {
        id: {
            type: 'serial',
            primaryKey: true
        },
        email: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },
        senha_hash: {
            type: 'varchar(255)',
            notNull: true
        },
        codigo_seguranca_hash: {
            type: 'varchar(255)',
            notNull: true
        },
        criado_em: {
            type: 'timestamp with time zone',
            default: pgm.func('current_timestamp')
        }
    });
};

exports.down = pgm => {
    pgm.dropTable('funcionarios');
};
