import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const SALT_ROUNDS = 12;
const HASH_SCHEME = "bcrypt-sha256$";
const MAX_PASSWORD_LENGTH = 1024;

function prehash(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("base64");
}

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Password exceeds the maximum supported length.");
  }
  return `${HASH_SCHEME}${await bcrypt.hash(prehash(plain), SALT_ROUNDS)}`;
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  if (plain.length > MAX_PASSWORD_LENGTH) return false;
  if (hash.startsWith(HASH_SCHEME)) {
    return bcrypt.compare(prehash(plain), hash.slice(HASH_SCHEME.length));
  }
  return bcrypt.compare(plain, hash);
}

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= 15 && password.length <= MAX_PASSWORD_LENGTH;
}
