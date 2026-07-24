import * as duckdb from "@duckdb/duckdb-wasm";
import {
  closeDuckDB,
  initializeDuckDB,
  type DuckDbConnection,
} from "./duckdbClient";

export type DataSourceValue =
  string | number | boolean | bigint | Date | null | DataSourceValue[];

export type DataSourceRow = Record<string, DataSourceValue>;

export interface ParquetDataSourceRequest {
  url: string;
  fileName?: string;
  limit?: number;
  query?: (fileName: string) => string;
}

export interface ParquetDataSourceResult {
  rows: DataSourceRow[];
  columns: string[];
}

export interface ParquetSchemaColumn {
  name: string;
  type: string;
}

export async function fetchParquetSource(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch parquet source: ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function registerParquetSource(
  db: duckdb.AsyncDuckDB,
  fileName: string,
  parquetBytes: Uint8Array,
): Promise<void> {
  await db.registerFileBuffer(fileName, parquetBytes);
}

export async function registerParquetUrl(
  db: duckdb.AsyncDuckDB,
  fileName: string,
  url: string,
): Promise<void> {
  await db.registerFileURL(fileName, url, duckdb.DuckDBDataProtocol.HTTP, true);
}

export async function queryParquetSchema(
  conn: duckdb.AsyncDuckDBConnection,
  fileName: string,
): Promise<ParquetSchemaColumn[]> {
  const sql = `DESCRIBE SELECT * FROM read_parquet('${escapeSqlString(fileName)}')`;
  const queryResult = await conn.query(sql);
  const rows = queryResult.toArray() as Array<{
    column_name: unknown;
    column_type: unknown;
  }>;

  return rows.map((row) => ({
    name: String(row.column_name),
    type: String(row.column_type),
  }));
}

export async function queryParquetSource(
  conn: duckdb.AsyncDuckDBConnection,
  fileName: string,
  limit?: number,
): Promise<ParquetDataSourceResult> {
  const sql = buildDefaultParquetQuery(fileName, limit);
  return queryRows(conn, sql);
}

export async function loadRemoteParquetDataSource({
  url,
  fileName = "source.parquet",
  limit,
  query,
}: ParquetDataSourceRequest): Promise<
  ParquetDataSourceResult & { schema: ParquetSchemaColumn[] }
> {
  const duckdbConnection = await initializeDuckDB();

  try {
    await registerParquetUrl(duckdbConnection.db, fileName, url);
    const schema = await queryParquetSchema(duckdbConnection.conn, fileName);
    const sql = query?.(fileName) ?? buildDefaultParquetQuery(fileName, limit);
    const result = await queryRows(duckdbConnection.conn, sql);
    return {
      ...result,
      columns:
        result.columns.length > 0
          ? result.columns
          : schema.map((column) => column.name),
      schema,
    };
  } finally {
    await closeDuckDB(duckdbConnection);
  }
}

export async function loadParquetDataSource({
  url,
  fileName = "source.parquet",
  limit,
  query,
}: ParquetDataSourceRequest): Promise<ParquetDataSourceResult> {
  const [parquetBytes, duckdbConnection] = await Promise.all([
    fetchParquetSource(url),
    initializeDuckDB(),
  ]);

  try {
    await registerParquetSource(duckdbConnection.db, fileName, parquetBytes);
    const sql = query?.(fileName) ?? buildDefaultParquetQuery(fileName, limit);
    return queryRows(duckdbConnection.conn, sql);
  } finally {
    await closeDuckDB(duckdbConnection);
  }
}

async function queryRows(
  conn: DuckDbConnection["conn"],
  sql: string,
): Promise<ParquetDataSourceResult> {
  const queryResult = await conn.query(sql);
  const rows = normalizeRows(
    queryResult.toArray() as Record<string, unknown>[],
  );
  const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];

  return { rows, columns };
}

function buildDefaultParquetQuery(fileName: string, limit?: number): string {
  const baseQuery = `SELECT * FROM read_parquet('${escapeSqlString(fileName)}')`;
  return Number.isFinite(limit) && limit !== undefined
    ? `${baseQuery} LIMIT ${Math.max(0, Math.floor(limit))}`
    : baseQuery;
}

function normalizeRows(rows: Record<string, unknown>[]): DataSourceRow[] {
  return rows.map((row) => {
    const normalizedRow: DataSourceRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key] = normalizeValue(value);
    }
    return normalizedRow;
  });
}

function normalizeValue(value: unknown): DataSourceValue {
  if (isDuckDbVector(value)) {
    return value.toArray().map(normalizeValue);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    value instanceof Date
  ) {
    return value;
  }

  if (value === undefined) {
    return null;
  }

  return String(value);
}

function isDuckDbVector(value: unknown): value is { toArray: () => unknown[] } {
  return (
    !!value &&
    typeof value === "object" &&
    "toArray" in value &&
    typeof value.toArray === "function"
  );
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}
