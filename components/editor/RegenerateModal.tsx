import { X, Sparkles, Clock, ArrowUp, Image as ImageIcon, Upload, MoreHorizontal, Video } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FirstFrameModal } from './FirstFrameModal';

interface RegenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string) => void;
    currentDuration?: number;
    onDurationChange?: (duration: number) => void;
    videoSrc?: string;
    initialPrompt?: string;
    onModeChange?: (mode: 'regenerate' | 'extend') => void;
    thumbnail?: string;
    onThumbnailUpdate?: (url: string) => void;
}

export function RegenerateModal({
    isOpen,
    onClose,
    onConfirm,
    currentDuration = 4,
    onDurationChange,
    videoSrc,
    initialPrompt = '',
    onModeChange,
    thumbnail,
    onThumbnailUpdate
}: RegenerateModalProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [mode, setMode] = useState<'regenerate' | 'extend'>('regenerate');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFirstFrameModalOpen, setIsFirstFrameModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPrompt(initialPrompt);
    }, [initialPrompt]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleConfirm = () => {
        onConfirm(prompt);
        setPrompt('');
    };

    const handleFirstFrameConfirm = (url: string) => {
        if (onThumbnailUpdate) {
            onThumbnailUpdate(url);
        }
        setIsFirstFrameModalOpen(false);
    };

    return (
        <>
            <div className="w-full flex justify-center z-50 pointer-events-none py-2 bg-transparent relative">
                <div className="w-[500px] bg-gradient-to-b from-[#2a2a2a]/90 to-[#1a1a1a]/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#333] relative">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setMode('regenerate');
                                    setPrompt(initialPrompt);
                                    onModeChange?.('regenerate');
                                }}
                                className={`flex items-center gap-1 text-sm font-medium transition-colors ${mode === 'regenerate' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                重新生成
                            </button>
                            <button
                                onClick={() => {
                                    setMode('extend');
                                    setPrompt('');
                                    onModeChange?.('extend');
                                }}
                                className={`flex items-center gap-1 text-sm font-medium transition-colors ${mode === 'extend' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                视频延展
                            </button>
                        </div>
                        <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex gap-4">
                        {/* Thumbnail Area */}
                        {mode !== 'extend' && (
                            <div className="relative group w-24 h-24 shrink-0">
                                <div className="w-full h-full rounded-lg overflow-hidden border border-[#333] bg-black">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : videoSrc ? (
                                        <video
                                            src={`${videoSrc}#t=0.1`}
                                            className="w-full h-full object-cover"
                                            preload="metadata"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800" />
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] rounded-lg">
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="text-xs text-white font-medium border border-white/30 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                        >
                                            编辑
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-32 bg-[#252525] border border-[#333] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => {
                                                        setIsFirstFrameModalOpen(true);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-200 hover:bg-[#333] transition-colors text-left"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    AI 生图
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Mock upload
                                                        alert("Local upload clicked");
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-200 hover:bg-[#333] transition-colors text-left"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    本地上传
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Prompt Input */}
                        <div className="flex-1 flex flex-col gap-2">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={mode === 'extend' ? "接下来是(延长镜头)" : "描述你想要的画面..."}
                                className="w-full h-24 bg-transparent border-none text-sm text-neutral-200 placeholder-neutral-500 focus:ring-0 resize-none p-0"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-[#333] flex items-center justify-between bg-[#1a1a1a]/50">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#252525] border border-[#333] text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer transition-colors">
                                <Video className="w-3 h-3" />
                                <span>视频生成</span>
                                <MoreHorizontal className="w-3 h-3 ml-1" />
                            </div>
                            <div className="px-2 py-1 rounded bg-[#252525] border border-[#333] text-xs text-neutral-400">
                                Seedance 1.0
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#252525] border border-[#333] text-xs text-neutral-400">
                                <Clock className="w-3 h-3" />
                                <input
                                    type="number"
                                    value={currentDuration}
                                    onChange={(e) => onDurationChange?.(Number(e.target.value))}
                                    className="w-8 bg-transparent border-none p-0 text-center focus:ring-0"
                                />
                                <span>s</span>
                            </div>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={!prompt.trim()}
                            className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <FirstFrameModal
                isOpen={isFirstFrameModalOpen}
                onClose={() => setIsFirstFrameModalOpen(false)}
                onConfirm={handleFirstFrameConfirm}
                initialPrompt={prompt}
            />
        </>
    );
}
