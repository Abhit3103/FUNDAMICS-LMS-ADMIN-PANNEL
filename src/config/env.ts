/**
 * Environment configuration
 * Validates required environment variables at startup.
 * SECURITY: Never add provider API keys or backend secrets here.
 */

function getRequiredEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `[FUNDAMICS] Missing required environment variable: ${key}\n` +
        `Please copy .env.example to .env and provide the value.`
    );
  }
  return value.trim();
}

export const env = {
  API_BASE_URL: getRequiredEnvVar('VITE_API_BASE_URL'),
} as const;

export type Env = typeof env;
