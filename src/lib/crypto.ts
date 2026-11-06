const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(digest);
}

export async function hmacHex(value: string, key: string): Promise<string> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(value),
  );
  return toHex(signature);
}

export async function hashVoteToken(token: string): Promise<string> {
  return hmacHex(token, 'union-vote-v1');
}

export async function proofOfWork(
  value: string,
  difficulty = 2,
): Promise<{ nonce: number; hash: string }> {
  const prefix = '0'.repeat(difficulty);
  let nonce = 0;
  for (;;) {
    const hash = await sha256Hex(`${value}:${nonce}`);
    if (hash.startsWith(prefix)) return { nonce, hash };
    nonce += 1;
  }
}

export async function verifyProof(
  value: string,
  nonce: number,
  hash: string,
  difficulty = 2,
): Promise<boolean> {
  const expected = await sha256Hex(`${value}:${nonce}`);
  return expected === hash && expected.startsWith('0'.repeat(difficulty));
}

export function randomToken(): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
