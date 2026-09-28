import { NextResponse } from 'next/server';
import { evaluateAiDecision } from '@/lib/ai/decide';
import {
  createRun,
  appendStepRecord,
  completeRun,
  getRun,
  updateRun,
} from '@/lib/execution-store';
import {
  WorkflowNode,
  WorkflowEdge,
  ExecutionStepRecord,
  DecisionNodeData,
  ActionNodeData,
} from '@/types/workflow';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodes, edges, input, workflowName, runId: existingRunId } = body as {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      input: string;
      workflowName?: string;
      runId?: string;
    };

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Workflow has no nodes' },
        { status: 400 }
      );
    }

    const runId =
      existingRunId ||
      `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    createRun({
      runId,
      workflowName: workflowName || 'AI Decision Flow',
      input: input || '',
      status: 'running',
      currentNodeId: null,
      activeEdgeId: null,
      steps: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    });

    const targetNodeIds = new Set(edges.map((e) => e.target));
    const startNode =
      nodes.find((n) => (n.data as DecisionNodeData)?.isStartNode) ||
      nodes.find((n) => !targetNodeIds.has(n.id)) ||
      nodes[0];

    if (!startNode) {
      completeRun(runId, 'No valid starting node found');
      return NextResponse.json({ error: 'No start node' }, { status: 400 });
    }

    let currentNodeId: string | null = startNode.id;
    let stepCount = 0;
    const maxSteps = 20;
    const steps: ExecutionStepRecord[] = [];

    while (currentNodeId && stepCount < maxSteps) {
      stepCount++;
      const nodeId = currentNodeId;
      const node = nodes.find((n) => n.id === nodeId);

      if (!node) break;

      const isActionNode = node.type === 'actionNode' || 'action' in node.data;

      if (isActionNode) {
        const actionData = node.data as ActionNodeData;
        const stepRecord: ExecutionStepRecord = {
          stepIndex: stepCount,
          nodeId,
          nodeLabel: actionData.label || 'Action Step',
          nodeType: 'action',
          actionMessage: actionData.action || 'Workflow completed',
          timestamp: new Date().toISOString(),
          durationMs: 40,
          status: 'completed',
        };

        steps.push(stepRecord);
        appendStepRecord(runId, stepRecord, null, null);
        currentNodeId = null;
        break;
      } else {
        const decisionData = node.data as DecisionNodeData;
        const startTime = Date.now();
        const prompt = decisionData.prompt || decisionData.label || 'Is this valid?';

        const evalResult = await evaluateAiDecision(prompt, input);
        const durationMs = Date.now() - startTime;
        const decision = evalResult.decision;

        const matchingEdge = edges.find((edge) => {
          if (edge.source !== nodeId) return false;
          if (edge.sourceHandle && edge.sourceHandle.toLowerCase() === decision.toLowerCase()) {
            return true;
          }
          if (edge.data?.branch && edge.data.branch.toUpperCase() === decision) {
            return true;
          }
          return (
            edge.id.toLowerCase().includes(decision.toLowerCase()) ||
            edge.label?.toString().toUpperCase() === decision
          );
        });

        const nextNode = matchingEdge ? matchingEdge.target : null;

        const stepRecord: ExecutionStepRecord = {
          stepIndex: stepCount,
          nodeId,
          nodeLabel: decisionData.label || `Decision Step ${stepCount}`,
          nodeType: 'decision',
          prompt,
          decision,
          reasoning: evalResult.reasoning,
          timestamp: new Date().toISOString(),
          durationMs,
          status: 'completed',
        };

        steps.push(stepRecord);
        appendStepRecord(runId, stepRecord, nextNode, matchingEdge?.id || null);
        currentNodeId = nextNode;
      }
    }

    completeRun(runId);
    const finalRun = getRun(runId);

    return NextResponse.json({
      runId,
      run: finalRun,
      steps,
      totalSteps: stepCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}
