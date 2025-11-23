import { useRef, useState, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { Clip } from './types';
import { GripVertical, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { VideoFilmstrip } from './VideoFilmstrip';

interface ClipItemProps {
    clip: Clip;
}

export function ClipItem({ clip }: ClipItemProps) {
    const { state, dispatch } = useEditor();
    const { zoom, selectedClipId } = state;
    const isSelected = selectedClipId === clip.id;

    const clipRef = useRef<HTMLDivElement>(null);

    // Trimming State (Refs for synchronous access in event handlers)
    const dragStartX = useRef(0);
    const initialDuration = useRef(0);

    // Moving State (Refs for synchronous access in event handlers)
    const moveStartX = useRef(0);
    const initialStartTime = useRef(0);

    // We still need state to trigger re-renders if we were showing UI based on dragging,
    // but here we only use it for logic. However, if we want to show "dragging" state visually,
    // we can keep isDragging/isMoving as state.
    const [isDragging, setIsDragging] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: 'SELECT_CLIP', payload: clip.id });

        // Start moving if not generating
        if (!clip.isGenerating) {
            setIsMoving(true);
            moveStartX.current = e.clientX;
            initialStartTime.current = clip.startTime;
            document.addEventListener('mousemove', handleMoveMove);
            document.addEventListener('mouseup', handleMoveEnd);
        }
    };

    const handleMoveMove = (e: MouseEvent) => {
        const deltaX = e.clientX - moveStartX.current;
        const deltaSeconds = deltaX / zoom;
        let newStartTime = initialStartTime.current + deltaSeconds;

        // Constraint: cannot go below 0
        newStartTime = Math.max(0, newStartTime);

        dispatch({
            type: 'UPDATE_CLIP',
            payload: {
                id: clip.id,
                changes: { startTime: newStartTime }
            }
        });
    };

    const handleMoveEnd = () => {
        setIsMoving(false);
        document.removeEventListener('mousemove', handleMoveMove);
        document.removeEventListener('mouseup', handleMoveEnd);
    };

    const handleTrimMove = (e: MouseEvent) => {
        if (!clipRef.current) return;

        const deltaX = e.clientX - dragStartX.current;
        const deltaSeconds = deltaX / zoom;

        let newDuration = initialDuration.current + deltaSeconds;

        // Constraints
        // 1. Min duration (e.g. 0.5s)
        newDuration = Math.max(0.5, newDuration);
        // 2. Max duration
        // If extensionStart is set (Extend Mode), allow up to extensionStart + 12s
        // Otherwise (Regenerate Mode), limit to originalDuration
        const maxDuration = clip.extensionStart
            ? clip.extensionStart + 12
            : clip.originalDuration;

        newDuration = Math.min(newDuration, maxDuration);

        dispatch({
            type: 'UPDATE_CLIP',
            payload: {
                id: clip.id,
                changes: { duration: newDuration }
            }
        });
    };

    const handleTrimEnd = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleTrimMove);
        document.removeEventListener('mouseup', handleTrimEnd);
    };

    // Trimming Logic (existing)
    const handleTrimStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (clip.trackId !== 'video' || clip.isGenerating) return;

        setIsDragging(true);
        dragStartX.current = e.clientX;
        initialDuration.current = clip.duration;

        document.addEventListener('mousemove', handleTrimMove);
        document.addEventListener('mouseup', handleTrimEnd);
    };

    // ... handleTrimMove and handleTrimEnd ...

    // Update state for event listeners
    useEffect(() => {
        // Cleanup listeners on unmount
        return () => {
            document.removeEventListener('mousemove', handleTrimMove);
            document.removeEventListener('mouseup', handleTrimEnd);
            document.removeEventListener('mousemove', handleMoveMove);
            document.removeEventListener('mouseup', handleMoveEnd);
        };
    }, []);


    const width = clip.duration * zoom;

    return (
        <div
            ref={clipRef}
            className={clsx(
                "absolute top-1 bottom-1 rounded overflow-hidden border transition-colors cursor-pointer group select-none",
                isSelected ? "border-primary ring-1 ring-primary z-20" : "border-transparent hover:border-white/20 z-10",
                clip.trackId === 'subtitle' ? "bg-teal-900/50 border-teal-700/50" : "bg-neutral-800"
            )}
            style={{
                left: clip.startTime * zoom,
                width: width,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Content */}
            <div className="w-full h-full overflow-hidden relative">
                {clip.trackId === 'subtitle' ? (
                    <div className="p-2 text-xs text-teal-100 truncate">{clip.content}</div>
                ) : (
                    <div className="flex h-full bg-black relative">
                        {/* Original Video Content */}
                        <div style={{ width: Math.min(width, (clip.extensionStart ?? clip.originalDuration) * zoom) }} className="h-full shrink-0">
                            <VideoFilmstrip
                                src={clip.content}
                                duration={clip.extensionStart ?? clip.originalDuration}
                                width={Math.min(width, (clip.extensionStart ?? clip.originalDuration) * zoom)}
                                height={64}
                            />
                        </div>

                        {/* Extended Part */}
                        {clip.duration > (clip.extensionStart ?? clip.originalDuration) && (
                            <div className="flex-1 h-full relative overflow-hidden bg-[#1a1a1a]">
                                {/* Text Content - Only show in Extend Mode */}
                                {clip.extensionStart && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <span className="text-sm text-white/90 font-medium tracking-wide">接下来应该发生什么？</span>
                                    </div>
                                )}

                                {/* Subtle left border for separation */}
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />
                            </div>
                        )}
                    </div>
                )}

                {/* Generating Overlay */}
                {clip.isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-30">
                        <div className="flex items-center gap-2 text-xs text-white font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Generating...</span>
                        </div>
                        {/* Progress bar mock */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
                            <div className="h-full bg-primary w-1/2 animate-pulse"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Trim Handle (Right) - Only for Video and when selected */}
            {isSelected && clip.trackId === 'video' && !clip.isGenerating && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center hover:bg-primary/20 group/handle z-30"
                    onMouseDown={handleTrimStart}
                >
                    <div className="w-1 h-4 bg-white/50 rounded-full group-hover/handle:bg-white"></div>
                </div>
            )}

            {/* Selection Outline (extra visual) */}
            {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none rounded"></div>}
        </div>
    );
}
