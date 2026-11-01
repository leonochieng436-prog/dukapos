import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import {
  hashPassword,
  verifyPassword,
  isPasswordStrongEnough,
} from "@/server/auth/password";

describe("password policy", () => {
  it("requires a 15-character passphrase and supports long values", () => {
    expect(isPasswordStrongEnough("short1")).toBe(false);
    expect(isPasswordStrongEnough("longenough12345")).toBe(true);
    expect(isPasswordStrongEnough("x".repeat(1025))).toBe(false);
  });

  it("hashes and verifies correctly", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("verifies legacy bcrypt hashes while supporting passphrases longer than bcrypt's input limit", async () => {
    const legacyHash = await bcrypt.hash("legacy-password", 4);
    expect(await verifyPassword("legacy-password", legacyHash)).toBe(true);

    const passphrase = "long-phrase-".repeat(16);
    const hash = await hashPassword(passphrase);
    expect(await verifyPassword(passphrase, hash)).toBe(true);
  });

  it("produces a different hash each time (unique salt)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});
