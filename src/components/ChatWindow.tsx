/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Building2, Trash2, HelpCircle, FileText, Upload, Plus, Check, Info } from 'lucide-react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  // File Context Support
  attachedFileContent: string;
  attachedFileName: string;
  onAttachFile: (name: string, content: string) => void;
  onClearFile: () => void;
  qualificationComplete?: boolean;
}

// Custom simple markdown formatter to cleanly compile list bulletpoints, bold keywords, and headers
function FormattedMessage({ text }: { text: string }) {
  // Strip hidden <BANT_DATA> and <SOLUTIONS_DATA> XML blocks
  const cleanText = text
    .replace(/<BANT_DATA>([\s\S]*?)<\/BANT_DATA>/gi, '')
    .replace(/<SOLUTIONS_DATA>([\s\S]*?)<\/SOLUTIONS_DATA>/gi, '')
    .trim();

  // Split into blocks by double line-breaks
  const paragraphs = cleanText.split('\n\n');

  return (
    <div className="space-y-3 font-sans text-sm leading-relaxed text-text-primary">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        
        // Check if the current block represents a list
        const isBulletList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-left my-2">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^[-*]\s+/, '');
                return <li key={lIdx}>{formatInlines(itemText)}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-left leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInlines(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// Convert bold markdown (**text** or *text*) to JSX nodes
function formatInlines(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*)/g;
  const splitParts = text.split(regex);

  splitParts.forEach((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      parts.push(
        <strong key={idx} className="font-bold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    } else {
      // Check for single asterisks too
      const subRegex = /(\*.*?\*)/g;
      const subParts = part.split(subRegex);
      subParts.forEach((subPart, sIdx) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          parts.push(
            <em key={`${idx}-${sIdx}`} className="italic font-medium text-text-primary">
              {subPart.slice(1, -1)}
            </em>
          );
        } else {
          parts.push(subPart);
        }
      });
    }
  });

  return parts;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  attachedFileContent,
  attachedFileName,
  onAttachFile,
  onClearFile,
  qualificationComplete = false,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [pastedRequirements, setPastedRequirements] = useState('');
  const [docName, setDocName] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Quick reply prompt suggestions based on current BANT missing parameters or qualification phase
  const suggestions = qualificationComplete
    ? [
        "Yes, please shortlist matching tools!",
        "Sure, show me specific recommendations",
        "Absolutely, let's look at real solutions"
      ]
    : [
        "I'm the primary decision-maker",
        "We need buy-in from CTO & CFO",
        "Under $300/month",
        "Flexible on budget (TBD)",
        "Need it done in 30 days",
        "Just researching for next calendar year",
        "Our current CRM spreadsheets are chaotic"
      ];

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  // Custom pasted requirement submission
  const handleContextSubmit = () => {
    if (!pastedRequirements.trim()) return;
    const name = docName.trim() || "Pasted RFP Requirements";
    onAttachFile(name, pastedRequirements);
    setPastedRequirements('');
    setDocName('');
    setShowDocUpload(false);
  };

  // Handle uploaded text/json file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onAttachFile(file.name, content);
      setShowDocUpload(false);
    };
    reader.readAsText(file);
  };

  return (
    <div id="chat-hub-panel" className="flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Top Advisory Bar */}
      <div className="bg-bg-surface border-b border-border-subtle px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/10">
              🤝
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-bg-elevated0 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="font-bold font-sans text-text-primary flex items-center gap-1.5 text-sm">
              Advisor Scout
              <span className="text-[10px] bg-bg-elevated text-success font-mono font-medium px-2 py-0.5 rounded-full">ACTIVE</span>
            </h3>
            <p className="text-[10px] text-text-muted font-mono tracking-tight uppercase">Ready to classify & qualify</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* File Context indicator badge */}
          {attachedFileName && (
            <div className="hidden sm:flex items-center gap-2 bg-bg-elevated border border-accent/20 text-accent font-sans text-xs px-2.5 py-1.5 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate font-medium">{attachedFileName}</span>
              <button onClick={onClearFile} className="hover:text-red-500 font-bold ml-1 text-[11px]" title="Remove document context">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowDocUpload(!showDocUpload)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border ${
              attachedFileName 
                ? 'bg-bg-elevated/50 border-accent/30 text-accent' 
                : 'bg-bg-surface border-border-subtle text-text-secondary hover:bg-bg-primary hover:border-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{attachedFileName ? 'Change Doc' : 'Add Brief / RFP'}</span>
          </button>

          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-2 bg-red-50/60 hover:bg-red-50 border border-red-100/50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Slide-out RFP / Requirement Context Drawer */}
      {showDocUpload && (
        <div className="bg-bg-surface border-b border-border-subtle p-5 shadow-inner animate-slide-down text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-accent" />
                Add RFP or Client Requirements Text
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">Let Qualifyr parse documents or pastes for highly customized matches.</p>
            </div>
            <button 
              onClick={() => setShowDocUpload(false)}
              className="text-text-muted hover:text-text-secondary text-xs font-bold bg-bg-primary border border-border-subtle px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Trigger */}
            <div className="border-2 border-dashed border-border-subtle hover:border-indigo-300 rounded-lg p-6 flex flex-col items-center justify-center bg-bg-primary/50 hover:bg-bg-primary transition-colors">
              <Upload className="w-8 h-8 text-text-muted mb-2" />
              <p className="text-xs font-semibold text-text-primary">Upload RFP/Brief File</p>
              <p className="text-[10px] text-text-muted mt-1 mb-3">Plain text, .txt, .json, markdown files</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-bg-surface border border-border-subtle shadow-sm text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-bg-primary transition"
              >
                Select File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.json,.md,.xml,.csv"
                className="hidden"
              />
            </div>

            {/* Paste Context */}
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="RFP Title (Optional)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="text-xs bg-bg-primary border border-border-subtle rounded-lg p-2 focus:outline-none focus:ring-2 focus:outline-none focus:ring-accent focus:outline-none focus:ring-accent focus:ring-accent"
              />
              <textarea
                placeholder="Paste system architecture, must-have user limits, security prerequisites, or budget outlines here..."
                rows={4}
                value={pastedRequirements}
                onChange={(e) => setPastedRequirements(e.target.value)}
                className="text-xs bg-bg-primary border border-border-subtle rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:outline-none focus:ring-accent focus:outline-none focus:ring-accent focus:ring-accent font-sans"
              />
              <button
                onClick={handleContextSubmit}
                disabled={!pastedRequirements.trim()}
                className="bg-accent text-[#14171C] hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-xs px-3 py-2 rounded-lg self-end transition"
              >
                Attach Paste Context
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-lg p-4.5 text-left ${
                  isUser
                    ? 'bg-bg-elevated border border-border-subtle text-text-primary rounded-br-none font-sans font-medium shadow-sm'
                    : 'bg-transparent text-text-primary rounded-bl-none'
                }`}
              >
                {/* Speaker indicator/badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider text-accent`}>
                    {isUser ? 'Buyer' : 'Qualifyr'}
                  </span>
                  <span className={`text-[9px] font-mono ${isUser ? 'text-indigo-200' : 'text-text-muted'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser ? (
                  <p className="text-sm font-sans break-words whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </p>
                ) : (
                  <FormattedMessage text={msg.text} />
                )}
              </div>
            </div>
          );
        })}

        {/* Typing / Thinking Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-transparent rounded-lg rounded-bl-none p-4.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-bg-elevated0 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-bg-elevated0 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-bg-elevated0 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-mono text-text-muted uppercase tracking-widest leading-none">Analysing BANT...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Multi-reply Quick Choices */}
      <div className="border-t border-border-subtle bg-bg-surface p-3 flex flex-wrap gap-1.5 justify-center">
        {suggestions.map((sText, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(sText)}
            disabled={isLoading}
            className="text-[11px] font-semibold text-text-secondary hover:text-accent bg-bg-primary border border-border-subtle hover:border-accent/30 px-3 py-1.5 rounded-full transition-all duration-150 disabled:opacity-40 select-none cursor-pointer"
          >
            {sText}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-bg-surface border-t border-border-subtle p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              attachedFileName 
                ? `Context active! Discuss parameters...` 
                : "Ask about pricing, authority matrices, timeline constraints, or list your problem..."
            }
            className="flex-1 text-sm bg-bg-primary border border-border-subtle rounded-lg px-4.5 py-3 focus:outline-none focus:ring-2 focus:outline-none focus:ring-accent focus:ring-accent/20 focus:border-indigo-500 transition-all text-text-primary placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-white p-3 rounded-lg transition-all shadow-md shadow-slate-900/10 flex items-center justify-center shrink-0 w-11 h-11"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {/* Dynamic Context Notification */}
        {attachedFileName && (
          <div className="flex items-center gap-2 mt-2 px-1 text-[10px] text-text-muted font-sans">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Currently optimizing solutions with context from: <strong>{attachedFileName}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
