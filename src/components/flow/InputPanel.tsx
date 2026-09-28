'use client';

import React from 'react';
import { MessageSquareText, Sparkles } from 'lucide-react';

interface InputPanelProps {
  input: string;
  onChangeInput: (val: string) => void;
  isRunning: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  input,
  onChangeInput,
  isRunning,
}) => {
  const quickSamples = [
    {
      label: 'Critical Outage',
      text: 'Our primary database crashed with 500 errors! Production is completely down for all paying customers.',
    },
    {
      label: 'Standard Password Reset',
      text: 'Hello, I forgot my account password and need a reset link sent to my email please.',
    },
    {
      label: 'Enterprise VIP Deal',
      text: 'We are evaluating an enterprise license for 350 engineers. We require custom SSO, HIPAA compliance, and an annual invoice.',
    },
    {
      label: 'Phishing Scam',
      text: 'CONGRATULATIONS! You won $10,000 in free Bitcoin! Click here to claim immediately: http://bit.ly/claim-crypto-free',
    },
    {
      label: 'Safe Community Post',
      text: 'Here is a recap of our team hackathon project built with Next.js and React Flow. We had great collaboration!',
    },
  ];

  return (
    <div className="bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs z-20">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold shrink-0">
          <MessageSquareText className="w-4 h-4 text-indigo-400" />
          <span>Workflow Test Input:</span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => onChangeInput(e.target.value)}
          disabled={isRunning}
          placeholder="Enter user inquiry or context payload for AI decisions..."
          className="w-full md:w-[460px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Quick sample chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Samples:
        </span>
        {quickSamples.map((sample) => (
          <button
            key={sample.label}
            type="button"
            disabled={isRunning}
            onClick={() => onChangeInput(sample.text)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-slate-800 transition-all"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
