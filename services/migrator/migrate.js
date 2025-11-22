const path = require("path");
const { Client } = require("pg");

const {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  DB_HOST,
  POSTGRES_DB,
  DB_PORT = 5432,
  DB_SSL
} = process.env;

const connectionConfig = {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : false
};

const dbClient = new Client(connectionConfig);

async function runMigrations() {
  console.log("Iniciando a execução das migrations...");

  try {
    const migrationLibrary = await import("node-pg-migrate");

    await dbClient.connect();
    console.log(`Conectado no banco: ${POSTGRES_DB}`);

    await migrationLibrary.runner({
      dbClient,
      dir: path.join(process.cwd(), "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true
    });

    console.log("Migrations executadas com sucesso!");

  } catch (err) {
    console.error("Erro ao executar migrations:", err);
    process.exit(1);

  } finally {
    await dbClient.end();
    console.log("Cliente de migração desconectado.");
  }
}

runMigrations();
