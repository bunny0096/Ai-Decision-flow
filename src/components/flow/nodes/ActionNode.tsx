'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActionNodeData } from '@/types/workflow';

export const ActionNode = memo(({ data, isConnectable, selected }: NodeProps) => {
  const nodeData = data as unknown as ActionNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label || 'Action Step');
  const [action, setAction] = useState(
    nodeData.action || 'Execute destination workflow action'
  );

  const handleActionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAction(e.target.value);
    nodeData.action = e.target.value;
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    nodeData.label = e.target.value;
  };

  const getStatusClasses = () => {
    if (nodeData.status === 'running') {
      return 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse';
    }
    if (nodeData.status === 'completed') {
      return 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] bg-slate-900/95';
    }
    if (nodeData.status === 'failed') {
      return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
    }
    return selected ? 'border-cyan-400 ring-2 ring-cyan-500/40' : 'border-slate-800 hover:border-slate-700';
  };

  return (
    <div
      className={`relative min-w-[260px] max-w-[320px] rounded-xl bg-slate-900/90 backdrop-blur-md p-4 text-slate-100 border transition-all duration-300 shadow-xl ${getStatusClasses()}`}
    >
      {/* Top Handle for incoming flow */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-cyan-400 !border-2 !border-slate-950 !w-3 !h-3"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-4 h-4" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="bg-slate-800 text-xs font-semibold text-white px-2 py-0.5 rounded border border-cyan-500/50 outline-none w-36"
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

        <span className="text-[10px] font-semibold text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Action
        </span>
      </div>

      {/* Action Description */}
      <div className="space-y-1.5 mb-2">
        <label className="text-[11px] font-medium text-slate-400 block">
          Terminal Action Payload:
        </label>
        <textarea
          rows={2}
          value={action}
          onChange={handleActionChange}
          placeholder="e.g. Route ticket to Tier 2 and ping Slack"
          className="w-full text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
        />
      </div>

      {/* Execution Status badge */}
      {nodeData.status === 'completed' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg p-2 mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">Action Triggered Successfully</span>
        </div>
      )}

      {nodeData.status === 'failed' && (
        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg p-2 mt-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">{nodeData.error || 'Action failed'}</span>
        </div>
      )}
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
