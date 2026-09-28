'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  BrainCircuit,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DecisionNodeData } from '@/types/workflow';

export const DecisionNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
  const nodeData = data as unknown as DecisionNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label || 'AI Decision Node');
  const [prompt, setPrompt] = useState(
    nodeData.prompt || 'Is this inquiry valid and actionable?'
  );
  const [showReasoning, setShowReasoning] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // Sync edits back to node data
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    nodeData.prompt = e.target.value;
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    nodeData.label = e.target.value;
  };

  // Direct single-node test
  const handleTestPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    try {
      const res = await fetch('/api/ai/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          input: 'Test context inquiry: sample support request or urgent production issue',
        }),
      });
      const resData = await res.json();
      nodeData.decision = resData.decision;
      nodeData.reasoning = resData.reasoning;
      nodeData.status = 'completed';
    } catch {
      nodeData.status = 'failed';
      nodeData.error = 'Test failed';
    } finally {
      setIsTesting(false);
    }
  };

  // Border & Glow styling based on execution status
  const getStatusClasses = () => {
    if (nodeData.status === 'running') {
      return 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.6)] node-active-running';
    }
    if (nodeData.status === 'completed') {
      if (nodeData.decision === 'YES') {
        return 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
      }
      if (nodeData.decision === 'NO') {
        return 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
      }
      return 'border-indigo-400';
    }
    if (nodeData.status === 'failed') {
      return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
    }
    return selected ? 'border-indigo-400 ring-2 ring-indigo-500/40' : 'border-slate-800 hover:border-slate-700';
  };

  return (
    <div
      className={`relative min-w-[280px] max-w-[340px] rounded-xl bg-slate-900/95 backdrop-blur-md p-4 text-slate-100 border transition-all duration-300 shadow-xl ${getStatusClasses()}`}
    >
      {/* Top Handle for incoming flow */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-indigo-400 !border-2 !border-slate-950 !w-3 !h-3"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BrainCircuit className="w-4 h-4" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="bg-slate-800 text-xs font-semibold text-white px-2 py-0.5 rounded border border-indigo-500/50 outline-none w-36"
            />
          ) : (
            <div
              className="font-semibold text-xs tracking-wide text-slate-200 cursor-pointer hover:text-white transition-colors"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {label}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {nodeData.isStartNode && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              <Flag className="w-2.5 h-2.5" /> Start
            </span>
          )}

          <button
            onClick={handleTestPrompt}
            disabled={isTesting || nodeData.status === 'running'}
            title="Test prompt with sample input"
            className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
          >
            {isTesting ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Decision Prompt Editor */}
      <div className="space-y-1.5 mb-3">
        <label className="flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> AI Question (Evaluates to YES/NO)
          </span>
        </label>
        <textarea
          rows={2}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="e.g. Is this a critical production outage or emergency?"
          className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
        />
      </div>

      {/* Execution Status Badge / Output Preview */}
      {nodeData.status === 'running' && (
        <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-2 mb-3 animate-pulse">
          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
          <span>Evaluating prompt in Inngest step...</span>
        </div>
      )}

      {nodeData.status === 'completed' && nodeData.decision && (
        <div className="space-y-2 mb-3">
          <div
            className={`flex items-center justify-between text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${
              nodeData.decision === 'YES'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {nodeData.decision === 'YES' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>Decision: {nodeData.decision}</span>
            </div>
            {nodeData.reasoning && (
              <button
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
              >
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {showReasoning && nodeData.reasoning && (
            <div className="text-[11px] text-slate-300 bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 leading-relaxed">
              <span className="font-semibold text-slate-400 block mb-0.5">Reasoning:</span>
              {nodeData.reasoning}
            </div>
          )}
        </div>
      )}

      {nodeData.status === 'failed' && (
        <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{nodeData.error || 'Evaluation failed'}</span>
          </div>
          <button
            onClick={handleTestPrompt}
            className="text-[10px] underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Branching Output Handles */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-semibold text-slate-400">
        {/* YES Handle - Left */}
        <div className="flex items-center gap-1.5 text-emerald-400 relative pl-1">
          <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            YES
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            isConnectable={isConnectable}
            className="!bg-emerald-500 !border-2 !border-slate-950 !w-3.5 !h-3.5 !left-6 !-bottom-2"
          />
        </div>

        {/* NO Handle - Right */}
        <div className="flex items-center gap-1.5 text-rose-400 relative pr-1">
          <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            NO
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            isConnectable={isConnectable}
            className="!bg-rose-500 !border-2 !border-slate-950 !w-3.5 !h-3.5 !left-auto !right-6 !-bottom-2"
          />
        </div>
      </div>
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
