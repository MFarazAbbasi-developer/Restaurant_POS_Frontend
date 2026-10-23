import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LanApi } from '@/core/api/lanApi';

export const lanQueryKeys = {
  status: ['lan', 'status'] as const,
  terminals: ['lan', 'terminals'] as const,
};

export function useLanHostStatusQuery(enabled = true) {
  return useQuery({
    queryKey: lanQueryKeys.status,
    queryFn: () => LanApi.getStatus(),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useLanTerminalsQuery(enabled = true) {
  return useQuery({
    queryKey: lanQueryKeys.terminals,
    queryFn: () => LanApi.listTerminals(),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useLanMutations() {
  const qc = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: lanQueryKeys.status }),
      qc.invalidateQueries({ queryKey: lanQueryKeys.terminals }),
    ]);
  };

  const createInvitation = useMutation({
    mutationFn: LanApi.createInvitation,
    onSuccess: invalidate,
  });
  const cancelInvitation = useMutation({
    mutationFn: LanApi.cancelInvitation,
    onSuccess: invalidate,
  });
  const approvePairing = useMutation({
    mutationFn: LanApi.approvePairing,
    onSuccess: invalidate,
  });
  const denyTerminal = useMutation({
    mutationFn: LanApi.denyTerminal,
    onSuccess: invalidate,
  });
  const retryCloudSync = useMutation({
    mutationFn: LanApi.retryCloudSync,
    onSuccess: invalidate,
  });

  return {
    createInvitation,
    cancelInvitation,
    approvePairing,
    denyTerminal,
    retryCloudSync,
    invalidate,
  };
}
