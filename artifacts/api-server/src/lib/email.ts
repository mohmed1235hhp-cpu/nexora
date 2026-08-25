import { logger } from "./logger";

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  // Provider credentials intentionally remain outside the repository.
  // When an email provider is configured, wire it here; without credentials
  // we keep the auth flow functional and log a safe development notice.
  const endpoint = process.env.EMAIL_PROVIDER_URL;
  const key = process.env.EMAIL_PROVIDER_KEY;
  if (!endpoint || !key) {
    logger.warn({ to, subject }, "[email] provider not configured; token delivery skipped");
    return { delivered: false };
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { delivered: true };
}
