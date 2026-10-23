import React, { useEffect, useMemo, useState } from 'react';
import {
  Network,
  Shield,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ban,
  UserCheck,
  Link2,
  MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { usePermissions } from '@/core/auth/usePermissions';
import {
  useLanHostStatusQuery,
  useLanMutations,
  useLanTerminalsQuery,
} from '@/features/lan/hooks/useLanHostData';
import type { LanPairingInvitationMaterial } from '@/core/api/lanApi';
import {
  getLanClientIdentity,
  getLanRemoteGate,
  isDesktopLanPairingAvailable,
  pollLanPairingStatus,
  submitLanPairing,
  type LanClientPublicIdentity,
} from '@/core/desktop/lanPairing';

type HostTab = 'overview' | 'pair' | 'roster' | 'join';

function shortFp(fp: string | null | undefined): string {
  if (!fp) return '—';
  return fp.length > 12 ? `${fp.slice(0, 12)}…` : fp;
}

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const LanTerminalsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canPair = hasPermission('terminals.pair');
  const canRevoke = hasPermission('terminals.revoke');

  const [tab, setTab] = useState<HostTab>('overview');
  const [managerPin, setManagerPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeInvitation, setActiveInvitation] =
    useState<LanPairingInvitationMaterial | null>(null);
  const [copied, setCopied] = useState(false);

  const [joinPaste, setJoinPaste] = useState('');
  const [joinLabel, setJoinLabel] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinResult, setJoinResult] = useState<string | null>(null);
  const [joinPolling, setJoinPolling] = useState(false);
  const [clientIdentity, setClientIdentity] = useState<LanClientPublicIdentity | null>(
    null
  );
  const [remoteGateNote, setRemoteGateNote] = useState<string | null>(null);

  const statusQuery = useLanHostStatusQuery(canPair);
  const terminalsQuery = useLanTerminalsQuery(canPair || canRevoke);
  const mutations = useLanMutations();

  const desktopPairing = isDesktopLanPairingAvailable();

  useEffect(() => {
    if (!desktopPairing) return;
    void getLanClientIdentity()
      .then((id) => {
        setClientIdentity(id);
        if (id?.pending?.invitationId && !id.paired) {
          setJoinPolling(true);
          setJoinResult('Recovered pending pairing — checking approval status…');
        }
      })
      .catch(() => setClientIdentity(null));
    void getLanRemoteGate()
      .then((g) => setRemoteGateNote(g?.note ?? null))
      .catch(() => setRemoteGateNote(null));
  }, [desktopPairing]);

  /** Restart recovery + post-submit poll for terminalId (no second seat). */
  useEffect(() => {
    if (!desktopPairing || !joinPolling) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 90; // ~3 min at 2s

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = await pollLanPairingStatus();
        if (cancelled) return;
        setJoinResult(result.message);
        if (result.status === 'REDEEMED' && result.terminalId) {
          setJoinPolling(false);
          setSuccessMessage(
            `Paired. Terminal ${result.terminalId.slice(0, 8)}… stored for reconnect.`
          );
          const id = await getLanClientIdentity();
          setClientIdentity(id);
          return;
        }
        if (
          result.status === 'CANCELLED' ||
          result.status === 'EXPIRED' ||
          result.status === 'REJECTED'
        ) {
          setJoinPolling(false);
          setErrorMessage(result.message);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        // Network outage: keep polling until attempts exhausted.
        if (attempts >= maxAttempts) {
          setJoinPolling(false);
          setErrorMessage(
            err instanceof Error ? err.message : 'Status poll failed after retries'
          );
          return;
        }
      }
      if (attempts >= maxAttempts) {
        setJoinPolling(false);
        setJoinResult(
          'Still waiting for approval. Use “Check approval status” after the host approves.'
        );
        return;
      }
      window.setTimeout(() => void tick(), 2000);
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [desktopPairing, joinPolling]);

  const status = statusQuery.data;

  const readinessLabel = useMemo(() => {
    if (!status) return 'Unknown';
    if (!status.hostActivated) return 'Host not activated';
    if (!status.tls.provisioned) return 'TLS certificate missing';
    if (!status.pairingProtocolReady) return 'Pairing protocol not ready';
    if (status.remoteLanPairingEnabled) return 'Remote LAN enabled';
    return 'Protocol ready (loopback HTTPS only)';
  }, [status]);

  const clearFlash = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const requirePin = (): string | null => {
    const pin = managerPin.trim();
    if (pin.length < 4) {
      setErrorMessage('Enter a valid manager PIN (min 4 digits) to authorize this action.');
      return null;
    }
    return pin;
  };

  const handleCreateInvitation = async () => {
    clearFlash();
    const pin = requirePin();
    if (!pin) return;
    try {
      const material = await mutations.createInvitation.mutateAsync({
        managerPin: pin,
        httpsBaseHint: status?.httpsBaseHint || undefined,
      });
      setActiveInvitation(material);
      setSuccessMessage(
        'Invitation created. Show the payload and TLS pin on this screen only — do not log or email the token.'
      );
      setManagerPin('');
      setTab('pair');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create invitation');
    }
  };

  const handleCopyInvitation = async () => {
    if (!activeInvitation) return;
    // Full OOB JSON for paste on the joining terminal — includes token intentionally.
    const payload = JSON.stringify(activeInvitation, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage('Could not copy to clipboard. Select and copy manually.');
    }
  };

  const handleCancelInvitation = async (invitationId?: string) => {
    clearFlash();
    const pin = requirePin();
    if (!pin) return;
    try {
      await mutations.cancelInvitation.mutateAsync({
        managerPin: pin,
        invitationId,
      });
      setActiveInvitation(null);
      setSuccessMessage('Invitation cancelled.');
      setManagerPin('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const handleApprove = async (invitationId: string) => {
    clearFlash();
    const pin = requirePin();
    if (!pin) return;
    try {
      const result = await mutations.approvePairing.mutateAsync({
        invitationId,
        managerPin: pin,
      });
      setSuccessMessage(
        `Terminal ${result.terminalId.slice(0, 8)}… registered` +
          (result.idempotent ? ' (idempotent recovery)' : '') +
          `. Fingerprint ${result.clientFingerprintPrefix}.`
      );
      setManagerPin('');
      setActiveInvitation(null);
      await mutations.invalidate();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Approval / cloud registration failed');
    }
  };

  const handleDeny = async (terminalId: string) => {
    clearFlash();
    const pin = requirePin();
    if (!pin) return;
    try {
      await mutations.denyTerminal.mutateAsync({
        terminalId,
        managerPin: pin,
        installationId: status?.host.installationId || undefined,
        reason: 'manager_revoke_ui',
      });
      setSuccessMessage('Terminal denied locally. Cloud sync may still be pending.');
      setManagerPin('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Local deny applied or cloud sync failed — check roster status'
      );
      await mutations.invalidate();
    }
  };

  const handleRetrySync = async (terminalId: string) => {
    clearFlash();
    const pin = requirePin();
    if (!pin || !status?.host.installationId) {
      setErrorMessage('Manager PIN and host installation id are required to retry cloud sync.');
      return;
    }
    try {
      await mutations.retryCloudSync.mutateAsync({
        terminalId,
        managerPin: pin,
        installationId: status.host.installationId,
      });
      setSuccessMessage('Cloud deactivate sync succeeded.');
      setManagerPin('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Cloud sync retry failed');
    }
  };

  const handleJoinSubmit = async () => {
    clearFlash();
    setJoinResult(null);
    if (!desktopPairing) {
      setErrorMessage(
        'Client pairing requires the FARMAX POS desktop app (Electron main performs TLS pin verification).'
      );
      return;
    }
    setJoinBusy(true);
    try {
      let material: unknown = joinPaste.trim();
      try {
        material = JSON.parse(joinPaste.trim());
      } catch {
        // pairing client will parse / reject
      }
      const result = await submitLanPairing({
        invitationMaterial: material,
        label: joinLabel.trim() || undefined,
      });
      setJoinResult(result.message);
      setSuccessMessage(
        `Submitted (${result.clientFingerprintPrefix}). Waiting for host manager approval.`
      );
      setJoinPaste('');
      setJoinPolling(true);
      const id = await getLanClientIdentity();
      setClientIdentity(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pairing failed';
      setErrorMessage(msg);
    } finally {
      setJoinBusy(false);
    }
  };

  const handleJoinStatusPoll = async () => {
    clearFlash();
    if (!desktopPairing) {
      setErrorMessage('Desktop pairing bridge required for status recovery.');
      return;
    }
    setJoinBusy(true);
    try {
      const result = await pollLanPairingStatus();
      setJoinResult(result.message);
      if (result.status === 'REDEEMED' && result.terminalId) {
        setJoinPolling(false);
        setSuccessMessage(
          `Paired. Terminal ${result.terminalId.slice(0, 8)}… stored for reconnect.`
        );
      } else if (result.status === 'AWAITING_APPROVAL') {
        setJoinPolling(true);
        setSuccessMessage('Still awaiting manager approval on the host.');
      } else {
        setJoinPolling(false);
        setErrorMessage(result.message);
      }
      const id = await getLanClientIdentity();
      setClientIdentity(id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Status poll failed');
    } finally {
      setJoinBusy(false);
    }
  };

  if (!canPair && !canRevoke) {
    return (
      <div className="p-6 text-pos-text-muted text-sm">
        You do not have permission to manage LAN terminals.
      </div>
    );
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        <div className="p-3 sm:p-3.5 border-b border-pos-border flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Network size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-pos-text">
                LAN Terminals & Pairing
              </h2>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Manager-approved pairing. TLS pin must be verified out-of-band. Remote LAN stays
                disabled until production pin verification is proven.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void statusQuery.refetch();
              void terminalsQuery.refetch();
            }}
            className="min-h-[34px] text-xs"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>
        </div>

        {(errorMessage || successMessage) && (
          <div
            className={cn(
              'px-3 py-2 text-xs border-b flex items-start gap-2',
              errorMessage
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            )}
          >
            {errorMessage ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{errorMessage || successMessage}</span>
          </div>
        )}

        <div className="flex gap-1 px-3 pt-2 border-b border-pos-border shrink-0 overflow-x-auto">
          {(
            [
              ['overview', 'Overview', Shield],
              ['pair', 'Host pairing', KeyRound],
              ['roster', 'Roster', MonitorSmartphone],
              ['join', 'Join as client', Link2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-t-md flex items-center gap-1.5 border-b-2 -mb-px',
                tab === id
                  ? 'border-pos-primary text-pos-primary'
                  : 'border-transparent text-pos-text-muted hover:text-pos-text'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
          {/* Manager PIN — required for sensitive host actions */}
          {(tab === 'pair' || tab === 'roster') && (
            <div className="rounded-lg border border-pos-border bg-pos-surface-subtle p-3 max-w-md">
              <label className="text-[11px] font-semibold text-pos-text-muted uppercase tracking-wide">
                Manager PIN (authorizes host actions)
              </label>
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="••••"
                className="mt-1.5 font-mono tracking-widest"
              />
              <p className="text-[10px] text-pos-text-muted mt-1">
                PIN is never logged. Required for create / approve / cancel / deny / sync retry.
              </p>
            </div>
          )}

          {tab === 'overview' && status && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-pos-border p-3 space-y-2">
                <div className="text-xs font-bold text-pos-text flex items-center gap-2">
                  Runtime
                  <Badge variant="default" size="sm">
                    {readinessLabel}
                  </Badge>
                </div>
                <ul className="text-[11px] text-pos-text-muted space-y-1 font-mono">
                  <li>Host activated: {status.hostActivated ? 'yes' : 'no'}</li>
                  <li>LAN runtime: {status.lanRuntimeEnabled ? 'enabled' : 'disabled'}</li>
                  <li>Pairing protocol: {status.pairingProtocolReady ? 'ready' : 'not ready'}</li>
                  <li>
                    Remote LAN:{' '}
                    {status.remoteLanPairingEnabled ? 'ENABLED' : 'disabled (default)'}
                  </li>
                  <li>HTTPS: {status.httpsLoopbackOnly ? 'loopback only' : 'non-loopback'}</li>
                  <li>HTTPS hint: {status.httpsBaseHint || '—'}</li>
                  <li>HTTP (local UI): {status.httpBaseHint}</li>
                </ul>
                <p className="text-[10px] text-pos-text-muted leading-relaxed">
                  {status.honestyNote}
                </p>
                {remoteGateNote && (
                  <p className="text-[10px] text-amber-200/80">{remoteGateNote}</p>
                )}
              </div>

              <div className="rounded-lg border border-pos-border p-3 space-y-2">
                <div className="text-xs font-bold text-pos-text">Trust pins (public)</div>
                <ul className="text-[11px] text-pos-text-muted space-y-1 font-mono break-all">
                  <li>Host FP: {status.host.fingerprintSha256Hex || '—'}</li>
                  <li>TLS FP: {status.tls.fingerprintSha256Hex || '—'}</li>
                  <li>TLS valid: {status.tls.notAfter || '—'}</li>
                  <li>Installation: {status.host.installationId || '—'}</li>
                </ul>
                <div className="text-xs font-bold text-pos-text pt-2">Seats (local view)</div>
                <ul className="text-[11px] text-pos-text-muted space-y-1 font-mono">
                  <li>Limit (cached): {status.seats.terminalLimit ?? 'unknown'}</li>
                  <li>
                    Active additional: {status.seats.localActiveAdditionalTerminals}
                  </li>
                  <li>Denied: {status.seats.localDeniedTerminals}</li>
                  <li>
                    Est. available:{' '}
                    {status.seats.cloudSeatsAvailable ?? 'unknown (refresh entitlement online)'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'pair' && canPair && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!status?.pairingProtocolReady || mutations.createInvitation.isPending}
                  isLoading={mutations.createInvitation.isPending}
                  onClick={() => void handleCreateInvitation()}
                >
                  Generate invitation
                </Button>
                {status?.openInvitation && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      void handleCancelInvitation(status.openInvitation?.invitationId)
                    }
                  >
                    Cancel open invitation
                  </Button>
                )}
              </div>

              {!status?.pairingProtocolReady && (
                <p className="text-xs text-amber-200/90">
                  Pairing protocol is not ready. Activate the host license and ensure the TLS
                  certificate is provisioned. Local single-terminal POS continues to work over
                  HTTP.
                </p>
              )}

              {activeInvitation && (
                <div className="rounded-lg border border-pos-primary/40 bg-pos-primary-soft/20 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-pos-text">
                      Out-of-band payload (show on host screen only)
                    </span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopyInvitation()}>
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      <span className="ml-1">{copied ? 'Copied' : 'Copy JSON'}</span>
                    </Button>
                  </div>
                  <p className="text-[10px] text-pos-text-muted">
                    Expires {formatExpiry(activeInvitation.expiresAt)}. Clients must verify TLS
                    pin <span className="font-mono">{shortFp(activeInvitation.tlsCertificateFingerprintSha256Hex)}</span>{' '}
                    before trusting HTTPS. Invitation token is never written to application logs.
                  </p>
                  <pre className="text-[10px] font-mono bg-pos-bg border border-pos-border rounded-md p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                    {JSON.stringify(activeInvitation, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-bold text-pos-text flex items-center gap-2">
                  <UserCheck size={14} />
                  Pending manager approval
                </div>
                {(status?.pendingApprovals?.length ?? 0) === 0 && (
                  <p className="text-[11px] text-pos-text-muted">No clients awaiting approval.</p>
                )}
                {status?.pendingApprovals?.map((p) => (
                  <div
                    key={p.invitationId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-pos-border p-2.5"
                  >
                    <div className="text-[11px] font-mono text-pos-text-muted">
                      <div>FP {p.clientFingerprintPrefix || '—'}</div>
                      <div>{p.label || 'Unlabeled terminal'}</div>
                      <div>Expires {formatExpiry(p.expiresAt)}</div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={mutations.approvePairing.isPending}
                      onClick={() => void handleApprove(p.invitationId)}
                    >
                      Approve & register
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'roster' && (
            <div className="space-y-2">
              {(terminalsQuery.data?.length ?? 0) === 0 && (
                <p className="text-[11px] text-pos-text-muted">
                  No paired terminals on the local roster yet.
                </p>
              )}
              {terminalsQuery.data?.map((t) => (
                <div
                  key={t.terminalId}
                  className="rounded-lg border border-pos-border p-3 flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="text-[11px] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pos-text">{t.label || 'Terminal'}</span>
                      <Badge
                        variant={t.localStatus === 'ACTIVE' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {t.localStatus}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {t.cloudSyncStatus}
                      </Badge>
                    </div>
                    <div className="font-mono text-pos-text-muted">
                      id {t.terminalId} · fp {t.fingerprintPrefix}
                    </div>
                    {t.cloudSyncError && (
                      <div className="text-amber-200/90">Sync: {t.cloudSyncError}</div>
                    )}
                    {t.deniedReason && (
                      <div className="text-pos-text-muted">Denied: {t.deniedReason}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canRevoke && t.localStatus === 'ACTIVE' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleDeny(t.terminalId)}
                      >
                        <Ban size={14} className="mr-1" />
                        Deny
                      </Button>
                    )}
                    {canRevoke &&
                      t.localStatus === 'DENIED' &&
                      (t.cloudSyncStatus === 'PENDING_DEACTIVATE' ||
                        t.cloudSyncStatus === 'SYNC_FAILED') && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleRetrySync(t.terminalId)}
                        >
                          Retry cloud sync
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'join' && (
            <div className="space-y-3 max-w-2xl">
              <p className="text-[11px] text-pos-text-muted leading-relaxed">
                Paste the JSON shown on the <strong className="text-pos-text">host</strong>{' '}
                screen. The desktop main process verifies the TLS certificate fingerprint from
                that material <em>before</em> sending the invitation token. Do not fetch a pin
                from the HTTPS connection itself.
              </p>
              {clientIdentity && (
                <div className="text-[11px] font-mono text-pos-text-muted border border-pos-border rounded-md p-2">
                  This device FP: {clientIdentity.fingerprintPrefix} · storage:{' '}
                  {clientIdentity.storage}
                  {clientIdentity.paired
                    ? ` · paired terminal ${clientIdentity.terminalId}`
                    : ' · not paired'}
                </div>
              )}
              {!desktopPairing && (
                <div className="text-xs text-amber-200/90 border border-amber-500/30 rounded-md p-2">
                  Electron pairing bridge not detected. Browser-only mode cannot enforce
                  certificate pinning safely — use the desktop app to join.
                </div>
              )}
              <label className="text-[11px] font-semibold text-pos-text-muted">
                Optional label
              </label>
              <Input
                value={joinLabel}
                onChange={(e) => setJoinLabel(e.target.value)}
                placeholder="Counter 2"
              />
              <label className="text-[11px] font-semibold text-pos-text-muted">
                Invitation JSON (OOB)
              </label>
              <textarea
                value={joinPaste}
                onChange={(e) => setJoinPaste(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full rounded-md border border-pos-border bg-pos-bg text-[11px] font-mono p-2 text-pos-text"
                placeholder='{ "protocolVersion": 1, "invitationId": "...", "invitationToken": "...", "tlsCertificateFingerprintSha256Hex": "...", ... }'
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!joinPaste.trim() || joinBusy || !desktopPairing}
                  isLoading={joinBusy && !joinPolling}
                  onClick={() => void handleJoinSubmit()}
                >
                  Verify pin & request pairing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={joinBusy || !desktopPairing}
                  isLoading={joinBusy && joinPolling}
                  onClick={() => void handleJoinStatusPoll()}
                >
                  Check approval status
                </Button>
              </div>
              {joinPolling && (
                <p className="text-[11px] text-pos-text-muted">
                  Polling host for approval (authenticated; will not register a second seat)…
                </p>
              )}
              {joinResult && (
                <p className="text-[11px] text-emerald-300/90">{joinResult}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
