exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('cartas', {
        quantidade: {
            type: 'integer',
            notNull: true,
            default: 0
        }
    });
};

exports.down = pgm => {
    pgm.dropColumns('cartas', ['quantidade']);
};