export interface DesktopPrinterInfo {
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  status?: number;
}

export interface DesktopPrintTextPayload {
  text: string;
  deviceName?: string;
  copies?: number;
  jobTitle?: string;
  silent?: boolean;
}

export interface DesktopPrintTextResult {
  success: true;
  deviceName: string;
  mode: 'silent' | 'dialog' | string;
}

export interface LanClientPublicIdentity {
  publicKeySpkiB64: string;
  fingerprintSha256Hex: string;
  fingerprintPrefix: string;
  storage: string;
  paired: boolean;
  terminalId?: string | null;
}

export interface LanPairSubmitPayload {
  invitationMaterial: unknown;
  label?: string;
  /** Must be true — pin obtained via paste/scan OOB, not from the live connection. */
  hasIndependentOutOfBandTlsPin: true;
}

export interface LanPairSubmitResult {
  status: string;
  invitationId: string;
  clientFingerprintPrefix: string;
  hostFingerprintPrefix: string;
  label: string | null;
  expiresAt: string | null;
  message: string;
}

export interface LanPairStatusResult {
  status: string;
  invitationId: string | null;
  terminalId?: string | null;
  clientFingerprintPrefix?: string | null;
  label?: string | null;
  expiresAt?: string | null;
  reason?: string | null;
  alreadyPaired?: boolean;
  message: string;
  installationBindingId?: string | null;
  restaurantId?: string | null;
}

export interface LanPendingSnapshot {
  status: string;
  invitationId: string;
  clientFingerprintPrefix: string | null;
  hostFingerprintPrefix: string | null;
  label: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
}

export interface ElectronAPI {
  isDesktop: true;
  platform: string;
  version: string;
  sendMessage: (channel: string, data?: unknown) => void;
  onMessage: (
    channel: string,
    callback: (...args: unknown[]) => void
  ) => (() => void) | undefined;
  listPrinters: () => Promise<DesktopPrinterInfo[]>;
  printText: (payload: DesktopPrintTextPayload) => Promise<DesktopPrintTextResult>;
  lanGetClientIdentity?: () => Promise<
    LanClientPublicIdentity & { pending?: LanPendingSnapshot | null }
  >;
  lanGetRemoteGate?: () => Promise<{
    remoteLanPairingEnabled: boolean;
    httpsLoopbackOnly: boolean;
    featureReadyLatch?: boolean;
    operatorAllowEnv?: boolean;
    blockingReasons?: string[];
    note: string;
  }>;
  lanPairSubmit?: (payload: LanPairSubmitPayload) => Promise<LanPairSubmitResult>;
  lanPairStatus?: () => Promise<LanPairStatusResult>;
  lanGetPendingSnapshot?: () => Promise<LanPendingSnapshot | null>;
  lanRecordApprovedSession?: (session: {
    terminalId: string;
    installationBindingId?: string;
    hostFingerprintPrefix?: string;
  }) => Promise<unknown>;
  lanClearSession?: () => Promise<{ cleared: true }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
