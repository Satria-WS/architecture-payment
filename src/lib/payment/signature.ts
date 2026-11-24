import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { PaymentGatewayError } from "@/lib/payment/types";

function getSecret() {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    throw new PaymentGatewayError(
      "PAYMENT_WEBHOOK_SECRET is not configured.",
      "NOT_CONFIGURED"
    );
  }
  return secret;
}

export function createDummyToken(externalId: string) {
  return createHmac("sha256", getSecret()).update(externalId).digest("hex");
}

export function verifyDummyToken(externalId: string, token: string) {
  const expected = createDummyToken(externalId);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
