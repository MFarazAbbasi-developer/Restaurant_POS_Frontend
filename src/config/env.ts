import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .min(1)
    .refine(
      (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      { message: 'VITE_API_BASE_URL must be a valid URL or relative path starting with /' },
    )
    .optional(),
  VITE_WS_URL: z.string().optional(),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  VITE_APP_NAME: z.string().default('FARMAX POS'),
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
    .transform((val) => (val === undefined ? true : val === 'true' || val === '1')),
  VITE_RECEIPT_ATTRIBUTION_SHOW_PHONE: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? true : val === 'true' || val === '1')),
  VITE_RECEIPT_ATTRIBUTION_TEXT: z
    .string()
    .default('Powered by FARMAX POS · Developed by Developer Name'),

  /**
   * Opt-in Quick Staff presets for local demo-seed testing only.
   * Defaults off so fresh customer installs never see seeded demo credentials.
   */
  VITE_ENABLE_DEMO_LOGIN_PRESETS: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

const isProd =
  parsedEnv.data.VITE_APP_ENV === 'production' ||
  (import.meta.env.PROD && parsedEnv.data.VITE_APP_ENV !== 'development');
const isDev = !isProd;

// Resolve API base URL: Use configured VITE_API_BASE_URL, or fall back to /api/v1 in prod and http://localhost:5000/api/v1 in dev
const resolveApiBaseUrl = (): string => {
  if (parsedEnv.data.VITE_API_BASE_URL) {
    return parsedEnv.data.VITE_API_BASE_URL;
  }
  return isProd ? '/api/v1' : 'http://localhost:5000/api/v1';
};

// Resolve WebSocket URL: If explicitly set to non-empty, use it. In prod, fall back to window.location.origin (same-origin). In dev, fall back to http://localhost:5000
const resolveWsUrl = (): string => {
  if (parsedEnv.data.VITE_WS_URL && parsedEnv.data.VITE_WS_URL.trim() !== '') {
    return parsedEnv.data.VITE_WS_URL.trim();
  }
  if (isProd) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return 'http://localhost:5000';
};

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  wsUrl: resolveWsUrl(),
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
  enableDemoLoginPresets: parsedEnv.data.VITE_ENABLE_DEMO_LOGIN_PRESETS,
  isDev,
  isProd,
} as const;

export type Env = typeof env;
