exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('cartas', {
        imagem_url: {
            type: 'text',
            notNull: false
        }
    });
};

exports.down = pgm => {
    pgm.dropColumns('cartas', ['imagem_url']);
};