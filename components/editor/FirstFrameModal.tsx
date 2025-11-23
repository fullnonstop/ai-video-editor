import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, ArrowUp, Sparkles } from 'lucide-react';

interface FirstFrameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (imageUrl: string) => void;
    initialPrompt?: string;
}

interface GenerationSession {
    id: string;
    prompt: string;
    status: 'loading' | 'completed';
    images: string[];
}

export const FirstFrameModal: React.FC<FirstFrameModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialPrompt = ''
}) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [sessions, setSessions] = useState<GenerationSession[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialPrompt && sessions.length === 0) {
            setPrompt(initialPrompt);
        }
    }, [isOpen, initialPrompt]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [sessions]);

    if (!isOpen) return null;

    const handleGenerate = () => {
        if (!prompt.trim()) return;

        const newSession: GenerationSession = {
            id: Date.now().toString(),
            prompt: prompt,
            status: 'loading',
            images: []
        };

        setSessions(prev => [...prev, newSession]);
        // setPrompt(''); // Keep prompt for refinement

        // Mock generation
        setTimeout(() => {
            setSessions(prev => prev.map(session => {
                if (session.id === newSession.id) {
                    return {
                        ...session,
                        status: 'completed',
                        images: [
                            'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba',
                            'https://images.unsplash.com/photo-1682687221038-404670e01d46',
                            'https://images.unsplash.com/photo-1682687220063-4742bd7fd538',
                            'https://images.unsplash.com/photo-1682687220199-d0124f48f95b'
                        ]
                    };
                }
                return session;
            }));
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[800px] h-[600px] bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333] shrink-0">
                    <h3 className="text-lg font-medium text-white">AI 首帧生成</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Chat/Feed Style */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 flex flex-col gap-8"
                >
                    {sessions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-4 opacity-50">
                            <Sparkles className="w-12 h-12" />
                            <p>输入提示词开始生成</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Prompt Bubble */}
                                <div className="text-neutral-200 text-sm bg-[#2a2a2a] p-3 rounded-lg self-start max-w-[80%] border border-[#333]">
                                    {session.prompt}
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-4 gap-3">
                                    {session.status === 'loading' ? (
                                        // Loading Placeholders
                                        Array(4).fill(0).map((_, idx) => (
                                            <div key={idx} className="aspect-square bg-[#252525] rounded-lg animate-pulse border border-[#333]" />
                                        ))
                                    ) : (
                                        // Generated Images
                                        session.images.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border border-[#333] bg-black">
                                                <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-cover" />

                                                {/* Overlay with Use Button */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                                    <button
                                                        onClick={() => onConfirm(img)}
                                                        className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-neutral-200 transition-colors transform translate-y-2 group-hover:translate-y-0 duration-200"
                                                    >
                                                        使用
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[#333] bg-[#1e1e1e]">
                    <div className="bg-[#252525] rounded-xl p-2 border border-[#333] flex flex-col gap-2 relative focus-within:border-neutral-500 transition-colors">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                            placeholder="描述你想要的画面..."
                            className="w-full bg-transparent border-none text-sm text-neutral-200 placeholder-neutral-500 focus:ring-0 resize-none h-20 p-2 pr-12"
                        />
                        <div className="absolute bottom-2 right-2">
                            <button
                                onClick={handleGenerate}
                                disabled={!prompt.trim()}
                                className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
