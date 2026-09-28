'use client';

import React, { useRef } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  FolderOpen,
  Download,
  Upload,
  Sparkles,
  Server,
  Layers,
  ChevronDown,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { PRESET_WORKFLOWS } from '@/lib/presets';
import { StoredWorkflow } from '@/types/workflow';

interface HeaderToolbarProps {
  isRunning: boolean;
  onRunWorkflow: () => void;
  onResetWorkflow: () => void;
  onAddDecisionNode: () => void;
  onAddActionNode: () => void;
  onSelectPreset: (preset: StoredWorkflow) => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  stepSpeed: number;
  onStepSpeedChange: (speed: number) => void;
  currentPresetName: string;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  isRunning,
  onRunWorkflow,
  onResetWorkflow,
  onAddDecisionNode,
  onAddActionNode,
  onSelectPreset,
  onExportJson,
  onImportJson,
  stepSpeed,
  onStepSpeedChange,
  currentPresetName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onImportJson(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white">
              AI Decision Flow
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Inngest Powered
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Durable binary AI decision steps &amp; visual execution
          </p>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[140px] truncate">{currentPresetName}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Workflow Presets
            </div>
            {PRESET_WORKFLOWS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors block"
              >
                <div className="font-semibold">{preset.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Add Nodes */}
        <button
          type="button"
          onClick={onAddDecisionNode}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Decision Node</span>
        </button>

        <button
          type="button"
          onClick={onAddActionNode}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Action Node</span>
        </button>

        {/* Run Workflow Main CTA */}
        <button
          type="button"
          onClick={onRunWorkflow}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-lg transition-all ${
            isRunning
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95'
          }`}
        >
          {isRunning ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Executing Flow...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Workflow</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-400 gap-1.5">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Speed:</span>
          <select
            value={stepSpeed}
            onChange={(e) => onStepSpeedChange(Number(e.target.value))}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value={400} className="bg-slate-900">Fast (0.4s)</option>
            <option value={1000} className="bg-slate-900">Normal (1s)</option>
            <option value={2000} className="bg-slate-900">Slow (2s)</option>
          </select>
        </div>
      </div>

      {/* Right Controls: Export/Import/Status */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetWorkflow}
          title="Reset Workflow State"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onExportJson}
          title="Export Workflow JSON"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Import Workflow JSON"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Inngest Dev Server Link */}
        <a
          href="http://localhost:8288"
          target="_blank"
          rel="noreferrer"
          title="Open Inngest Dev Server Dashboard (http://localhost:8288)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 text-[11px] transition-colors"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">Inngest :8288</span>
        </a>
      </div>
    </header>
  );
};
