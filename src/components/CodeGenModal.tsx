'use client';

import { useState, useCallback } from 'react';
import type { ApiRequest } from '@/types';
import { generateCode, type CodeLanguage } from '@/lib/codegen';

interface CodeGenModalProps {
  open: boolean;
  onClose: () => void;
  request: ApiRequest;
}

export function CodeGenModal({ open, onClose, request }: CodeGenModalProps) {
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('curl');
  const [copied, setCopied] = useState(false);

  const results = generateCode(request);
  const active = results.find((r) => r.language === activeLanguage) || results[0];

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [active.code]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Generate Code</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-5 gap-1">
          {results.map((r) => (
            <button
              key={r.language}
              onClick={() => setActiveLanguage(r.language)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeLanguage === r.language
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-900 rounded-b-xl">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
            {active.code}
          </pre>
        </div>
      </div>
    </div>
  );
}
