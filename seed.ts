import { storage } from "./server/storage";
import { hashPassword, generateSalt, deriveKey, encryptData, computeHash, computeHmac, generateAccessCode } from "./server/crypto";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

async function seed() {
  const existingUser = await storage.getUserByUsername("demo_user");
  if (!existingUser) {
    const user = await storage.createUser({
      username: "demo_user",
      email: "demo@example.com",
      password: hashPassword("demo123")
    });
    
    // Seed an item
    const dataBuffer = Buffer.from("This is a highly classified secret message for demo purposes.", "utf-8");
    const salt = generateSalt();
    const key = deriveKey("demo123", salt);
    const hash = computeHash(dataBuffer);
    const hmac = computeHmac(dataBuffer, key);
    const { encrypted, iv, authTag } = encryptData(dataBuffer, key);
    
    await fs.mkdir(path.join(process.cwd(), "uploads"), { recursive: true });
    const fileName = randomUUID() + ".enc";
    const filePath = path.join(process.cwd(), "uploads", fileName);
    const fileData = Buffer.concat([authTag, encrypted]);
    await fs.writeFile(filePath, fileData);

    await storage.createEncryptedItem({
      userId: user.id,
      originalName: "classified_memo.txt",
      fileType: "text/plain",
      encryptedDataPath: filePath,
      iv,
      salt,
      hash,
      hmac,
      accessCode: "1234",
      linkId: "demo-link",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    console.log("Database seeded successfully");
  } else {
    console.log("Database already seeded");
  }
}
seed().catch(console.error);
