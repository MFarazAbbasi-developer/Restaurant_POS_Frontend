import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:5000/api/v1'),
  VITE_WS_URL: z.string().url().default('http://localhost:5000'),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  VITE_APP_NAME: z.string().default('Faraz POS'),
  VITE_APP_VERSION: z.string().default('0.1.0'),
  VITE_DEFAULT_TERMINAL_ID: z.string().default('POS-01'),

  // Product & Developer Identity Attribution
  VITE_DEVELOPER_NAME: z.string().default('Your Name'),
  VITE_DEVELOPER_PHONE: z.string().default('+1 555 0199'),
  VITE_DEVELOPER_EMAIL: z.string().default('developer@example.com'),
  VITE_DEVELOPER_WEBSITE: z.string().default('https://example.com'),

  // Receipt Attribution
  VITE_RECEIPT_ATTRIBUTION_ENABLED: z
    .string()
    .optional()
    .transform(val => (val === undefined ? true : val === 'true' || val === '1')),
  VITE_RECEIPT_ATTRIBUTION_SHOW_PHONE: z
    .string()
    .optional()
    .transform(val => (val === undefined ? true : val === 'true' || val === '1')),
  VITE_RECEIPT_ATTRIBUTION_TEXT: z
    .string()
    .default('Powered by Faraz POS · Developed by Developer Name'),
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
  appVersion: parsedEnv.data.VITE_APP_VERSION,
  defaultTerminalId: parsedEnv.data.VITE_DEFAULT_TERMINAL_ID,
  developerName: parsedEnv.data.VITE_DEVELOPER_NAME,
  developerPhone: parsedEnv.data.VITE_DEVELOPER_PHONE,
  developerEmail: parsedEnv.data.VITE_DEVELOPER_EMAIL,
  developerWebsite: parsedEnv.data.VITE_DEVELOPER_WEBSITE,
  receiptAttributionEnabled: parsedEnv.data.VITE_RECEIPT_ATTRIBUTION_ENABLED,
  receiptAttributionShowPhone: parsedEnv.data.VITE_RECEIPT_ATTRIBUTION_SHOW_PHONE,
  receiptAttributionText: parsedEnv.data.VITE_RECEIPT_ATTRIBUTION_TEXT,
  isDev: parsedEnv.data.VITE_APP_ENV === 'development',
  isProd: parsedEnv.data.VITE_APP_ENV === 'production',
} as const;

export type Env = typeof env;
