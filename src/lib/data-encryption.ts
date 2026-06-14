import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import prisma from "@/lib/prisma";

const DATA_PREFIX = "enc:v1";
const KEY_PREFIX = "key:v1";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const userKeyCache = new Map<string, Promise<Buffer>>();

function getMasterKey() {
  const encodedKey = process.env.DATA_ENCRYPTION_MASTER_KEY;

  if (!encodedKey) {
    throw new Error("DATA_ENCRYPTION_MASTER_KEY is not configured.");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "DATA_ENCRYPTION_MASTER_KEY must be a base64-encoded 32-byte key.",
    );
  }

  return key;
}

function encryptWithKey(
  plaintext: string,
  key: Buffer,
  prefix: string,
  aad: string,
) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, {
    authTagLength: TAG_BYTES,
  });

  cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    prefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

function decryptWithKey(
  payload: string,
  key: Buffer,
  expectedPrefix: string,
  aad: string,
) {
  const [kind, version, encodedIv, encodedTag, encodedCiphertext] =
    payload.split(":");

  if (
    `${kind}:${version}` !== expectedPrefix ||
    !encodedIv ||
    !encodedTag ||
    encodedCiphertext === undefined
  ) {
    throw new Error("Encrypted payload has an invalid format.");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const tag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Encrypted payload has invalid parameters.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: TAG_BYTES,
  });

  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

function wrapUserKey(userId: string, userKey: Buffer) {
  return encryptWithKey(
    userKey.toString("base64url"),
    getMasterKey(),
    KEY_PREFIX,
    `user-key:${userId}`,
  );
}

function unwrapUserKey(userId: string, wrappedKey: string) {
  const encodedKey = decryptWithKey(
    wrappedKey,
    getMasterKey(),
    KEY_PREFIX,
    `user-key:${userId}`,
  );
  const key = Buffer.from(encodedKey, "base64url");

  if (key.length !== KEY_BYTES) {
    throw new Error("User encryption key has an invalid length.");
  }

  return key;
}

export function isEncryptedValue(value: string | null | undefined) {
  return value?.startsWith(`${DATA_PREFIX}:`) ?? false;
}

export async function ensureUserEncryptionKey(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptionKey: true },
  });

  if (!user) {
    throw new Error("User was not found.");
  }

  if (user.encryptionKey) {
    return user.encryptionKey;
  }

  const wrappedKey = wrapUserKey(userId, randomBytes(KEY_BYTES));

  await prisma.user.updateMany({
    where: {
      id: userId,
      encryptionKey: null,
    },
    data: {
      encryptionKey: wrappedKey,
    },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptionKey: true },
  });

  if (!updatedUser?.encryptionKey) {
    throw new Error("Failed to initialize the user encryption key.");
  }

  return updatedUser.encryptionKey;
}

async function getUserKey(userId: string) {
  const cachedKey = userKeyCache.get(userId);

  if (cachedKey) {
    return cachedKey;
  }

  const keyPromise = ensureUserEncryptionKey(userId).then((wrappedKey) =>
    unwrapUserKey(userId, wrappedKey),
  );

  userKeyCache.set(userId, keyPromise);

  try {
    return await keyPromise;
  } catch (error) {
    userKeyCache.delete(userId);
    throw error;
  }
}

export async function encryptUserData(
  userId: string,
  context: string,
  plaintext: string,
) {
  return encryptWithKey(
    plaintext,
    await getUserKey(userId),
    DATA_PREFIX,
    `user-data:${userId}:${context}`,
  );
}

export async function decryptUserData(
  userId: string,
  context: string,
  value: string | null | undefined,
) {
  if (value == null || !isEncryptedValue(value)) {
    return value ?? "";
  }

  return decryptWithKey(
    value,
    await getUserKey(userId),
    DATA_PREFIX,
    `user-data:${userId}:${context}`,
  );
}
