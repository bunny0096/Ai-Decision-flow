'use client';

import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { CustomEdgeData } from '@/types/workflow';

export const DecisionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    sourceHandleId,
    selected,
  }: EdgeProps) => {
    const edgeData = (data || {}) as CustomEdgeData;

    // Determine if YES or NO branch
    const branch =
      edgeData.branch ||
      (sourceHandleId?.toLowerCase() === 'no' ? 'NO' : 'YES');

    const isYes = branch === 'YES';
    const isActive = edgeData.active || edgeData.status === 'active';
    const isDimmed = edgeData.status === 'dimmed';

    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });

    // Color definitions
    const baseColor = isYes ? '#10b981' : '#f43f5e';
    const strokeWidth = isActive ? 3.5 : selected ? 3 : 2;

    let pathClassName = '';
    if (isActive) {
      pathClassName = isYes ? 'edge-animated-yes' : 'edge-animated-no';
    } else if (isDimmed) {
      pathClassName = 'edge-dimmed';
    }

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          className={pathClassName}
          style={{
            stroke: baseColor,
            strokeWidth,
            transition: 'all 0.3s ease',
          }}
        />

        {/* Center Edge Badge */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`transition-all duration-300 ${
              isDimmed ? 'opacity-30 scale-90' : 'opacity-100 scale-100'
            }`}
          >
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border shadow-lg backdrop-blur-md cursor-pointer transition-all ${
                isYes
                  ? isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.8)] scale-110'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900'
                  : isActive
                  ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.8)] scale-110'
                  : 'bg-rose-950/80 text-rose-300 border-rose-600/60 hover:bg-rose-900'
              }`}
            >
              <span>{branch}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

DecisionEdge.displayName = 'DecisionEdge';
