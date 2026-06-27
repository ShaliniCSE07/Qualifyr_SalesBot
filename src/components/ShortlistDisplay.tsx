/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GroundedSolution } from '../types';
import { ExternalLink, Check, AlertTriangle, Cpu, DollarSign, Info, FileSearch } from 'lucide-react';

interface ShortlistDisplayProps {
  solutions: GroundedSolution[];
  markdown?: string;
  isLoading: boolean;
  category: string;
}

export default function ShortlistDisplay({ solutions, markdown, isLoading, category }: ShortlistDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-primary border border-border-subtle rounded-lg p-8 flex flex-col items-center justify-center space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-accent text-[#14171C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-accent text-[#14171C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-accent text-[#14171C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm font-sans font-medium text-text-secondary animate-pulse">
          Qualifyr Research Engine is querying live Google Search results for real tools matching your profile...
        </p>
      </div>
    );
  }

  if (!solutions || solutions.length === 0) {
    return null;
  }

  // Helper to extract the bottom line from the markdown text
  const getBottomLine = (mdText?: string) => {
    if (!mdText) return null;
    const bottomLineIndex = mdText.toLowerCase().indexOf('## bottom line');
    if (bottomLineIndex !== -1) {
      const part = mdText.substring(bottomLineIndex + 14).trim();
      // Stop before SOLUTIONS_DATA block starts
      const tagsIndex = part.indexOf('<SOLUTIONS_DATA>');
      if (tagsIndex !== -1) {
        return part.substring(0, tagsIndex).trim();
      }
      return part;
    }
    return null;
  };

  const bottomLine = getBottomLine(markdown);

  return (
    <div id="grounded-solutions" className="space-y-6 text-left animate-fade-in">
      <div className="border-b border-border-subtle pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Qualifyr Search-Grounded Solutions
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Real, currently available platforms in the <span className="font-semibold text-text-primary">{category}</span> category discovered via active Google search grounding.
          </p>
        </div>
        <span className="self-start md:self-center text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 bg-bg-elevated text-accent rounded-lg shrink-0">
          Google Grounding Enabled
        </span>
      </div>

      {/* Solutions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {solutions.map((sol, index) => (
          <div
            key={index}
            className={`bg-bg-surface border border-border-subtle hover:border-accent/30 rounded-lg p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between ${sol.roi_net_benefit ? 'border-l-4 border-l-accent' : ''}`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-text-primary font-sans tracking-tight hover:text-accent transition-colors">
                  {sol.name}
                </h4>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-bg-elevated text-success border border-border-subtle rounded">
                  {sol.pricing}
                </span>
              </div>

              {sol.best_for && (
                <div className="text-[11px] font-medium text-accent bg-bg-elevated/40 border border-accent/20/20 px-2 py-1 rounded inline-block mb-3">
                  Best for: {sol.best_for}
                </div>
              )}

              {/* Fit Reason */}
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {sol.fit_reason}
              </p>

              {/* Drawbacks / Limitations */}
              {sol.watch_out_for && (
                <div className="bg-bg-elevated border border-warning/30 rounded-lg p-2.5 mb-3">
                  <span className="text-[10px] font-bold text-warning uppercase tracking-wider block mb-1">
                    Watch out for
                  </span>
                  <p className="text-[11px] text-warning leading-normal">
                    {sol.watch_out_for}
                  </p>
                </div>
              )}

              {/* ROI Section */}
              {sol.roi_net_benefit && (
                <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 mb-3">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Estimated ROI
                  </span>
                  <div className="space-y-1.5 text-[11px] text-text-primary leading-normal">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Problem Cost:</span>
                      <span className="font-semibold font-mono">{sol.roi_current_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tool Cost:</span>
                      <span className="font-semibold font-mono">{sol.roi_tool_cost}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-subtle pt-1.5 mt-1.5">
                      <span className="text-text-primary font-bold">Net Benefit:</span>
                      <span className="font-bold text-success font-mono">{sol.roi_net_benefit}</span>
                    </div>
                    {sol.roi_payback_estimate && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Payback Time:</span>
                        <span className="font-semibold font-mono">{sol.roi_payback_estimate}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-text-muted mt-2 opacity-80 leading-tight">
                    * Estimate based on provided inputs — actual results may vary
                  </p>
                </div>
              )}
            </div>

            {/* Source and Explore button */}
            <div className="pt-3 border-t border-border-subtle mt-2 flex items-center justify-between">
              <span className="text-[10px] text-text-muted font-sans flex items-center gap-1">
                <FileSearch className="w-3 h-3" /> Search verified
              </span>
              {sol.source_url && (
                <a
                  href={sol.source_url}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-text-secondary underline hover:text-accent transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent rounded-sm"
                >
                  Verify Source
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grounded bottom line */}
      {bottomLine && (
        <div className="bg-bg-primary border border-border-subtle rounded-lg p-4.5 mt-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest font-mono flex items-center gap-1.5 mb-2">
            <Info className="w-4 h-4 text-success" />
            Bottom Line Advisor Recommendation
          </h4>
          <p className="text-xs text-text-primary leading-relaxed font-sans whitespace-pre-wrap">
            {bottomLine}
          </p>
        </div>
      )}
    </div>
  );
}
