'use client';

import React, { useState } from 'react';
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Code2,
  History,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExecutionStepRecord, WorkflowRunState } from '@/types/workflow';

interface LogsPanelProps {
  currentRun: WorkflowRunState | null;
  historyRuns: WorkflowRunState[];
  onSelectHistoryRun: (run: WorkflowRunState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({
  currentRun,
  historyRuns,
  onSelectHistoryRun,
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);

  const steps = currentRun?.steps || [];
  const totalDuration = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  return (
    <div
      className={`fixed bottom-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-l border-slate-800 shadow-2xl transition-all duration-300 flex flex-col ${
        isOpen ? 'h-96 w-full md:w-[580px]' : 'h-11 w-auto'
      }`}
    >
      {/* Header bar / tab switcher */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-slate-800/80 bg-slate-900/80 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-200">
            <ListFilter className="w-4 h-4 text-indigo-400" />
            <span>Workflow Execution Logs</span>
          </div>

          {currentRun && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                currentRun.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentRun.status === 'running'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                  : currentRun.status === 'failed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentRun.status}
            </span>
          )}

          {steps.length > 0 && (
            <span className="text-[11px] text-slate-400">
              ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('current')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeTab === 'current'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Live Run
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3 h-3" /> History ({historyRuns.length})
              </button>
            </div>
          )}

          <button
            onClick={onToggle}
            type="button"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {activeTab === 'current' ? (
            <>
              {/* Summary Stats bar */}
              {currentRun && (
                <div className="grid grid-cols-3 gap-2 pb-2 text-[11px] font-sans border-b border-slate-800/80">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Workflow</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {currentRun.workflowName || 'AI Decision Flow'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total Latency</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> {totalDuration} ms
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Decisions Made</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />{' '}
                      {steps.filter((s) => s.nodeType === 'decision').length} steps
                    </span>
                  </div>
                </div>
              )}

              {/* No steps state */}
              {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-sans gap-2">
                  <Sparkles className="w-6 h-6 text-slate-600" />
                  <p className="text-xs">No execution steps yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Click &quot;Run Workflow&quot; in the top bar to watch Inngest evaluate each node.
                  </p>
                </div>
              ) : (
                /* Step timeline list */
                <div className="space-y-2.5 font-sans">
                  {steps.map((step) => {
                    const isExpanded = expandedStepIndex === step.stepIndex;
                    const isDecision = step.nodeType === 'decision';

                    return (
                      <div
                        key={step.stepIndex}
                        className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              Step {step.stepIndex}
                            </span>
                            <span className="font-semibold text-xs text-slate-200">
                              {step.nodeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isDecision && step.decision && (
                              <span
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  step.decision === 'YES'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {step.decision === 'YES' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {step.decision}
                              </span>
                            )}

                            {!isDecision && (
                              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Terminal Action
                              </span>
                            )}

                            <span className="text-[10px] text-slate-500 font-mono">
                              {step.durationMs}ms
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedStepIndex(isExpanded ? null : step.stepIndex)
                              }
                              className="text-slate-400 hover:text-slate-200 p-0.5"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Step details */}
                        {isDecision ? (
                          <div className="text-xs space-y-1">
                            <div className="text-slate-400 text-[11px]">
                              <span className="font-semibold text-slate-500">Prompt: </span>
                              {step.prompt}
                            </div>
                            {step.reasoning && (
                              <div className="text-slate-300 text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 mt-1 leading-relaxed">
                                <span className="text-indigo-400 font-medium">AI Reasoning: </span>
                                {step.reasoning}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                            <span className="text-cyan-400 font-medium">Action Payload: </span>
                            {step.actionMessage}
                          </div>
                        )}

                        {/* Raw JSON expander */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] bg-slate-950 p-2 rounded text-slate-300 overflow-x-auto">
                            <pre>{JSON.stringify(step, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-2 font-sans">
              {historyRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                  <History className="w-6 h-6 text-slate-600" />
                  <p className="text-xs">No historical runs recorded yet.</p>
                </div>
              ) : (
                historyRuns.map((run) => (
                  <div
                    key={run.runId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">
                          {run.workflowName || 'Workflow Run'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            run.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                        &quot;{run.input}&quot;
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : ''} ·{' '}
                        {run.steps.length} steps
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectHistoryRun(run)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Replay
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
