import type {
  DataSourceRow,
  DataSourceValue,
  ParquetSchemaColumn,
} from "./dataSource";

export interface PlotPoint {
  label: string;
  value: number;
}

export interface PlotSeries {
  label: string;
  color: string;
  points: PlotPoint[];
}

export interface Cmip7PlotData {
  series: PlotSeries[];
  xColumn: string | null;
  yColumns: string[];
}

const SERIES_COLORS = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

export function buildCmip7PlotData(
  rows: DataSourceRow[],
  schema: ParquetSchemaColumn[],
): Cmip7PlotData {
  const columns = schema.map((column) => column.name);
  const xColumn = findFirstColumn(columns, [
    "year",
    "time",
    "date",
    "datetime",
    "month",
  ]);
  const yColumns = columns.filter(
    (column) => column !== xColumn && hasNumericValue(rows, column),
  );

  const series = yColumns.map((column, index) => ({
    label: column,
    color: SERIES_COLORS[index % SERIES_COLORS.length]!,
    points: rows
      .map((row, rowIndex) => {
        const value = toNumber(row[column]);
        if (value === null) return null;

        return {
          label: xColumn
            ? (formatLabel(row[xColumn]) ?? String(rowIndex + 1))
            : String(rowIndex + 1),
          value,
        };
      })
      .filter((point): point is PlotPoint => point !== null),
  }));

  return { series, xColumn, yColumns };
}

function findFirstColumn(
  columns: string[],
  preferredNames: string[],
): string | null {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeColumnName(column),
  }));

  for (const preferredName of preferredNames) {
    const normalizedPreferredName = normalizeColumnName(preferredName);
    const exactMatch = normalizedColumns.find(
      (column) => column.normalized === normalizedPreferredName,
    );
    if (exactMatch) return exactMatch.original;
  }

  for (const preferredName of preferredNames) {
    const normalizedPreferredName = normalizeColumnName(preferredName);
    const partialMatch = normalizedColumns.find((column) =>
      column.normalized.includes(normalizedPreferredName),
    );
    if (partialMatch) return partialMatch.original;
  }

  return null;
}

function normalizeColumnName(column: string): string {
  return column.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
}

function toNumber(value: DataSourceValue | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function hasNumericValue(rows: DataSourceRow[], column: string): boolean {
  return rows.some((row) => toNumber(row[column]) !== null);
}

function formatLabel(value: DataSourceValue | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return String(value.getUTCFullYear());
  if (Array.isArray(value)) return formatLabel(value.at(0));

  const label = String(value).trim();
  return label.length > 0 ? label : null;
}
