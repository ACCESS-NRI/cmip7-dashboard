import { resolveAcaciaUrl } from "./acacia";

const DEFAULT_CMIP7_PARQUET_SOURCE = "s3://gm-tas/gm_tas.pq";
const DEFAULT_CMIP7_PARQUET_FILE_NAME = "gm_tas.pq";

export interface Cmip7ParquetSource {
  source: string;
  url: string;
  fileName: string;
}

export function getCmip7ParquetSource(): Cmip7ParquetSource {
  const config = useRuntimeConfig();
  const source =
    (config.public.cmip7ParquetSource as string) ||
    DEFAULT_CMIP7_PARQUET_SOURCE;

  return {
    source,
    url: resolveAcaciaUrl(source),
    fileName:
      (config.public.cmip7ParquetFileName as string) ||
      DEFAULT_CMIP7_PARQUET_FILE_NAME,
  };
}
