import sodium from "libsodium-wrappers";
import { scryptSync } from "node:crypto";

function toBase64(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
}

function fromBase64(value: string): Uint8Array {
  return sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
}

export async function generateVaultSalt(): Promise<string> {
  await sodium.ready;
  return toBase64(sodium.randombytes_buf(16));
}

export async function deriveVaultKey(password: string, vaultSaltBase64: string): Promise<Uint8Array> {
  const salt = fromBase64(vaultSaltBase64);
  const key = scryptSync(password, Buffer.from(salt), 32);
  return new Uint8Array(key);
}

export async function encryptVaultContent(plainText: string, key: Uint8Array): Promise<{ cipher: string; nonce: string }> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipherBytes = sodium.crypto_secretbox_easy(sodium.from_string(plainText), nonce, key);

  return {
    cipher: toBase64(cipherBytes),
    nonce: toBase64(nonce)
  };
}

export async function decryptVaultContent(cipherBase64: string, nonceBase64: string, key: Uint8Array): Promise<string> {
  await sodium.ready;
  const nonce = fromBase64(nonceBase64);
  const cipherBytes = fromBase64(cipherBase64);
  const messageBytes = sodium.crypto_secretbox_open_easy(cipherBytes, nonce, key);

  return sodium.to_string(messageBytes);
}
