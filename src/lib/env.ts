/** Throws at call-site (server-side only) with a descriptive message if a required env var is absent. */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Add it to .env.local for local development or to your Vercel project settings under\n` +
        `Settings → Environment Variables.`
    );
  }
  return value;
}
