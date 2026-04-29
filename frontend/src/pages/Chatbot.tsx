import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Square, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const TOOL_LABELS: Record<string, string> = {
  search_products:     '🔍 Tìm kiếm sản phẩm',
  get_recommendations: '💡 Gợi ý cá nhân hóa',
  get_product_details: '📦 Tra cứu chi tiết',
  filter_by_price:     '💰 Lọc theo giá',
};

interface Message {
  role: 'user' | 'ai';
  text: string;
  streaming?: boolean;
  activeTool?: string | null;
  products?: ProductHint[];
}

interface ProductHint {
  product_id?: number;
  name: string;
  price?: number | string;
  category?: string;
}

// Open all links from AI markdown in a new tab
const MD_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
      {children}
    </a>
  ),
};

const SUGGESTIONS = [
  'Gợi ý laptop gaming dưới 30 triệu',
  'Tai nghe chống ồn tốt nhất',
  'Sách lập trình hay cho người mới',
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI **EcomFinal**, được trang bị:\n- 🤖 **MCP Tool Calling** — tự động chọn công cụ phù hợp\n- 🕸️ **Neo4j Knowledge Graph** — tìm kiếm ngữ nghĩa\n- 💡 **LSTM Recommendations** — gợi ý cá nhân hóa\n\nHỏi tôi bất cứ điều gì về sản phẩm!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: 'user', text };
    const aiMsg: Message = { role: 'ai', text: '', streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.done) {
              // Final event
              setMessages(prev => {
                const copy = [...prev];
                const last = { ...copy[copy.length - 1] };
                last.streaming = false;
                last.activeTool = null;
                last.products = payload.products ?? [];
                copy[copy.length - 1] = last;
                return copy;
              });
            } else if (payload.type === 'tool_start') {
              // MCP tool is being called — show indicator
              setMessages(prev => {
                const copy = [...prev];
                const last = { ...copy[copy.length - 1] };
                last.activeTool = payload.tool;
                copy[copy.length - 1] = last;
                return copy;
              });
            } else {
              // token event (type === 'token' or legacy)
              const tok = payload.token ?? '';
              if (tok) {
                setMessages(prev => {
                  const copy = [...prev];
                  const last = { ...copy[copy.length - 1] };
                  last.text += tok;
                  last.activeTool = null;
                  copy[copy.length - 1] = last;
                  return copy;
                });
              }
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const copy = [...prev];
          const last = { ...copy[copy.length - 1] };
          last.text = last.text || '_Lỗi kết nối. Vui lòng thử lại._';
          last.streaming = false;
          copy[copy.length - 1] = last;
          return copy;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.streaming = false;
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-3xl mx-auto h-[78vh] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
          <Bot className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            AI Assistant <Sparkles size={16} className="text-secondary" />
          </h1>
          <p className="text-xs text-slate-500">MCP Tool Calling · Neo4j · OpenAI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Online</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col !p-0 min-h-0">
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-primary/15' : 'bg-slate-100'
              }`}>
                {msg.role === 'user'
                  ? <User size={15} className="text-primary" />
                  : <Bot size={15} className="text-slate-600" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm shadow-md shadow-primary/20'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="
                      prose prose-sm max-w-none
                      prose-p:my-1 prose-p:leading-relaxed
                      prose-ul:my-1 prose-ul:pl-4
                      prose-ol:my-1 prose-ol:pl-4
                      prose-li:my-0.5
                      prose-strong:text-slate-900 prose-strong:font-semibold
                      prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-slate-700 prose-code:font-mono
                      prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:text-xs
                      prose-blockquote:border-primary/40 prose-blockquote:text-slate-500
                      prose-headings:text-slate-900 prose-h3:text-sm prose-h3:font-bold
                      prose-hr:border-slate-200
                      text-slate-800">
                      {/* MCP tool indicator */}
                      {msg.activeTool && (
                        <div className="flex items-center gap-1.5 mb-2 text-xs text-primary font-medium not-prose">
                          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          {TOOL_LABELS[msg.activeTool] ?? msg.activeTool}…
                        </div>
                      )}
                      <ReactMarkdown components={MD_COMPONENTS}>
                        {(msg.text || '') + (msg.streaming && !msg.activeTool ? '▋' : !msg.text ? '…' : '')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>

                {/* Product chips — link to product page, open in new tab */}
                {msg.products && msg.products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.products.slice(0, 6).map((p, i) => (
                      <a
                        key={i}
                        href={p.product_id ? `/product/${p.product_id}` : '/products'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass border border-slate-200 hover:border-primary/40 hover:shadow-sm px-3 py-2 rounded-xl text-xs font-medium text-slate-700 flex flex-col gap-0.5 transition-all group"
                      >
                        <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                          {p.category && <span>{p.category}</span>}
                          <ExternalLink size={9} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                        </span>
                        <span className="text-slate-900 font-semibold leading-tight">{p.name}</span>
                        {p.price && (
                          <span className="text-primary font-bold">
                            {Number(p.price).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white/60 border-t border-slate-100 backdrop-blur-md flex-shrink-0">
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={isStreaming}
                  className="text-xs bg-white border border-slate-200 hover:border-primary/40 hover:text-primary px-3 py-1.5 rounded-full text-slate-600 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hỏi AI tư vấn sản phẩm..."
              disabled={isStreaming}
              className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                title="Dừng"
              >
                <Square size={14} className="text-white fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all flex-shrink-0 shadow-md shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={15} className="text-white ml-0.5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
