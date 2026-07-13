import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ArrowUp } from 'lucide-react';
import { getAIRouter } from '../services/ai';

export const CopilotOverlay = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
        {role: 'ai', text: "Hello. I'm Seesby. I've looked at your latest data. You have 3 critical errors and a new competitor in the top 10. What would you like to handle first?"}
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        
        // Optimistic UI update
        const currentHistory = messages;
        setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
        setInput('');
        setIsTyping(true);
        
        try {
            const router = getAIRouter();
            const response = await router.complete({
                taskType: 'summarize', // Using summarize for general chat/help
                systemPrompt: "You are Seesby's AI Copilot. You help business owners understand their website performance. Explain things in very simple, plain English. Avoid complex SEO jargon like 'canonicalization' or 'link equity' unless you explain them simply first. Be helpful and concise.",
                prompt: `History:\n${currentHistory.map(m => `${m.role}: ${m.text}`).join('\n')}\nUser: ${userMsg}`,
                maxTokens: 512,
                temperature: 0.7,
            });
            setIsTyping(false);
            setMessages(prev => [...prev, {role: 'ai', text: response.text}]);
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, {role: 'ai', text: "Connection error. Please try again."}]);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-border-2)] w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[var(--brand-border-1)] flex items-center justify-between bg-[var(--brand-surface-3)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-amber flex items-center justify-center shadow-glow-sm">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-[var(--brand-text-strong)] font-bold font-heading">Seesby AI</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] text-[var(--brand-text-faint)] uppercase tracking-wide">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] transition-colors p-2 hover:bg-[var(--brand-surface-3)] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                                msg.role === 'user'
                                ? 'bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)] rounded-tr-sm'
                                : 'bg-[var(--brand-surface-2)] border border-[var(--brand-border-1)] text-[var(--brand-text-mid)] rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                         <div className="flex justify-start">
                             <div className="bg-[var(--brand-surface-2)] border border-[var(--brand-border-1)] rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                                 <div className="w-1.5 h-1.5 bg-[var(--brand-text-faint)] rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-[var(--brand-text-faint)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                 <div className="w-1.5 h-1.5 bg-[var(--brand-text-faint)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                             </div>
                         </div>
                    )}
                    <div ref={bottomRef}></div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[var(--brand-border-1)] bg-[var(--brand-surface-1)]">
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded-xl pl-4 pr-12 py-3.5 text-[var(--brand-text-strong)] placeholder-[var(--brand-text-faint)] focus:outline-none focus:border-brand-amber/50 transition-colors"
                            placeholder="Ask me to audit a page, write content, or check rankings..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            autoFocus
                        />
                        <button 
                            onClick={handleSend}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-amber hover:bg-brand-amberHover text-white rounded-lg transition-colors shadow-glow-sm"
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
