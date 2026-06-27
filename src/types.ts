/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
}

export interface BantState {
  need: string;
  budget: string;
  authority: string;
  timeline: string;
  recommended_category: string;
  qualification_complete: boolean;
}

export interface SuggestedTool {
  name: string;
  description: string;
  pricing: string;
  pros: string[];
  cons: string[];
  website?: string;
}

export interface GroundedSolution {
  name: string;
  best_for?: string;
  pricing: string;
  fit_reason: string;
  watch_out_for?: string;
  source_url: string;
  roi_current_cost?: string;
  roi_tool_cost?: string;
  roi_net_benefit?: string;
  roi_payback_estimate?: string;
}

export interface CategoryDetail {
  name: string;
  description: string;
  iconName: string;
  averagePricing: string;
  commonTools: string[];
}
