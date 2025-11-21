exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('usuarios', {
        cpf: { 
            type: 'varchar(14)', 
            unique: true
        }
    });

    pgm.addColumns('funcionarios', {
        cpf: { 
            type: 'varchar(14)', 
            unique: true 
        }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('usuarios', ['cpf']);
    pgm.dropColumns('funcionarios', ['cpf']);
};