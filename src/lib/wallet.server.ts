// Server-only crypto + wallet management helpers.
// Encrypts each user's Celo private key with AES-256-GCM using
// WALLET_ENCRYPTION_KEY (32 raw bytes, base64-encoded in the secret).
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Hex } from "viem";

function getKey(): Buffer {
  const raw = process.env.WALLET_ENCRYPTION_KEY;
  if (!raw) throw new Error("WALLET_ENCRYPTION_KEY missing");
  // Accept either base64 or hex or any string — hash to a deterministic 32-byte key.
  // This avoids ops accidents while still being a strong KDF derivative.
  return createHash("sha256").update(raw).digest();
}

export function encryptPrivateKey(privateKey: Hex): { ciphertext: string; iv: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptPrivateKey(ciphertextB64: string, ivB64: string): Hex {
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(ciphertextB64, "base64");
  const tag = data.subarray(data.length - 16);
  const enc = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8") as Hex;
}

export function createShredWallet() {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const { ciphertext, iv } = encryptPrivateKey(pk);
  return { address: account.address, encrypted_private_key: ciphertext, encryption_iv: iv };
}
