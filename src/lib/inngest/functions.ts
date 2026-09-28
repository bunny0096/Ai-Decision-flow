import { inngest } from './client';
import { evaluateAiDecision } from '@/lib/ai/decide';
import {
  appendStepRecord,
  completeRun,
  updateRun,
} from '@/lib/execution-store';
import {
  WorkflowNode,
  WorkflowEdge,
  ExecutionStepRecord,
  DecisionNodeData,
  ActionNodeData,
  DecisionResult,
} from '@/types/workflow';

export interface WorkflowExecuteEventData {
  runId: string;
  workflowId?: string;
  workflowName?: string;
  input: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const executeWorkflow = inngest.createFunction(
  {
    id: 'execute-ai-workflow',
    name: 'Execute AI Decision Workflow',
    triggers: [{ event: 'workflow/execute' }],
  },
  async ({ event, step }) => {
    const { runId, input, nodes, edges, workflowName } =
      event.data as unknown as WorkflowExecuteEventData;

    // Helper: identify start node (node marked as start, or in-degree 0)
    const targetNodeIds = new Set(edges.map((e) => e.target));
    const startNode =
      nodes.find((n) => (n.data as DecisionNodeData)?.isStartNode) ||
      nodes.find((n) => !targetNodeIds.has(n.id)) ||
      nodes[0];

    if (!startNode) {
      completeRun(runId, 'No start node found in workflow');
      return { success: false, error: 'No start node found' };
    }

    // Set initial run state to running
    updateRun(runId, (prev) => ({
      ...prev,
      status: 'running',
      currentNodeId: startNode.id,
      startedAt: new Date().toISOString(),
    }));

    let currentNodeId: string | null = startNode.id;
    let stepCount = 0;
    const maxSteps = 25; // cycle prevention guard
    const visitedNodes = new Set<string>();

    while (currentNodeId && stepCount < maxSteps) {
      stepCount++;
      const currentTargetId: string = currentNodeId;
      const node = nodes.find((n) => n.id === currentTargetId);

      if (!node) {
        break;
      }

      visitedNodes.add(currentTargetId);
      const isActionNode = node.type === 'actionNode' || 'action' in node.data;

      if (isActionNode) {
        const actionData = node.data as ActionNodeData;
        const stepId = `action-step-${currentTargetId}-${stepCount}`;

        await step.run(stepId, async () => {
          const startTime = Date.now();
          const durationMs = Date.now() - startTime;
          const stepRecord: ExecutionStepRecord = {
            stepIndex: stepCount,
            nodeId: currentTargetId,
            nodeLabel: actionData.label || 'Action Step',
            nodeType: 'action',
            actionMessage: actionData.action || 'Workflow completed',
            timestamp: new Date().toISOString(),
            durationMs,
            status: 'completed',
          };

          appendStepRecord(runId, stepRecord, null, null);
          return stepRecord;
        });

        // Action node is terminal
        currentNodeId = null;
        break;
      } else {
        // Decision Node
        const decisionData = node.data as DecisionNodeData;
        const stepId = `decision-step-${currentTargetId}-${stepCount}`;

        const stepResult: {
          decision: DecisionResult;
          reasoning: string;
          nextNodeId: string | null;
          activeEdgeId: string | null;
          durationMs: number;
        } = await step.run(stepId, async () => {
          const startTime = Date.now();
          const prompt =
            decisionData.prompt || decisionData.label || 'Is this valid?';

          // Call LLM (OpenAI or smart simulator fallback)
          const evaluation = await evaluateAiDecision(prompt, input);
          const durationMs = Date.now() - startTime;

          // Find candidate outgoing edges
          // Match source handle ('yes' / 'no') or edge branch data
          const decision = evaluation.decision;
          const matchingEdge = edges.find((edge) => {
            if (edge.source !== currentTargetId) return false;
            if (
              edge.sourceHandle &&
              edge.sourceHandle.toLowerCase() === decision.toLowerCase()
            ) {
              return true;
            }
            if (
              edge.data?.branch &&
              edge.data.branch.toUpperCase() === decision
            ) {
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
            nodeId: currentTargetId,
            nodeLabel: decisionData.label || `Decision Node ${stepCount}`,
            nodeType: 'decision',
            prompt,
            decision,
            reasoning: evaluation.reasoning,
            timestamp: new Date().toISOString(),
            durationMs,
            status: 'completed',
          };

          appendStepRecord(
            runId,
            stepRecord,
            nextNode,
            matchingEdge?.id || null
          );

          return {
            decision,
            reasoning: evaluation.reasoning,
            nextNodeId: nextNode,
            activeEdgeId: matchingEdge?.id || null,
            durationMs,
          };
        });

        // Advance to next node or break if dead-end
        currentNodeId = stepResult.nextNodeId;
      }
    }

    // Complete the workflow run
    completeRun(runId);

    return {
      success: true,
      runId,
      workflowName,
      totalSteps: stepCount,
    };
  }
);
