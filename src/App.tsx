/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import BantDashboard from './components/BantDashboard';
import ShortlistDisplay from './components/ShortlistDisplay';
import { Message, BantState, GroundedSolution } from './types';
import { CheckCircle } from 'lucide-react';

const isAffirmativeResponse = (text: string): boolean => {
  const normalized = text.toLowerCase().trim();
  const affirmativeWords = [
    'yes', 'please', 'show', 'sure', 'shortlist', 'ok', 'okay', 
    'go ahead', 'recommend', 'do that', 'yup', 'yeah', 'yep', 
    'absolutely', 'sound good', 'sounds good', 'of course', 'fine',
    'list specific tools', 'list tools', 'match me'
  ];
  return affirmativeWords.some(word => normalized.includes(word));
};

const INITIAL_MESSAGE_TEXT = `Hello! I am **Qualifyr**, your collaborative B2B software advisory specialist. My goal is to help you select the ideal category of software for your project. 

Let's start from the ground up: **What specific problem or operational bottleneck are you trying to solve today?** Whether your current tools are slow, spreadsheets are messy, or information is siloed—let me know.`;

import DocumentQAWindow from './components/DocumentQAWindow';

export default function App() {
  const [activeTab, setActiveTab] = useState<'bant' | 'doc-qa'>('bant');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: INITIAL_MESSAGE_TEXT,
      createdAt: Date.now(),
    },
  ]);

  const [bantState, setBantState] = useState<BantState>({
    need: 'Gathering...',
    budget: 'Gathering...',
    authority: 'Gathering...',
    timeline: 'Gathering...',
    recommended_category: '',
    qualification_complete: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [solutions, setSolutions] = useState<GroundedSolution[]>([]);
  const [recommendationsMarkdown, setRecommendationsMarkdown] = useState<string>('');
  const [isGeneratingShortlist, setIsGeneratingShortlist] = useState(false);
  const [roiAsked, setRoiAsked] = useState(false);

  // File context
  const [attachedFileContent, setAttachedFileContent] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');

  // Document QA state
  const [docQaMessages, setDocQaMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Upload a document to start asking questions about it!', createdAt: Date.now() }
  ]);
  const [docQaDocument, setDocQaDocument] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isDocQaLoading, setIsDocQaLoading] = useState(false);

  // Handle extracting BANT XML from assistant message text
  const parseBantData = (responseText: string) => {
    try {
      const match = responseText.match(/<BANT_DATA>([\s\S]*?)<\/BANT_DATA>/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1].trim());
        setBantState((prev) => ({
          ...prev,
          need: parsed.need || prev.need,
          budget: parsed.budget || prev.budget,
          authority: parsed.authority || prev.authority,
          timeline: parsed.timeline || prev.timeline,
          recommended_category: parsed.recommended_category || prev.recommended_category,
          qualification_complete: parsed.qualification_complete !== undefined ? parsed.qualification_complete : prev.qualification_complete,
        }));
      }
    } catch (err) {
      console.error('Failed to parse incremental BANT state:', err);
    }
  };

  const runGroundedSearch = async (currentBant?: BantState, roiInput?: string) => {
    setIsGeneratingShortlist(true);
    setIsLoading(true);
    
    const activeBant = currentBant || bantState;

    try {
      const response = await fetch('/api/recommend-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bant_state: {
            need: activeBant.need,
            budget: activeBant.budget,
            authority: activeBant.authority,
            timeline: activeBant.timeline,
            recommended_category: activeBant.recommended_category,
            qualification_complete: true,
          },
          roi_input: roiInput
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const underlyingError = errJson?.error || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(`Failed to get search-grounded tool recommendations: ${underlyingError}`);
      }

      const data = await response.json();
      if (data) {
        if (Array.isArray(data.solutions)) {
          setSolutions(data.solutions);
        }
        setRecommendationsMarkdown(data.markdown || '');

        // Add the reformatted response to the messages list so user sees results in chat
        const resultMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          text: data.markdown || 'No specific solutions could be formatted. Please refer to identified requirements.',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, resultMsg]);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations pipeline:', error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: `**System Error during search grounding**: ${error?.message || 'Failed during search pipeline execution.'}`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGeneratingShortlist(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      createdAt: Date.now(),
    };

    // 1. Intercept affirmative replies when qualification is complete
    if (bantState.qualification_complete && isAffirmativeResponse(userText) && !roiAsked) {
      setMessages((prev) => [...prev, userMsg]);
      setRoiAsked(true);
      
      const roiQuestionMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `One more thing that'll help me show you the real value here — roughly how much time per week does your team currently lose to this problem, and what's the average hourly cost of someone on that team (ROI)? (Totally fine to skip this if you're not sure — I can still give you recommendations without it.)`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, roiQuestionMsg]);
      return;
    }

    if (bantState.qualification_complete && roiAsked) {
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const statusMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `**Research Engine Activated!** I am initiating a real-time Google Search to query and analyze live vendors in the **${bantState.recommended_category}** space that fit your budget of **${bantState.budget}** and timeline. One moment while I retrieve live options...`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, statusMsg]);

      await runGroundedSearch(undefined, userText);
      return;
    }

    // 2. Normal conversation behavior with BANT assistant
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build brief context if file is attached
      let messageToSend = userText;
      if (attachedFileContent && messages.length <= 2) {
        messageToSend = `[CONTEXT ATTACHMENT: This is our project brief/RFP: "${attachedFileName}" with requirements content:\n${attachedFileContent}\n]\n\nUser message: ${userText}`;
      }

      const historyForApi = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          history: historyForApi,
        }),
      });

      if (!res.ok) {
        throw new Error('Assistant API error');
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'I was unable to retrieve a reply.',
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      parseBantData(assistantMsg.text);

    } catch (error: any) {
      console.error('Failed to communicate with advisor:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `**System Error**: ${error?.message || 'The server is sleeping or starting up. Please try again soon!'}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocQaSendMessage = async (text: string) => {
    if (!text.trim() || !docQaDocument) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };

    setDocQaMessages((prev) => [...prev, userMsg]);
    setIsDocQaLoading(true);

    try {
      // Filter out the initial placeholder message and the user's new message
      const historyForApi = docQaMessages
        .filter(m => m.id !== '1')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/document-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: historyForApi,
          document: {
            inlineData: {
              data: docQaDocument.data,
              mimeType: docQaDocument.mimeType,
            }
          }
        }),
      });

      if (!res.ok) throw new Error('Document QA API error');

      const data = await res.json();

      setDocQaMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.text || 'No response.',
          createdAt: Date.now(),
        },
      ]);
    } catch (error: any) {
      console.error('Error in QA chat:', error);
      setDocQaMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `**System Error**: ${error?.message || 'Failed to chat with document.'}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsDocQaLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: INITIAL_MESSAGE_TEXT,
        createdAt: Date.now(),
      },
    ]);
    setBantState({
      need: 'Gathering...',
      budget: 'Gathering...',
      authority: 'Gathering...',
      timeline: 'Gathering...',
      recommended_category: '',
      qualification_complete: false,
    });
    setSolutions([]);
    setRecommendationsMarkdown('');
    setAttachedFileContent('');
    setAttachedFileName('');
    setRoiAsked(false);
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary font-sans antialiased overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Interactive/BANT Extraction Progress Dashboard */}
        <div className="w-[340px] md:w-[400px] shrink-0 hidden lg:block h-full bg-bg-surface border-r border-border-subtle">
          <BantDashboard
            bantState={bantState}
            onRestart={handleRestart}
            isLoading={isLoading}
          />
        </div>

        {/* Right Active Conversation Stream & Dynamic Layouts */}
        <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden relative">
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-6 border-b border-border-subtle pb-2">
                <button
                  onClick={() => setActiveTab('bant')}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                    activeTab === 'bant' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  BANT Advisor
                </button>
                <button
                  onClick={() => setActiveTab('doc-qa')}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                    activeTab === 'doc-qa' ? 'border-emerald-600 text-success' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Document Q&A
                </button>
              </div>

              {/* Main Chat Hub Container with subtle shadow */}
              <div className="bg-bg-surface rounded-lg shadow-sm border border-border-subtle overflow-hidden h-[540px] md:h-[650px]">
                {activeTab === 'bant' ? (
                  <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    onClearChat={handleRestart}
                    attachedFileContent={attachedFileContent}
                    attachedFileName={attachedFileName}
                    onAttachFile={(name, content) => {
                      setAttachedFileName(name);
                      setAttachedFileContent(content);
                    }}
                    onClearFile={() => {
                      setAttachedFileName('');
                      setAttachedFileContent('');
                    }}
                    qualificationComplete={bantState.qualification_complete}
                  />
                ) : (
                  <DocumentQAWindow
                    messages={docQaMessages}
                    onSendMessage={handleDocQaSendMessage}
                    isLoading={isDocQaLoading}
                    document={docQaDocument}
                    onUploadDocument={(name, data, mimeType) => {
                       setDocQaDocument({ name, data, mimeType });
                       setDocQaMessages([{ id: Date.now().toString(), role: 'assistant', text: `Document "${name}" uploaded successfully! Ask me anything about it.`, createdAt: Date.now() }]);
                    }}
                    onClearDocument={() => {
                       setDocQaDocument(null);
                       setDocQaMessages([{ id: Date.now().toString(), role: 'assistant', text: 'Upload a document to start asking questions about it!', createdAt: Date.now() }]);
                    }}
                  />
                )}
              </div>

              {/* Dynamic Vendor Shortlist - Shows up when BANT qualification complete */}
              {(bantState.qualification_complete || solutions.length > 0) && (
                <div className="bg-bg-surface rounded-lg border border-border-subtle p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-md font-bold text-text-primary">Qualifyr Search Certification</h2>
                      <p className="text-xs text-text-secondary">Google Grounding analyzed active buyers constraints with real-time web verification.</p>
                    </div>
                  </div>
                  
                  <ShortlistDisplay
                    solutions={solutions}
                    markdown={recommendationsMarkdown}
                    isLoading={isGeneratingShortlist}
                    category={bantState.recommended_category || 'Identified Category'}
                  />
                </div>
              )}

              {/* Responsive Dashboard view for Tablet/Mobile where left-drawer is hidden */}
              <div className="lg:hidden bg-bg-surface border border-border-subtle rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-bold text-text-primary mb-4 font-sans tracking-tight">Active BANT Extraction Parameter Tracker</h3>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-bg-primary rounded-lg border border-border-subtle">
                    <div className="text-xs font-semibold text-blue-700">Need</div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{bantState.need}</div>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-lg border border-border-subtle">
                    <div className="text-xs font-semibold text-success">Budget</div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{bantState.budget}</div>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-lg border border-border-subtle">
                    <div className="text-xs font-semibold text-warning">Authority</div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{bantState.authority}</div>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-lg border border-border-subtle">
                    <div className="text-xs font-semibold text-purple-700">Timeline</div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{bantState.timeline}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
