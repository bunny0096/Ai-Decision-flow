import { Edge, Node } from '@xyflow/react';

export type DecisionResult = 'YES' | 'NO';

export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface DecisionNodeData extends Record<string, unknown> {
  label: string;
  prompt: string;
  description?: string;
  status?: NodeExecutionStatus;
  decision?: DecisionResult | null;
  reasoning?: string;
  error?: string;
  isStartNode?: boolean;
}

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  action: string;
  status?: NodeExecutionStatus;
  resultMessage?: string;
  error?: string;
}

export type WorkflowNode = Node<DecisionNodeData | ActionNodeData>;

export interface CustomEdgeData extends Record<string, unknown> {
  branch?: 'YES' | 'NO';
  active?: boolean;
  status?: 'idle' | 'active' | 'dimmed';
}

export type WorkflowEdge = Edge<CustomEdgeData>;

export interface ExecutionStepRecord {
  stepIndex: number;
  nodeId: string;
  nodeLabel: string;
  nodeType: 'decision' | 'action';
  prompt?: string;
  decision?: DecisionResult;
  reasoning?: string;
  actionMessage?: string;
  timestamp: string;
  durationMs: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface WorkflowRunState {
  runId: string;
  workflowId?: string;
  workflowName: string;
  input: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentNodeId: string | null;
  activeEdgeId: string | null;
  steps: ExecutionStepRecord[];
  startedAt: string | null;
  completedAt: string | null;
  error?: string | null;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  description: string;
  defaultInput: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
}
