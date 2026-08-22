import { env } from './env';

export interface DeveloperAttribution {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
}

export interface ReceiptAttributionConfig {
  readonly enabled: boolean;
  readonly text: string;
  readonly showPhone: boolean;
  readonly lines: readonly string[];
}

export interface ProductIdentityConfig {
  readonly name: string;
  readonly version: string;
  readonly environment: string;
  readonly developer: DeveloperAttribution;
  readonly receipt: ReceiptAttributionConfig;
  readonly defaultTerminalId: string;
  readonly getSystemLabel: () => string;
}

/**
 * Split attribution text gracefully into clean stacked lines
 * Supports separators: ' · ', ' • ', ' | ', or newlines '\n'
 */
function parseAttributionLines(text: string): string[] {
  if (!text) return [];
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (text.includes(' · ')) {
    return text
      .split(' · ')
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (text.includes(' • ')) {
    return text
      .split(' • ')
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (text.includes(' | ')) {
    return text
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [text.trim()];
}

/**
 * Build complete stacked receipt attribution lines including contact phone
 */
function buildReceiptLines(
  text: string,
  phone: string,
  showPhone: boolean
): readonly string[] {
  const lines = parseAttributionLines(text);
  if (showPhone && phone && phone.trim() && !lines.some(l => l.includes(phone))) {
    lines.push(`Contact: ${phone.trim()}`);
  }
  return lines;
}

/**
 * Centralized Product Identity & Attribution Configuration
 * Single source of truth for branding, developer identity, and receipt attributions.
 */
export const PRODUCT_IDENTITY: ProductIdentityConfig = {
  name: env.appName,
  version: env.appVersion,
  environment: env.appEnv,
  developer: {
    name: env.developerName,
    phone: env.developerPhone,
    email: env.developerEmail,
    website: env.developerWebsite,
  },
  receipt: {
    enabled: env.receiptAttributionEnabled,
    text: env.receiptAttributionText,
    showPhone: env.receiptAttributionShowPhone,
    lines: buildReceiptLines(
      env.receiptAttributionText,
      env.developerPhone,
      env.receiptAttributionShowPhone
    ),
  },
  defaultTerminalId: env.defaultTerminalId,
  getSystemLabel: () => `${env.appName} v${env.appVersion} • ${env.appEnv}`,
};
