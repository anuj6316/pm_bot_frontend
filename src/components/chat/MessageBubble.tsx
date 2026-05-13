import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import {
  Wrench, Loader2, Copy, CheckCheck,
  ThumbsUp, ThumbsDown, RotateCcw, ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ChatMessage } from '@/src/hooks/useChatWebSocket';

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); })}
      title="Copy"
      className={cn('p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors', className)}
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function BotActions({ text }: { text: string }) {
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  return (
    <div className="flex items-center gap-0.5 mt-2">
      <CopyBtn text={text} />
      <button onClick={() => setLiked(liked === 'up' ? null : 'up')} title="Good response"
        className={cn('p-1.5 rounded-lg transition-colors', liked === 'up' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setLiked(liked === 'down' ? null : 'down')} title="Bad response"
        className={cn('p-1.5 rounded-lg transition-colors', liked === 'down' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
      <button title="Regenerate" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function MessageBubble({ msg, isSending }: { msg: ChatMessage, isSending: boolean }) {
  // Tool call logic
  if (msg.type === 'tool_call') return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start my-1 w-full relative group">
      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 px-1 py-1">
        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <Wrench className="w-3.5 h-3.5 opacity-60" />}
        <span>Used <span className="font-mono text-[10px]">{msg.toolName}</span></span>
        {isSending && <span className="ml-1 opacity-60 animate-pulse text-[10px]">Processing...</span>}
      </div>
    </motion.div>
  );

  // Tool result
  if (msg.type === 'tool_result') {
    const isError = /error|exception|failed|traceback/i.test(msg.text.substring(0, 100));
    const ok = !isError;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start w-full mb-3">
        <details className={cn("group border border-gray-100/60 rounded-xl bg-gray-50/50 text-[11px] font-mono overflow-hidden transition-colors hover:bg-gray-50", !ok && "border-red-100 bg-red-50/50")}>
          <summary className="px-3 py-1.5 flex items-center gap-2 cursor-pointer outline-none list-none [&::-webkit-details-marker]:hidden text-gray-500 group-hover:text-gray-700 transition-colors select-none">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform opacity-50" />
            <span className={cn(ok ? '' : 'text-red-500 font-medium')}>
              {ok ? 'Tool Output (Success)' : 'Tool Output (Logs)'}
            </span>
          </summary>
          <motion.div initial={false} className="p-3 border-t border-gray-100/50 bg-white max-w-xl overflow-x-auto rounded-b-xl shadow-inner">
            <pre className={cn("whitespace-pre-wrap break-words leading-relaxed", ok ? "text-gray-500" : "text-red-600")}>{msg.text}</pre>
          </motion.div>
        </details>
      </motion.div>
    );
  }

  // Error logic
  if (msg.type === 'error') return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-sm">{msg.text}</motion.div>
  );

  // User message
  if (msg.type === 'user') return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.2 }} className="flex justify-end mb-4">
      <div className="max-w-[70%] bg-[#F4F4F4] text-gray-900 rounded-[22px] px-5 py-3 text-sm leading-relaxed shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        {msg.text}
      </div>
    </motion.div>
  );

  // Default Assistant logic
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start w-full relative mb-6">
      <div className="text-gray-900 text-sm leading-relaxed w-full">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <p className="font-bold text-base mb-2 mt-4">{children}</p>,
            h2: ({ children }) => <p className="font-bold text-sm mb-1.5 mt-3">{children}</p>,
            h3: ({ children }) => <p className="font-semibold text-sm mb-1 mt-2">{children}</p>,
            p:  ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
            hr: () => <hr className="border-gray-200/50 my-4" />,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-apple-blue underline underline-offset-2 hover:opacity-75 transition-opacity">{children}</a>,
            code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
              inline
                ? <code className="bg-gray-100 text-apple-blue font-mono text-[11px] px-1.5 py-0.5 rounded-md" {...props}>{children}</code>
                : <code className="block font-mono text-[11px]" {...props}>{children}</code>,
            pre: ({ children }) => (
              <pre className="bg-gray-50 border border-gray-200/50 rounded-[18px] p-4 my-3 overflow-x-auto text-[11px] font-mono leading-relaxed shadow-sm">{children}</pre>
            ),
          }}
        >
          {msg.text}
        </ReactMarkdown>
        {msg.isStreaming && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block w-[3px] h-[14px] bg-gray-400 opacity-80 animate-pulse ml-0.5 align-middle rounded-sm" />
        )}
      </div>
      {!msg.isStreaming && msg.text && <BotActions text={msg.text} />}
    </motion.div>
  );
}
