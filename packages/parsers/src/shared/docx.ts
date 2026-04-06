import JSZip from "jszip";

export async function extractDocxEntry(
  arrayBuffer: ArrayBuffer,
  entryPath: string,
): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entry = zip.file(entryPath);

  if (!entry) {
    throw new Error(`DOCX entry not found: ${entryPath}`);
  }

  return entry.async("string");
}

export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}
