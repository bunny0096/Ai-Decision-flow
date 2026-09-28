import { WorkflowRunState, ExecutionStepRecord } from '@/types/workflow';

// In-memory global store for runs (survives HMR across requests in dev)
declare global {
  // eslint-disable-next-line no-var
  var __WORKFLOW_RUNS__: Map<string, WorkflowRunState> | undefined;
}

const runsMap: Map<string, WorkflowRunState> =
  globalThis.__WORKFLOW_RUNS__ ?? new Map<string, WorkflowRunState>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__WORKFLOW_RUNS__ = runsMap;
}

export function createRun(runState: WorkflowRunState): void {
  runsMap.set(runState.runId, runState);
}

export function getRun(runId: string): WorkflowRunState | undefined {
  return runsMap.get(runId);
}

export function updateRun(
  runId: string,
  updater: (prev: WorkflowRunState) => WorkflowRunState
): WorkflowRunState | undefined {
  const current = runsMap.get(runId);
  if (!current) return undefined;
  const updated = updater(current);
  runsMap.set(runId, updated);
  return updated;
}

export function appendStepRecord(
  runId: string,
  step: ExecutionStepRecord,
  nextNodeId: string | null,
  activeEdgeId: string | null
): WorkflowRunState | undefined {
  return updateRun(runId, (prev) => ({
    ...prev,
    currentNodeId: nextNodeId,
    activeEdgeId,
    steps: [...prev.steps, step],
  }));
}

export function completeRun(
  runId: string,
  error?: string
): WorkflowRunState | undefined {
  return updateRun(runId, (prev) => ({
    ...prev,
    status: error ? 'failed' : 'completed',
    currentNodeId: null,
    activeEdgeId: null,
    completedAt: new Date().toISOString(),
    error: error || null,
  }));
}

export function getAllRuns(): WorkflowRunState[] {
  return Array.from(runsMap.values()).sort(
    (a, b) =>
      new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
  );
}
