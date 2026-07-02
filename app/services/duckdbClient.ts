import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

export interface DuckDbConnection {
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}

const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdbWasm,
    mainWorker: duckdbWorker,
  },
};

export async function initializeDuckDB(): Promise<DuckDbConnection> {
  const bundle = DUCKDB_BUNDLES.mvp;
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule);
  const conn = await db.connect();

  return { db, conn };
}

export async function closeDuckDB(connection: DuckDbConnection): Promise<void> {
  await connection.conn.close();
  await connection.db.terminate();
}
