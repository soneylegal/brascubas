import { describe, expect, it } from "vitest";
import {
  decryptVaultContent,
  deriveVaultKey,
  encryptVaultContent,
  generateVaultSalt
} from "../src/services/cryptoService.js";

describe("cryptoService", () => {
  it("criptografa e descriptografa conteúdo do cofre", async () => {
    const salt = await generateVaultSalt();
    const key = await deriveVaultKey("SenhaForte123", salt);
    const encrypted = await encryptVaultContent("Carta secreta", key);

    const decrypted = await decryptVaultContent(encrypted.cipher, encrypted.nonce, key);

    expect(decrypted).toBe("Carta secreta");
  });

  it("falha ao descriptografar com chave incorreta", async () => {
    const salt = await generateVaultSalt();
    const keyA = await deriveVaultKey("SenhaA123", salt);
    const keyB = await deriveVaultKey("SenhaB123", salt);
    const encrypted = await encryptVaultContent("Mensagem", keyA);

    await expect(decryptVaultContent(encrypted.cipher, encrypted.nonce, keyB)).rejects.toThrow();
  });
});
