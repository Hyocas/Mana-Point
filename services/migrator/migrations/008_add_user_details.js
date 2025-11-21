exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('usuarios', {
        nome_completo: { type: 'varchar(255)' },
        data_nascimento: { type: 'date' },
        endereco: { type: 'text' }
    });

    pgm.addColumns('funcionarios', {
        nome_completo: { type: 'varchar(255)' },
        data_nascimento: { type: 'date' },
        endereco: { type: 'text' }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('usuarios', ['nome_completo', 'data_nascimento', 'endereco']);
    pgm.dropColumns('funcionarios', ['nome_completo', 'data_nascimento', 'endereco']);
};