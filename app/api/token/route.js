// app/api/token/route.js
import crypto from "crypto";

function generateToken04(appId, userId, secret, effectiveSeconds, payload = "") {
  const createTime = Math.floor(Date.now() / 1000);
  const nonce = Math.floor(Math.random() * 2147483647);

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: createTime,
    expire: createTime + effectiveSeconds,
    payload,
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(secret.padEnd(32).slice(0, 32));

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);

  const tokenData = Buffer.concat([
    Buffer.alloc(8), // version placeholder
    iv,
    encrypted,
  ]);

  const base64Token = tokenData.toString("base64");
  return `04${base64Token}`;
}

export async function POST(req) {
  const { userId, roomID } = await req.json();

  const appId = Number(process.env.NEXT_PUBLIC_APP_ID);
  const secret = process.env.ZEGOCLOUD_SERVER_SECRET; // keep this server-side only!

  const token = generateToken04(appId, userId, secret, 3600, "");

  return Response.json({ token, appId });
}