import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Search, Music, Check, ChevronUp } from 'lucide-react';
import { useEditor } from './EditorContext';
import { useRef, useEffect, useState } from 'react';

export function PreviewPlayer() {
    const { state, dispatch } = useEditor();
    const { currentTime, duration, isPlaying, clips } = state;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);

    // Find current video clip
    const activeClip = clips.find(
        c => c.trackId === 'video' && currentTime >= c.startTime && currentTime < c.startTime + c.duration
    );

    useEffect(() => {
        if (videoRef.current && activeClip) {
            const videoTime = currentTime - activeClip.startTime;
            if (Math.abs(videoRef.current.currentTime - videoTime) > 0.5) {
                videoRef.current.currentTime = videoTime;
            }

            if (isPlaying) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [currentTime, isPlaying, activeClip]);

    const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background relative min-h-0">
            {/* Video Container */}
            <div className="relative aspect-video w-full max-w-4xl bg-black shadow-2xl overflow-hidden">
                {activeClip ? (
                    <video
                        ref={videoRef}
                        src={activeClip.content}
                        className="w-full h-full object-contain"
                        muted // Muted for auto-play policy simplicity in demo
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                        <span className="text-sm">No video at this time</span>
                    </div>
                )}

                {/* Overlay Controls */}
                {/* Overlay Controls */}
                {/* Music Settings Menu */}
                {isMusicMenuOpen && (
                    <div className="absolute bottom-16 left-4 w-64 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Search */}
                        <div className="p-3 border-b border-[#333]">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="请描述你需要的音乐.."
                                    className="w-full bg-[#252525] border border-[#333] rounded-md py-1.5 pl-9 pr-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="py-1">
                            <button className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-[#252525] flex items-center gap-3 transition-colors">
                                <span className="text-neutral-400">本地上传</span>
                            </button>
                            <button className="w-full px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-[#252525] flex items-center gap-3 transition-colors">
                                <span className="text-neutral-400">不使用BGM</span>
                            </button>

                            {/* BGM List */}
                            <div className="mt-1 border-t border-[#333]">
                                <button className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-[#252525] flex items-center justify-between group transition-colors bg-[#252525]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                                            <Play className="w-3 h-3 fill-current ml-0.5" />
                                        </div>
                                        <span>好运来</span>
                                    </div>
                                    <Check className="w-4 h-4 text-primary" />
                                </button>
                                <button className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-[#252525] flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                                            <Play className="w-3 h-3 fill-current ml-0.5" />
                                        </div>
                                        <span>好运不来</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute bottom-0 left-0 right-0 h-12 px-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white z-10">
                    {/* Left: Music Info (Clickable) */}
                    <button
                        onClick={() => setIsMusicMenuOpen(!isMusicMenuOpen)}
                        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all duration-200 ${isMusicMenuOpen ? 'bg-white text-black border-white' : 'bg-white/10 border-white/5 hover:bg-white/20'}`}
                    >
                        <Music className="w-3 h-3" />
                        <span className="font-medium">好运来 - 祖海</span>
                        <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${isMusicMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Center: Time & Play */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                        <span className="text-xs font-mono text-neutral-300 tracking-wider">{formatTime(currentTime)}/{formatTime(duration)}</span>
                        <button
                            onClick={togglePlay}
                            className="hover:text-primary transition-colors hover:scale-110 transform duration-200"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                    </div>

                    {/* Right: Volume & Maximize */}
                    <div className="flex items-center gap-4 text-neutral-300">
                        <button className="hover:text-white transition-colors">
                            <Volume2 className="w-4 h-4" />
                        </button>
                        <button className="hover:text-white transition-colors">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
