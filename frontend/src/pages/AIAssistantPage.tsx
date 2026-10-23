import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import {
  Bot, Send, Sparkles, User as UserIcon, RefreshCw,
  HelpCircle, CheckCircle, Shield, FileText, ArrowRight, ShieldCheck
} from 'lucide-react';

interface AIAssistantPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: any;
  sources?: string[];
  timestamp: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEmployee = currentUser?.role === 'employee';

  const employeePrompts = [
    'How was my take-home salary calculated?',
    'What deductions were applied to my salary?',
    'Why was my salary different this month?',
    'How much approved leave do I have remaining?',
    'Where can I find my latest payslip?'
  ];

  const adminPrompts = [
    'Summarize the current payroll audit findings.',
    'Which employees have payroll discrepancies?',
    'Why did total payroll increase this month?',
    'Show pending leave requests.',
    'Explain the difference between gross salary and net salary.'
  ];

  const activePrompts = isEmployee ? employeePrompts : adminPrompts;

  useEffect(() => {
    const welcomeText = isEmployee
      ? `Hello **${currentUser?.full_name}**! I am your personal PayPilot AI Assistant. I can explain your exact salary calculation, tax deductions, leave balances, and payslips using approved company payroll records.`
      : `Hello **${currentUser?.full_name}** (${currentUser?.designation})! I am your PayPilot AI Assistant. I can help analyze company payroll variance, summarize open audit discrepancies, review pending leave applications, and explain statutory deductions.`;

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant(textToSend);
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        data: res.data,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          text: `I encountered an issue processing your query: ${err.message}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4 flex flex-col h-[calc(100vh-57px)]">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                PayPilot Assistant
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Ground-Truth AI
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isEmployee
                ? 'Role-restricted to personal payroll and leave records'
                : 'Enterprise payroll analysis and audit intelligence'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([]);
            setTimeout(() => {
              setMessages([
                {
                  id: 'msg_welcome',
                  sender: 'assistant',
                  text: 'Chat history cleared. How may I assist you with payroll today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }, 100);
          }}
          className="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700"
        >
          Clear Chat
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Suggested:</span>
        {activePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="cursor-pointer text-xs px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? currentUser?.full_name?.charAt(0) || 'U' : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-lg p-3.5 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {/* Render markdown lines */}
                <div className="prose prose-xs max-w-none space-y-1.5">
                  {m.text.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="text-sm font-bold text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold text-slate-900">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>;
                    }
                    if (line.trim() === '') {
                      return <div key={i} className="h-1" />;
                    }
                    return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>') }} />;
                  })}
                </div>

                {/* Sources Attribution */}
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Verified via: {m.sources.join(' &bull; ')}</span>
                  </div>
                )}

                <div className="text-[10px] pt-0.5 text-right text-slate-400">
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
              <span>Querying verified company payroll engine records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0 flex items-center gap-2">
        <input
          type="text"
          placeholder={
            isEmployee
              ? 'Ask anything about your take-home salary, deductions, or leaves...'
              : 'Ask about payroll cost variance, audit discrepancies, or pending leaves...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-3 py-2 text-xs rounded-md focus:outline-none text-slate-800"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
