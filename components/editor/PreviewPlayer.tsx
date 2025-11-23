import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from 'lucide-react';
import { useEditor } from './EditorContext';
import { useRef, useEffect, useState } from 'react';

export function PreviewPlayer() {
    const { state, dispatch } = useEditor();
    const { currentTime, duration, isPlaying, clips } = state;
    const videoRef = useRef<HTMLVideoElement>(null);

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
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        <span>🎵 Good Times — Tommy</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono">{formatTime(currentTime)}/{formatTime(duration)}</span>
                        <button onClick={togglePlay} className="hover:text-primary transition-colors">
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <Maximize2 className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
