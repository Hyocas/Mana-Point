exports.up = pgm => {
  pgm.addColumns('cartas', {
    version: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
  });
};

exports.down = pgm => {
  pgm.dropColumns('cartas', ['version']);
};