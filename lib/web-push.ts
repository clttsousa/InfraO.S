import { createCipheriv, createECDH, createHmac, createPrivateKey, createSign, randomBytes } from "node:crypto";

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  notificationId?: string;
  eventId?: string | null;
  tag?: string;
};

type WebPushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function getAudience(endpoint: string) {
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
}

function derToJose(signature: Buffer) {
  // ECDSA DER -> JOSE r || s para ES256.
  let offset = 0;
  if (signature[offset++] !== 0x30) throw new Error("Assinatura VAPID inválida.");
  let sequenceLength = signature[offset++];
  if (sequenceLength === 0x81) {
    sequenceLength = signature[offset++];
  }
  if (sequenceLength + offset !== signature.length) throw new Error("Assinatura VAPID inválida.");
  if (signature[offset++] !== 0x02) throw new Error("Assinatura VAPID inválida.");
  const rLength = signature[offset++];
  let r = signature.subarray(offset, offset + rLength);
  offset += rLength;
  if (signature[offset++] !== 0x02) throw new Error("Assinatura VAPID inválida.");
  const sLength = signature[offset++];
  let s = signature.subarray(offset, offset + sLength);

  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);
  if (r.length < 32) r = Buffer.concat([Buffer.alloc(32 - r.length), r]);
  if (s.length < 32) s = Buffer.concat([Buffer.alloc(32 - s.length), s]);
  return Buffer.concat([r, s]);
}

function createVapidJwt(endpoint: string, config: WebPushConfig) {
  const publicKey = base64UrlDecode(config.publicKey);
  const privateKey = config.privateKey;

  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY deve ser uma chave pública P-256 não comprimida em base64url.");
  }

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(publicKey.subarray(1, 33)),
    y: base64UrlEncode(publicKey.subarray(33, 65)),
    d: privateKey
  };

  const header = base64UrlEncode(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      aud: getAudience(endpoint),
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: config.subject
    })
  );
  const signingInput = `${header}.${payload}`;
  const signer = createSign("sha256");
  signer.update(signingInput);
  signer.end();
  const signature = derToJose(signer.sign(createPrivateKey({ key: jwk, format: "jwk" })));
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function hmacSha256(key: Buffer, input: Buffer | string): Buffer {
  return Buffer.from(createHmac("sha256", key).update(input).digest());
}

function hkdfExpand(prk: Buffer, info: Buffer | string, length: number) {
  const infoBuffer = typeof info === "string" ? Buffer.from(info, "utf8") : info;
  const blocks: Buffer[] = [];
  let previous: Buffer = Buffer.from([]);
  let counter = 1;

  while (Buffer.concat(blocks).length < length) {
    previous = hmacSha256(prk, Buffer.concat([previous, Buffer.from(infoBuffer), Buffer.from([counter])]));
    blocks.push(previous);
    counter += 1;
  }

  return Buffer.concat(blocks).subarray(0, length);
}

function encryptPayload(subscription: PushSubscriptionRecord, payload: WebPushPayload) {
  const userPublicKey = base64UrlDecode(subscription.p256dh);
  const authSecret = base64UrlDecode(subscription.auth);

  if (userPublicKey.length !== 65 || userPublicKey[0] !== 0x04) {
    throw new Error("Push subscription inválida: p256dh não é uma chave P-256 válida.");
  }
  if (authSecret.length < 16) {
    throw new Error("Push subscription inválida: auth secret curto demais.");
  }

  const salt = randomBytes(16);
  const serverKeys = createECDH("prime256v1");
  serverKeys.generateKeys();
  const serverPublicKey = serverKeys.getPublicKey(undefined, "uncompressed");
  const sharedSecret = serverKeys.computeSecret(userPublicKey);

  // RFC 8291 / aes128gcm: a implementação anterior usava o fluxo legado do aesgcm,
  // que podia retornar HTTP 201/202 no push service, mas o navegador não conseguia
  // descriptografar o payload e a notificação não aparecia no Windows/celular.
  const prkKey = hmacSha256(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0", "utf8"), userPublicKey, serverPublicKey]);
  const ikm = hkdfExpand(prkKey, keyInfo, 32);
  const prk = hmacSha256(salt, ikm);
  const contentEncryptionKey = hkdfExpand(prk, "Content-Encoding: aes128gcm\0", 16);
  const nonce = hkdfExpand(prk, "Content-Encoding: nonce\0", 12);
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload), "utf8"), Buffer.from([0x02])]);

  const aes = createCipheriv("aes-128-gcm", contentEncryptionKey, nonce);
  const encrypted = Buffer.concat([aes.update(plaintext), aes.final(), aes.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096, 0);
  const keyIdLength = Buffer.from([serverPublicKey.length]);

  return Buffer.concat([salt, recordSize, keyIdLength, serverPublicKey, encrypted]);
}

export function getWebPushConfig(): WebPushConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:infraos@example.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export async function sendWebPush(subscription: PushSubscriptionRecord, payload: WebPushPayload) {
  const config = getWebPushConfig();
  if (!config) {
    return { ok: false as const, skipped: true as const, status: 0, message: "VAPID não configurado." };
  }

  const jwt = createVapidJwt(subscription.endpoint, config);
  const encryptedBody = encryptPayload(subscription, payload);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      TTL: "86400",
      Urgency: "normal",
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Authorization: `vapid t=${jwt}, k=${config.publicKey}`
    },
    body: encryptedBody
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Falha ao enviar push.");
    return { ok: false as const, skipped: false as const, status: response.status, message: message || response.statusText };
  }

  return { ok: true as const, skipped: false as const, status: response.status, message: `Push aceito pelo serviço (${response.status}).` };
}
