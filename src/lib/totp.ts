const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function normalizeBase32(input: string) {
  return input.toUpperCase().replace(/[^A-Z2-7]/g, '');
}

function decodeBase32(secret: string) {
  const normalized = normalizeBase32(secret);
  let bits = '';

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) {
      throw new Error('Invalid base32 character');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

function encodeBase32(bytes: Uint8Array) {
  let bits = '';
  for (const value of bytes) {
    bits += value.toString(2).padStart(8, '0');
  }

  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }

  return output.replace(/=+$/g, '');
}

function toCounterBytes(counter: number) {
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  const high = Math.floor(counter / 2 ** 32);
  const low = counter >>> 0;
  view.setUint32(0, high);
  view.setUint32(4, low);
  return bytes;
}

async function generateTokenForCounter(secret: string, counter: number, digits = 6) {
  const keyBytes = decodeBase32(secret);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, toCounterBytes(counter)));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);
  return String(binary % 10 ** digits).padStart(digits, '0');
}

function currentCounter(timestamp = Date.now(), stepSeconds = 30) {
  return Math.floor(timestamp / 1000 / stepSeconds);
}

export function generateTotpSecret(length = 20) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase32(bytes);
}

export function buildTotpOtpAuthUri(secret: string, accountName: string, issuer: string) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function verifyTotpCode(secret: string, code: string, window = 1) {
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const counter = currentCounter();
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = await generateTokenForCounter(secret, counter + offset);
    if (candidate === normalizedCode) {
      return true;
    }
  }

  return false;
}
