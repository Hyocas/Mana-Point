exports.shorthands = undefined;

exports.up = (pgm) => {
    // Remove a coluna pois a validação será feita via variável de ambiente, não no banco
    pgm.dropColumns('funcionarios', ['codigo_seguranca_hash']);
};

exports.down = (pgm) => {
    // Se precisar reverter, recria a coluna (os dados antigos seriam perdidos de qualquer forma)
    pgm.addColumns('funcionarios', {
        codigo_seguranca_hash: { type: 'varchar(255)', notNull: false } // notNull false para evitar erro na volta
    });
};