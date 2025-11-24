import { X, Sparkles, Clock, ArrowUp, Image as ImageIcon, Upload, MoreHorizontal, Video, Play, Pencil, ChevronDown, ChevronUp, Settings2, Music } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FirstFrameModal } from './FirstFrameModal';

interface RegenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string, mode?: 'regenerate' | 'extend') => void;
    onConfirmVideo?: () => void;
    onRegenerateFromConfirmation?: () => void;
    currentDuration?: number;
    onDurationChange?: (duration: number) => void;
    videoSrc?: string;
    initialPrompt?: string;
    onModeChange?: (mode: 'regenerate' | 'extend') => void;
    thumbnail?: string;
    onThumbnailUpdate?: (url: string) => void;
    isCreationMode?: boolean;
    isPendingConfirmation?: boolean;
    lastGenerationMode?: 'regenerate' | 'extend';
    trackType?: 'video' | 'subtitle';
}

const VOICES = [
    { id: 'mizai', name: '咪仔' },
    { id: 'dayi', name: '大壹' },
    { id: 'xiaoyun', name: '小云' },
    { id: 'xiaogang', name: '小刚' }
];

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onConfirmVideo,
    onRegenerateFromConfirmation,
    currentDuration = 4,
    onDurationChange,
    videoSrc,
    initialPrompt = '',
    onModeChange,
    thumbnail,
    onThumbnailUpdate,
    isCreationMode = false,
    isPendingConfirmation = false,
    lastGenerationMode,
    trackType = 'video'
}) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [mode, setMode] = useState<'regenerate' | 'extend'>('regenerate');
    const [activeTab, setActiveTab] = useState<'ai' | 'upload'>('ai');
    const [isFirstFrameModalOpen, setIsFirstFrameModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(VOICES[1]); // Default to '大壹'
    const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
    const [useSubtitle, setUseSubtitle] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const voiceDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (isCreationMode) {
                setPrompt('');
                setMode('regenerate');
            } else if (isPendingConfirmation) {
                // In confirmation mode, always show the prompt
                setPrompt(initialPrompt || '');
                setMode('regenerate');
            } else {
                // Only show prompt if it was generated in 'regenerate' mode
                // Don't show 'extend' prompts when reopening in 'regenerate' mode
                // For subtitle tracks, always show prompt (no extend mode)
                // For mock clips (undefined lastGenerationMode), show prompt
                if (trackType === 'subtitle' || !lastGenerationMode || lastGenerationMode === 'regenerate') {
                    setPrompt(initialPrompt || '');
                } else {
                    setPrompt('');
                }
                setMode('regenerate');
            }
        }
    }, [isOpen, initialPrompt, isCreationMode, isPendingConfirmation, lastGenerationMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
                setIsVoiceDropdownOpen(false);
            }
        };

        if (isDropdownOpen || isVoiceDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isVoiceDropdownOpen]);

    const handleConfirm = () => {
        onConfirm(prompt, mode);
        setPrompt('');
    };

    const handleFirstFrameConfirm = (url: string) => {
        if (onThumbnailUpdate) {
            onThumbnailUpdate(url);
        }
        setIsFirstFrameModalOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="w-full flex justify-center z-50 pointer-events-none py-2 bg-transparent relative">
                <div className="w-[580px] bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl overflow-hidden pointer-events-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
                        <div className="flex items-center gap-4">
                            {isPendingConfirmation ? (
                                <span className="text-sm font-medium text-neutral-200">确认视频</span>
                            ) : (
                                <>
                                    {trackType === 'subtitle' ? (
                                        <span className="text-sm font-medium text-neutral-200">
                                            {isCreationMode ? '配音生成' : '重新生成'}
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setMode('regenerate');
                                                    onModeChange?.('regenerate');
                                                }}
                                                className={`text-sm font-medium transition-colors ${mode === 'regenerate' ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
                                            >
                                                {isCreationMode ? '生成视频' : '重新生成'}
                                            </button>
                                            {!isCreationMode && (
                                                <button
                                                    onClick={() => {
                                                        setMode('extend');
                                                        onModeChange?.('extend');
                                                    }}
                                                    className={`text-sm font-medium transition-colors ${mode === 'extend' ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                >
                                                    视频延展
                                                </button>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {isPendingConfirmation ? (
                            <div className="flex flex-col gap-4">
                                {trackType === 'subtitle' ? (
                                    <div className="h-48 bg-[#1a1a1a] rounded-lg border border-[#333] flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                            <Music className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-medium text-neutral-200">音频生成完成</span>
                                            <span className="text-xs text-neutral-500">点击下方按钮确认</span>
                                        </div>
                                        {/* Mock Audio Controls */}
                                        <div className="flex items-center gap-4 mt-2">
                                            <button className="p-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors">
                                                <Play className="w-4 h-4 fill-current" />
                                            </button>
                                            <div className="w-48 h-1 bg-neutral-700 rounded-full overflow-hidden">
                                                <div className="h-full w-1/3 bg-primary"></div>
                                            </div>
                                            <span className="text-xs text-neutral-400">00:05 / {currentDuration}s</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[#333]">
                                        <video
                                            src={videoSrc}
                                            className="w-full h-full object-cover"
                                            controls
                                            autoPlay
                                            loop
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-400">请确认生成效果</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onRegenerateFromConfirmation}
                                            className="px-4 py-1.5 rounded-lg bg-[#333] hover:bg-[#444] text-white text-xs font-medium transition-colors"
                                        >
                                            重新生成
                                        </button>
                                        <button
                                            onClick={onConfirmVideo}
                                            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-black text-xs font-medium transition-colors"
                                        >
                                            确认并覆盖
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {/* Thumbnail / Voice Controls */}
                                {trackType === 'subtitle' ? (
                                    <div className="w-32 shrink-0 flex flex-col gap-2">
                                        {/* Voice Selector */}
                                        <div className="relative" ref={voiceDropdownRef}>
                                            <button
                                                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-xs text-neutral-200 hover:bg-[#333] transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <Video className="w-2 h-2 text-primary" />
                                                    </div>
                                                    <span>{selectedVoice.name}</span>
                                                </div>
                                                {isVoiceDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>

                                            {isVoiceDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-[#252525] border border-[#333] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                                                    {VOICES.map(voice => (
                                                        <button
                                                            key={voice.id}
                                                            onClick={() => {
                                                                setSelectedVoice(voice);
                                                                setIsVoiceDropdownOpen(false);
                                                            }}
                                                            className="flex items-center justify-between px-3 py-2 text-xs text-neutral-200 hover:bg-[#333] transition-colors text-left group"
                                                        >
                                                            <span>{voice.name}</span>
                                                            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Mock play
                                                            }}>
                                                                <Play className="w-2 h-2 fill-current" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Subtitle Toggle */}
                                        <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border border-[#333] rounded-lg">
                                            <span className="text-xs text-neutral-400">使用字幕</span>
                                            <button
                                                onClick={() => setUseSubtitle(!useSubtitle)}
                                                className={`w-8 h-4 rounded-full relative transition-colors ${useSubtitle ? 'bg-primary' : 'bg-neutral-600'}`}
                                            >
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useSubtitle ? 'left-4.5' : 'left-0.5'}`} style={{ left: useSubtitle ? 'calc(100% - 14px)' : '2px' }} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 shrink-0 relative group">
                                        <div className="w-full h-full rounded-lg overflow-hidden border border-[#333] bg-black">
                                            {thumbnail ? (
                                                <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                            ) : videoSrc ? (
                                                <video src={`${videoSrc}#t=0.1`} className="w-full h-full object-cover" preload="metadata" />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-neutral-600" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Edit Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <div className="relative" ref={dropdownRef}>
                                                <button
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded text-white transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
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
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.accept = 'image/*';
                                                                input.onchange = (e) => {
                                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                                    if (file) {
                                                                        const url = URL.createObjectURL(file);
                                                                        onThumbnailUpdate?.(url);
                                                                    }
                                                                };
                                                                input.click();
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

                                {/* Textarea */}
                                <div className="flex-1">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={mode === 'extend' ? "描述延展后的画面内容..." : (trackType === 'subtitle' ? "输入旁白内容..." : "描述你想要的画面...")}
                                        className="w-full h-24 bg-transparent border-none text-sm text-neutral-200 placeholder-neutral-500 focus:ring-0 resize-none p-0 leading-relaxed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!isPendingConfirmation && (
                        <div className="px-4 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#252525] border border-[#333] text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer transition-colors">
                                    {trackType === 'subtitle' ? (
                                        <>
                                            <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center">
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                            </div>
                                            <span>配音生成</span>
                                        </>
                                    ) : (
                                        <>
                                            <Video className="w-3 h-3" />
                                            <span>视频生成</span>
                                            <MoreHorizontal className="w-3 h-3 ml-1" />
                                        </>
                                    )}
                                </div>
                                {trackType === 'video' && (
                                    <>
                                        <div className="px-2 py-1.5 rounded-md bg-[#252525] border border-[#333] text-xs text-neutral-400">
                                            Seedance 1.0
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#252525] border border-[#333] text-xs text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            <div className="flex flex-col mx-1">
                                                <button
                                                    onClick={() => onDurationChange?.(Math.min(12, Math.floor(currentDuration || 0) + 1))}
                                                    className="text-neutral-500 hover:text-neutral-300 -mb-1"
                                                >
                                                    <ChevronUp className="w-2 h-2" />
                                                </button>
                                                <button
                                                    onClick={() => onDurationChange?.(Math.max(2, Math.ceil(currentDuration || 0) - 1))}
                                                    className="text-neutral-500 hover:text-neutral-300"
                                                >
                                                    <ChevronDown className="w-2 h-2" />
                                                </button>
                                            </div>
                                            <span>{Number((currentDuration || 0).toFixed(1))}s</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={!prompt.trim()}
                                className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    )}
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
