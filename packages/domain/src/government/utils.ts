import { createHash } from "node:crypto";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function deterministicId(namespace: string, value: string): string {
  const hash = createHash("sha1")
    .update(`${namespace}:${value}`)
    .digest("hex");
  const bytes = Buffer.from(hash.slice(0, 32), "hex");
  const versionByte = bytes.at(6);
  const variantByte = bytes.at(8);

  if (versionByte === undefined || variantByte === undefined) {
    throw new Error("Unable to derive a stable UUID from the provided value.");
  }

  bytes[6] = (versionByte & 0x0f) | 0x50;
  bytes[8] = (variantByte & 0x3f) | 0x80;

  const normalized = bytes.toString("hex");

  return `${normalized.slice(0, 8)}-${normalized.slice(
    8,
    12,
  )}-${normalized.slice(12, 16)}-${normalized.slice(
    16,
    20,
  )}-${normalized.slice(20, 32)}`;
}

export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\baging\b/g, "ageing")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
