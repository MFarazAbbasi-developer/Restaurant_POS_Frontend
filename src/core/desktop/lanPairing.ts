/**
 * Desktop LAN pairing bridge — renderer side.
 * All pin verification and private-key use happen in Electron main via IPC.
 */

export type LanClientPublicIdentity = {
  publicKeySpkiB64: string;
  fingerprintSha256Hex: string;
  fingerprintPrefix: string;
  storage: string;
  paired: boolean;
  terminalId?: string | null;
  pending?: {
    status: string;
    invitationId: string;
    clientFingerprintPrefix: string | null;
    hostFingerprintPrefix: string | null;
    label: string | null;
    expiresAt: string | null;
    submittedAt: string | null;
  } | null;
};

export type LanPairStatusResult = {
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
};

export function isDesktopLanPairingAvailable(): boolean {
  return Boolean(
    window.electronAPI?.isDesktop &&
      typeof window.electronAPI.lanPairSubmit === 'function'
  );
}

export async function getLanClientIdentity(): Promise<LanClientPublicIdentity | null> {
  const api = window.electronAPI;
  if (!api?.lanGetClientIdentity) return null;
  return api.lanGetClientIdentity();
}

export async function getLanRemoteGate(): Promise<{
  remoteLanPairingEnabled: boolean;
  httpsLoopbackOnly: boolean;
  featureReadyLatch?: boolean;
  operatorAllowEnv?: boolean;
  blockingReasons?: string[];
  note: string;
} | null> {
  const api = window.electronAPI;
  if (!api?.lanGetRemoteGate) return null;
  return api.lanGetRemoteGate();
}

/**
 * Submit pairing. Caller must have obtained invitation JSON from OOB (host screen).
 * Sets hasIndependentOutOfBandTlsPin=true because the paste/scan is the OOB channel.
 */
export async function submitLanPairing(input: {
  invitationMaterial: unknown;
  label?: string;
}): Promise<{
  status: string;
  invitationId: string;
  clientFingerprintPrefix: string;
  hostFingerprintPrefix: string;
  label: string | null;
  expiresAt: string | null;
  message: string;
}> {
  const api = window.electronAPI;
  if (!api?.lanPairSubmit) {
    throw new Error(
      'Desktop pairing bridge unavailable. Open this screen in the FARMAX POS desktop app.'
    );
  }
  return api.lanPairSubmit({
    invitationMaterial: input.invitationMaterial,
    label: input.label,
    hasIndependentOutOfBandTlsPin: true,
  });
}

/**
 * Poll / recover pairing status after approval or app restart.
 * Main process signs a possession proof; never re-registers a seat.
 */
export async function pollLanPairingStatus(): Promise<LanPairStatusResult> {
  const api = window.electronAPI;
  if (!api?.lanPairStatus) {
    throw new Error('Desktop pairing status bridge unavailable');
  }
  return api.lanPairStatus();
}

export async function getLanPendingSnapshot(): Promise<{
  status: string;
  invitationId: string;
  clientFingerprintPrefix: string | null;
  hostFingerprintPrefix: string | null;
  label: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
} | null> {
  const api = window.electronAPI;
  if (!api?.lanGetPendingSnapshot) return null;
  return api.lanGetPendingSnapshot();
}

export async function recordLanApprovedSession(session: {
  terminalId: string;
  installationBindingId?: string;
  hostFingerprintPrefix?: string;
}): Promise<unknown> {
  const api = window.electronAPI;
  if (!api?.lanRecordApprovedSession) {
    throw new Error('Desktop pairing bridge unavailable');
  }
  return api.lanRecordApprovedSession(session);
}
