import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { createRun, getRun } from '@/lib/execution-store';
import { WorkflowRunState, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodes, edges, input, workflowName } = body as {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      input: string;
      workflowName?: string;
    };

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Workflow must contain at least one node' },
        { status: 400 }
      );
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const initialRunState: WorkflowRunState = {
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
    };

    createRun(initialRunState);

    // Dispatch event to Inngest
    let inngestDispatched = false;
    try {
      await inngest.send({
        name: 'workflow/execute',
        data: {
          runId,
          input: input || '',
          nodes,
          edges,
          workflowName: workflowName || 'AI Decision Flow',
        },
      });
      inngestDispatched = true;
    } catch (inngestErr) {
      console.warn('Inngest send event warning (local dev fallback will be used if Inngest daemon not running):', inngestErr);
    }

    return NextResponse.json({
      runId,
      status: 'running',
      inngestDispatched,
      run: getRun(runId),
    });
  } catch (error) {
    console.error('Failed to trigger workflow run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown execution error' },
      { status: 500 }
    );
  }
}
