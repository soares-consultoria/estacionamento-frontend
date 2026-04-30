/**
 * Calcula o SHA-256 de um File usando a WebCrypto API, lendo em chunks de 2 MB
 * para não travar a UI em arquivos grandes.
 *
 * @returns hex string de 64 caracteres (lowercase)
 */
export async function sha256File(file: File): Promise<string> {
  const CHUNK = 2 * 1024 * 1024; // 2 MB
  const digest = await crypto.subtle.digest('SHA-256', await readChunked(file, CHUNK));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function readChunked(file: File, chunkSize: number): Promise<ArrayBuffer> {
  // Para arquivos pequenos lemos direto; para grandes concatenamos os chunks
  if (file.size <= chunkSize) {
    return file.arrayBuffer();
  }

  const chunks: ArrayBuffer[] = [];
  let offset = 0;
  while (offset < file.size) {
    const blob = file.slice(offset, offset + chunkSize);
    chunks.push(await blob.arrayBuffer());
    offset += chunkSize;
  }

  // Concatena todos os chunks em um único ArrayBuffer
  const total = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), pos);
    pos += chunk.byteLength;
  }
  return result.buffer;
}
