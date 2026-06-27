/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, DollarSign, UserCheck, Calendar, CheckCircle2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { BantState } from '../types';

interface BantDashboardProps {
  bantState: BantState;
  onRestart: () => void;
  isLoading: boolean;
}

export default function BantDashboard({ bantState, onRestart, isLoading }: BantDashboardProps) {
  const dimensions = [
    {
      key: 'need' as const,
      label: 'Need',
      icon: Target,
      description: 'The core pain point or problem being solved',
      color: 'border-border-subtle bg-bg-elevated text-accent',
      fillColor: 'bg-accent',
    },
    {
      key: 'budget' as const,
      label: 'Budget',
      icon: DollarSign,
      description: 'Price threshold or set budget constraints',
      color: 'border-border-subtle bg-bg-elevated text-success',
      fillColor: 'bg-accent',
    },
    {
      key: 'authority' as const,
      label: 'Authority',
      icon: UserCheck,
      description: 'Who has the decision-making authorization',
      color: 'border-warning/30 bg-bg-elevated text-warning',
      fillColor: 'bg-amber-600',
    },
    {
      key: 'timeline' as const,
      label: 'Timeline',
      icon: Calendar,
      description: 'Target implement or deployment window',
      color: 'border-border-subtle bg-bg-elevated text-accent',
      fillColor: 'bg-accent',
    },
  ];

  // Calculate completion percentage
  const totalKeywords = ['need', 'budget', 'authority', 'timeline'];
  const completedCount = totalKeywords.filter(
    (key) => bantState[key as keyof BantState] && bantState[key as keyof BantState] !== 'Gathering...'
  ).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <div className="flex flex-col h-full bg-bg-surface border-r border-border-subtle p-6 overflow-y-auto">
      {/* Brand Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#0b0c0f] text-text-primary rounded-lg p-2.5 flex items-center justify-center shadow-md shadow-black/20 hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-text-primary flex items-center gap-2">
              Qualifyr
              <span className="text-[10px] bg-bg-elevated text-accent font-mono px-2 py-0.5 rounded-full font-medium">BETA</span>
            </h1>
            <p className="text-xs text-text-secondary font-sans">B2B Software Advisory Assistant</p>
          </div>
        </div>
        <button
          onClick={onRestart}
          title="Restart conversation"
          className="p-2 hover:bg-bg-primary text-text-muted hover:text-text-secondary rounded-lg transition-colors border border-border-subtle shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Metric */}
      <div id="progress-card" className="bg-bg-primary rounded-lg p-5 mb-6 border border-border-subtle relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-text-primary">Qualification Score</span>
          <span className="text-xs font-mono font-medium text-text-secondary bg-bg-surface border border-border-subtle px-2.5 py-1 rounded-full">
            {completedCount}/4 Completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-bg-elevated/80 rounded-full h-3 mb-2.5 overflow-hidden">
          <div
            className="bg-accent h-3 rounded-full transition-all duration-700 ease-out shadow-sm shadow-accent/15"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-text-muted font-mono">
          <span>0% CHAT UNQUALIFIED</span>
          <span>100% READY FOR SPECIFICS</span>
        </div>
      </div>

      {/* Dimensions Trackers */}
      <div className="flex-1 space-y-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">BANT Live Extraction</h2>
        
        {dimensions.map((dim) => {
          const rawValue = bantState[dim.key];
          const isGathered = rawValue && rawValue !== 'Gathering...';

          return (
            <div
              key={dim.key}
              id={`dimension-${dim.key}`}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                isGathered
                  ? 'bg-bg-primary/40 border-border-subtle shadow-sm'
                  : 'bg-bg-surface border-dashed border-border-subtle'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${dim.color} shrink-0`}>
                  <dim.icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary leading-none">
                      {dim.label}
                    </span>
                    {isGathered ? (
                      <span className="flex items-center gap-1.5 text-success font-medium text-xs font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        Acquired
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-accent text-xs font-mono animate-pulse">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                        Listening...
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-text-muted mt-1 leading-snug">
                    {dim.description}
                  </p>

                  <div className="mt-3">
                    {isGathered ? (
                      <div className="text-xs bg-bg-surface border border-border-subtle rounded-lg p-2.5 text-text-primary font-sans shadow-sm leading-relaxed whitespace-pre-line text-left">
                        {rawValue}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted italic bg-bg-primary/50 border border-dotted border-border-subtle rounded-lg p-2.5 text-left">
                        Awaiting buyer input...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="flex items-start gap-2 text-text-muted bg-bg-primary/50 border border-border-subtle p-3 rounded-lg text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
          <p className="leading-normal">
            Qualifyr dynamically analyzes raw dialog turns server-side to extract qualification parameters. Once all 4 parameters are resolved, a tailored recommendation structure generates automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
