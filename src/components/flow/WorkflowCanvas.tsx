'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import confetti from 'canvas-confetti';
import { DecisionNode } from './nodes/DecisionNode';
import { ActionNode } from './nodes/ActionNode';
import { DecisionEdge } from './edges/DecisionEdge';
import { HeaderToolbar } from './HeaderToolbar';
import { InputPanel } from './InputPanel';
import { LogsPanel } from './LogsPanel';
import { PRESET_WORKFLOWS } from '@/lib/presets';
import {
  WorkflowNode,
  WorkflowEdge,
  StoredWorkflow,
  WorkflowRunState,
  ExecutionStepRecord,
} from '@/types/workflow';

const STORAGE_KEY = 'ai_decision_workflow_state';

export const WorkflowCanvas: React.FC = () => {
  const initialPreset = PRESET_WORKFLOWS[0];

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(
    initialPreset.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(
    initialPreset.edges
  );

  const [testInput, setTestInput] = useState<string>(initialPreset.defaultInput);
  const [currentPresetName, setCurrentPresetName] = useState<string>(
    initialPreset.name
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentRun, setCurrentRun] = useState<WorkflowRunState | null>(null);
  const [historyRuns, setHistoryRuns] = useState<WorkflowRunState[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [stepSpeed, setStepSpeed] = useState<number>(1000);

  // Registered custom node & edge types
  const nodeTypes = useMemo(
    () => ({
      decisionNode: DecisionNode,
      actionNode: ActionNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      decisionEdge: DecisionEdge,
    }),
    []
  );

  // Restore saved state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.testInput) setTestInput(parsed.testInput);
          if (parsed.presetName) setCurrentPresetName(parsed.presetName);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [setNodes, setEdges]);

  // Persist state to localStorage on modification
  const saveStateToStorage = useCallback(
    (newNodes: WorkflowNode[], newEdges: WorkflowEdge[], inputVal: string) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            nodes: newNodes,
            edges: newEdges,
            testInput: inputVal,
            presetName: currentPresetName,
          })
        );
      } catch {
        // ignore storage errors
      }
    },
    [currentPresetName]
  );

  // Handle new connections with automatic YES / NO branch assignment
  const onConnect = useCallback(
    (params: Connection) => {
      const isYesBranch = params.sourceHandle?.toLowerCase() === 'yes';
      const branch = isYesBranch ? 'YES' : 'NO';

      const newEdge: WorkflowEdge = {
        id: `edge-${params.source}-${params.target}-${branch.toLowerCase()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'decisionEdge',
        data: {
          branch,
          status: 'idle',
        },
      };

      setEdges((eds) => {
        const updated = addEdge(newEdge, eds) as WorkflowEdge[];
        saveStateToStorage(nodes, updated, testInput);
        return updated;
      });
    },
    [nodes, setEdges, saveStateToStorage, testInput]
  );

  // Add new Decision Node
  const handleAddDecisionNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type: 'decisionNode',
      position: { x: 300 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: {
        label: `Decision Step ${nodes.length + 1}`,
        prompt: 'Is this condition satisfied?',
        status: 'idle',
      },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      saveStateToStorage(updated, edges, testInput);
      return updated;
    });
  }, [nodes, edges, setNodes, saveStateToStorage, testInput]);

  // Add new Action Node
  const handleAddActionNode = useCallback(() => {
    const id = `action-${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type: 'actionNode',
      position: { x: 340 + Math.random() * 80, y: 380 + Math.random() * 80 },
      data: {
        label: `Action Step`,
        action: 'Execute final destination task',
        status: 'idle',
      },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      saveStateToStorage(updated, edges, testInput);
      return updated;
    });
  }, [nodes, edges, setNodes, saveStateToStorage, testInput]);

  // Select Preset Template
  const handleSelectPreset = useCallback(
    (preset: StoredWorkflow) => {
      setNodes(preset.nodes);
      setEdges(preset.edges);
      setTestInput(preset.defaultInput);
      setCurrentPresetName(preset.name);
      saveStateToStorage(preset.nodes, preset.edges, preset.defaultInput);
    },
    [setNodes, setEdges, saveStateToStorage]
  );

  // Reset visual execution status of all nodes and edges
  const resetVisualState = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: 'idle',
          decision: null,
          reasoning: undefined,
          error: undefined,
        },
      }))
    );
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          status: 'idle',
          active: false,
        },
      }))
    );
  }, [setNodes, setEdges]);

  // Export Workflow JSON
  const handleExportJson = useCallback(() => {
    const data: StoredWorkflow = {
      id: `workflow-${Date.now()}`,
      name: currentPresetName,
      description: 'Exported AI Decision Workflow',
      defaultInput: testInput,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPresetName.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentPresetName, testInput, nodes, edges]);

  // Import Workflow JSON
  const handleImportJson = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.defaultInput) setTestInput(parsed.defaultInput);
          if (parsed.name) setCurrentPresetName(parsed.name);
          saveStateToStorage(
            parsed.nodes,
            parsed.edges,
            parsed.defaultInput || testInput
          );
        } else {
          alert('Invalid workflow JSON file format.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    },
    [setNodes, setEdges, saveStateToStorage, testInput]
  );

  // Sleep helper for animation
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Run Workflow Execution (Inngest step-by-step orchestrator & visualizer)
  const handleRunWorkflow = async () => {
    if (isRunning) return;

    setIsRunning(true);
    resetVisualState();
    setIsLogsOpen(true);

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialRun: WorkflowRunState = {
      runId,
      workflowName: currentPresetName,
      input: testInput,
      status: 'running',
      currentNodeId: null,
      activeEdgeId: null,
      steps: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    setCurrentRun(initialRun);

    try {
      // Call interactive execution endpoint to get full resolved steps
      const res = await fetch('/api/workflows/execute-interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          nodes,
          edges,
          input: testInput,
          workflowName: currentPresetName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Execution failed');
      }

      const steps: ExecutionStepRecord[] = data.steps || [];

      // Step-by-step visual animation through the graph
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // 1. Mark node as RUNNING
        setNodes((nds) =>
          nds.map((n) =>
            n.id === step.nodeId
              ? { ...n, data: { ...n.data, status: 'running' } }
              : n
          )
        );

        await delay(stepSpeed);

        // 2. Mark node as COMPLETED with Decision & Reasoning
        setNodes((nds) =>
          nds.map((n) =>
            n.id === step.nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'completed',
                    decision: step.decision || null,
                    reasoning: step.reasoning,
                    resultMessage: step.actionMessage,
                  },
                }
              : n
          )
        );

        // 3. Highlight the traversed edge (YES/NO path)
        if (step.nodeType === 'decision' && step.decision) {
          const matchingEdge = edges.find((e) => {
            if (e.source !== step.nodeId) return false;
            if (e.sourceHandle?.toLowerCase() === step.decision?.toLowerCase()) {
              return true;
            }
            if (e.data?.branch?.toUpperCase() === step.decision) {
              return true;
            }
            return false;
          });

          if (matchingEdge) {
            setEdges((eds) =>
              eds.map((edge) => {
                if (edge.id === matchingEdge.id) {
                  return {
                    ...edge,
                    data: { ...edge.data, status: 'active', active: true },
                  };
                }
                if (edge.source === step.nodeId) {
                  // Dim the alternative untaken path
                  return {
                    ...edge,
                    data: { ...edge.data, status: 'dimmed', active: false },
                  };
                }
                return edge;
              })
            );
          }
        }

        // Update live logs step by step
        setCurrentRun((prev) =>
          prev
            ? {
                ...prev,
                steps: steps.slice(0, i + 1),
                currentNodeId: step.nodeId,
              }
            : null
        );

        await delay(stepSpeed / 2);
      }

      // Finish execution
      const completedRun: WorkflowRunState = {
        ...initialRun,
        status: 'completed',
        steps,
        completedAt: new Date().toISOString(),
      };
      setCurrentRun(completedRun);
      setHistoryRuns((prev) => [completedRun, ...prev]);

      // Celebrate successful run!
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      const failedRun: WorkflowRunState = {
        ...initialRun,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Execution error',
        completedAt: new Date().toISOString(),
      };
      setCurrentRun(failedRun);
      setHistoryRuns((prev) => [failedRun, ...prev]);
    } finally {
      setIsRunning(false);
    }
  };

  // Replay a historical run
  const handleSelectHistoryRun = useCallback(
    (historyRun: WorkflowRunState) => {
      setCurrentRun(historyRun);
      resetVisualState();

      // Apply past execution status to nodes
      setNodes((nds) =>
        nds.map((n) => {
          const matchStep = historyRun.steps.find((s) => s.nodeId === n.id);
          if (matchStep) {
            return {
              ...n,
              data: {
                ...n.data,
                status: 'completed',
                decision: matchStep.decision || null,
                reasoning: matchStep.reasoning,
                resultMessage: matchStep.actionMessage,
              },
            };
          }
          return n;
        })
      );
    },
    [resetVisualState, setNodes]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* Top Header & Toolbar */}
      <HeaderToolbar
        isRunning={isRunning}
        onRunWorkflow={handleRunWorkflow}
        onResetWorkflow={resetVisualState}
        onAddDecisionNode={handleAddDecisionNode}
        onAddActionNode={handleAddActionNode}
        onSelectPreset={handleSelectPreset}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        stepSpeed={stepSpeed}
        onStepSpeedChange={setStepSpeed}
        currentPresetName={currentPresetName}
      />

      {/* Test Input bar */}
      <InputPanel
        input={testInput}
        onChangeInput={(val) => {
          setTestInput(val);
          saveStateToStorage(nodes, edges, val);
        }}
        isRunning={isRunning}
      />

      {/* Main Flow Canvas */}
      <main className="flex-1 relative w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'decisionEdge',
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="rgba(255, 255, 255, 0.08)"
          />
          <Controls className="!bottom-16 !left-4" />
          <MiniMap
            nodeStrokeColor="#6366f1"
            nodeColor={(node) =>
              node.type === 'actionNode' ? '#06b6d4' : '#6366f1'
            }
            maskColor="rgba(9, 13, 22, 0.75)"
            className="!bottom-16 !right-4 !bg-slate-900/90 !border !border-slate-800 !rounded-xl"
          />

          {/* Quick Legend Overlay */}
          <Panel
            position="top-left"
            className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-2.5 text-[11px] space-y-1.5 shadow-lg pointer-events-none"
          >
            <div className="font-bold text-slate-300">Flow Legend</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>YES Decision Branch</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span>NO Decision Branch</span>
            </div>
          </Panel>
        </ReactFlow>
      </main>

      {/* Execution Logs Drawer / History */}
      <LogsPanel
        currentRun={currentRun}
        historyRuns={historyRuns}
        onSelectHistoryRun={handleSelectHistoryRun}
        isOpen={isLogsOpen}
        onToggle={() => setIsLogsOpen(!isLogsOpen)}
      />
    </div>
  );
};
