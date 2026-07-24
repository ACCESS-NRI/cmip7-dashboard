export const PAWSEY_ACACIA_ENDPOINT = "https://projects.pawsey.org.au";

export function resolveAcaciaUrl(
  source: string,
  endpoint = PAWSEY_ACACIA_ENDPOINT,
): string {
  if (!source.startsWith("s3://")) return source;

  const normalizedEndpoint = endpoint.replace(/\/+$/, "");
  return source.replace(/^s3:\/\//, `${normalizedEndpoint}/`);
}
