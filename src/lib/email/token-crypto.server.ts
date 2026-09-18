// Criptografia dos tokens OAuth de e-mail antes de gravar em email_accounts
// — "tokens protegidos server-side" não significa só "RLS staff-only"
// (defesa em profundidade de qualquer jeito), significa que o valor gravado
// no banco não é o token em texto puro. AES-256-GCM com node:crypto (Bun
// implementa nativamente); a chave nunca é lida fora deste arquivo.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function loadKey(): Buffer {
  const raw = process.env["EMAIL_TOKEN_ENCRYPTION_KEY"];
  if (!raw)
    throw new Error(
      "EMAIL_TOKEN_ENCRYPTION_KEY ausente — necessária para conectar uma caixa de e-mail.",
    );
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32)
    throw new Error(
      "EMAIL_TOKEN_ENCRYPTION_KEY deve ser uma chave de 32 bytes em base64 (ex.: `openssl rand -base64 32`).",
    );
  return key;
}

/** Formato gravado: base64(iv) + "." + base64(authTag) + "." + base64(ciphertext). */
export function encryptToken(plainText: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptToken(encoded: string): string {
  const key = loadKey();
  const parts = encoded.split(".");
  if (parts.length !== 3) throw new Error("Token criptografado em formato inválido.");
  const [ivB64, authTagB64, cipherB64] = parts as [string, string, string];
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
