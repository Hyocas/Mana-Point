const {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  DB_HOST,
  POSTGRES_DB,
  DB_PORT = 5432
} = process.env;

// Monta a string de conexão
const databaseUrl = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}`;

async function runMigrations() {
  console.log('Iniciando a execução das migrations...');
  try {
    const migrationLibrary = await import('node-pg-migrate');
    await migrationLibrary.runner({
      databaseUrl: databaseUrl,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true
    });

    console.log('Migrations executadas com sucesso!');
  } catch (err) {
    console.error('Erro ao executar migrations:', err);
    process.exit(1);
  }
}

runMigrations();