import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export type LanHostStatus = {
  restaurantId: string | null;
  setupComplete: boolean;
  lanRuntimeEnabled: boolean;
  hostActivated: boolean;
  pairingProtocolReady: boolean;
  remoteLanPairingEnabled: boolean;
  remoteExposureGate?: {
    remoteLanPairingEnabled: boolean;
    httpsLoopbackOnly: boolean;
    featureReadyLatch: boolean;
    operatorAllowEnv: boolean;
    tlsProvisioned: boolean;
    hostActivated: boolean;
    pairingProtocolReady: boolean;
    blockingReasons: string[];
  };
  httpsLoopbackOnly: true;
  httpsBaseHint: string | null;
  httpBaseHint: string;
  host: {
    fingerprintSha256Hex: string | null;
    fingerprintPrefix: string | null;
    publicKeySpkiB64: string | null;
    installationId: string | null;
    licenseId: string | null;
  };
  tls: {
    provisioned: boolean;
    fingerprintSha256Hex: string | null;
    fingerprintPrefix: string | null;
    notBefore: string | null;
    notAfter: string | null;
    previousFingerprintPrefix: string | null;
  };
  seats: {
    terminalLimit: number | null;
    hostCountsAsSeat: true;
    localActiveAdditionalTerminals: number;
    localDeniedTerminals: number;
    cloudSeatsUsed: number | null;
    cloudSeatsAvailable: number | null;
  };
  pendingApprovals: Array<{
    invitationId: string;
    expiresAt: string;
    clientFingerprintPrefix: string | null;
    label: string | null;
    status: 'AWAITING_APPROVAL';
  }>;
  openInvitation: {
    invitationId: string;
    expiresAt: string;
    status: 'OPEN' | 'AWAITING_APPROVAL';
    hasPendingClient: boolean;
    clientFingerprintPrefix: string | null;
    label: string | null;
  } | null;
  disabledReason: string | null;
  honestyNote: string;
};

export type LanTerminalRosterRow = {
  terminalId: string;
  label: string | null;
  fingerprintPrefix: string;
  localStatus: 'ACTIVE' | 'DENIED';
  cloudSyncStatus: string;
  deniedAt: string | null;
  deniedReason: string | null;
  cloudSyncError: string | null;
  lastCloudSyncAt: string | null;
  createdAt: string;
};

/** Host-screen OOB payload — includes invitationToken once; never log it. */
export type LanPairingInvitationMaterial = {
  protocolVersion: number;
  invitationId: string;
  invitationToken: string;
  expiresAt: string;
  httpsBaseHint: string;
  hostFingerprintSha256Hex: string;
  hostPublicKeySpkiB64: string;
  tlsCertificateFingerprintSha256Hex: string;
  restaurantId: string;
  installationBindingId: string;
  licenseId: string;
  note: string;
};

export class LanApi {
  public static async getStatus(): Promise<LanHostStatus> {
    const response = await apiClient.get<ApiResponse<LanHostStatus>>('/lan/status');
    return response.data;
  }

  public static async listTerminals(): Promise<LanTerminalRosterRow[]> {
    const response = await apiClient.get<ApiResponse<LanTerminalRosterRow[]>>(
      '/lan/terminals'
    );
    return response.data;
  }

  public static async createInvitation(input: {
    managerPin: string;
    httpsBaseHint?: string;
  }): Promise<LanPairingInvitationMaterial> {
    const response = await apiClient.post<
      ApiResponse<LanPairingInvitationMaterial>,
      { managerPin: string; httpsBaseHint?: string }
    >('/lan/pairing/invitations', input);
    return response.data;
  }

  public static async cancelInvitation(input: {
    managerPin: string;
    invitationId?: string;
  }): Promise<{ cancelledCount: number }> {
    const response = await apiClient.post<
      ApiResponse<{ cancelledCount: number }>,
      { managerPin: string; invitationId?: string }
    >('/lan/pairing/invitations/cancel', input);
    return response.data;
  }

  public static async approvePairing(input: {
    invitationId: string;
    managerPin: string;
  }): Promise<{
    status: 'REDEEMED';
    terminalId: string;
    clientFingerprintPrefix: string;
    label: string | null;
    cloudSynced: true;
    idempotent: boolean;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        status: 'REDEEMED';
        terminalId: string;
        clientFingerprintPrefix: string;
        label: string | null;
        cloudSynced: true;
        idempotent: boolean;
      }>,
      { invitationId: string; managerPin: string }
    >('/lan/pairing/approve', input);
    return response.data;
  }

  public static async denyTerminal(input: {
    terminalId: string;
    managerPin: string;
    reason?: string;
    installationId?: string;
  }): Promise<{
    terminalId: string;
    localStatus: string;
    cloudSyncStatus: string;
    cloudSynced: boolean;
    cloudSyncError: string | null;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        terminalId: string;
        localStatus: string;
        cloudSyncStatus: string;
        cloudSynced: boolean;
        cloudSyncError: string | null;
      }>,
      typeof input
    >('/lan/terminals/deny', input);
    return response.data;
  }

  public static async retryCloudSync(input: {
    terminalId: string;
    managerPin: string;
    installationId: string;
  }): Promise<{
    terminalId: string;
    localStatus: string;
    cloudSyncStatus: string;
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        terminalId: string;
        localStatus: string;
        cloudSyncStatus: string;
      }>,
      typeof input
    >('/lan/terminals/retry-cloud-sync', input);
    return response.data;
  }
}
