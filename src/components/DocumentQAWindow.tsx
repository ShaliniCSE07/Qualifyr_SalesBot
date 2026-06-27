/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, Trash2, Info } from 'lucide-react';
import { Message } from '../types';

interface DocumentQAWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  document: { name: string; data: string; mimeType: string } | null;
  onUploadDocument: (name: string, data: string, mimeType: string) => void;
  onClearDocument: () => void;
}

export default function DocumentQAWindow({
  messages,
  onSendMessage,
  isLoading,
  document,
  onUploadDocument,
  onClearDocument,
}: DocumentQAWindowProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !document) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      onUploadDocument(file.name, base64Data, file.type || 'text/plain');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Top Bar */}
      <div className="bg-bg-surface border-b border-border-subtle px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              QA
            </div>
          </div>
          <div>
            <h3 className="font-bold font-sans text-text-primary flex items-center gap-1.5 text-sm">
              Document Q&A
            </h3>
            <p className="text-[10px] text-text-muted font-mono tracking-tight uppercase">Ask questions about any document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document ? (
            <div className="flex items-center gap-2 bg-bg-elevated border border-border-subtle text-success font-sans text-xs px-2.5 py-1.5 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate font-medium">{document.name}</span>
              <button onClick={onClearDocument} className="hover:text-red-500 font-bold ml-1 text-[11px]" title="Remove document">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-success hover:bg-emerald-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.docx,.csv"
            className="hidden"
          />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-lg p-4.5 text-left ${isUser ? 'bg-bg-elevated border border-border-subtle text-text-primary rounded-br-none font-sans font-medium shadow-sm' : 'bg-transparent text-text-primary rounded-bl-none'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider text-accent`}>
                    {isUser ? 'You' : 'Doc Assistant'}
                  </span>
                </div>
                <p className="text-sm font-sans break-words whitespace-pre-line leading-relaxed">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-transparent rounded-lg rounded-bl-none p-4.5 flex items-center gap-3">
               <span className="text-xs font-mono text-text-muted uppercase tracking-widest leading-none">Reading Document...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-bg-surface border-t border-border-subtle p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || !document}
            placeholder={
              document 
                ? "Ask a question about the document..." 
                : "Please upload a document first to start asking questions."
            }
            className="flex-1 text-sm bg-bg-primary border border-border-subtle rounded-lg px-4.5 py-3 focus:outline-none focus:ring-2 focus:outline-none focus:ring-accent focus:ring-accent/20 focus:border-emerald-500 transition-all text-text-primary placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || !document}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white p-3 rounded-lg transition-all shadow-md flex items-center justify-center shrink-0 w-11 h-11"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
