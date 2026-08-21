import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:5000/api/v1'),
  VITE_WS_URL: z.string().url().default('http://localhost:5000'),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  VITE_APP_NAME: z.string().default('Faraz POS'),
  VITE_DEFAULT_TERMINAL_ID: z.string().default('POS-01'),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = {
  apiBaseUrl: parsedEnv.data.VITE_API_BASE_URL,
  wsUrl: parsedEnv.data.VITE_WS_URL,
  appEnv: parsedEnv.data.VITE_APP_ENV,
  appName: parsedEnv.data.VITE_APP_NAME,
  defaultTerminalId: parsedEnv.data.VITE_DEFAULT_TERMINAL_ID,
  isDev: parsedEnv.data.VITE_APP_ENV === 'development',
  isProd: parsedEnv.data.VITE_APP_ENV === 'production',
} as const;

export type Env = typeof env;
