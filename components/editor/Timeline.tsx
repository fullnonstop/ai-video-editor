"use client";

import { Search, Type, Video, Play, Pause, ZoomIn, ZoomOut, RotateCcw, Wand2, Trash2, Clock, MousePointer2 } from 'lucide-react';
import { useEditor } from './EditorContext';
import { ClipItem } from './ClipItem';
import { Clip } from './types';
import { useRef, useEffect, useState } from 'react';
import { RegenerateModal } from './RegenerateModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export function Timeline() {
    const { state, dispatch } = useEditor();
    const { clips, currentTime, duration, isPlaying, selectedClipId, zoom } = state;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [timelineWidth, setTimelineWidth] = useState(2000); // Default large width
    const [previewExtensionState, setPreviewExtensionState] = useState<{ clipId: string, snapshot: Clip[] } | null>(null);

    useEffect(() => {
        setTimelineWidth(Math.max(duration * zoom + 200, window.innerWidth));
        const handleResize = () => setTimelineWidth(Math.max(duration * zoom + 200, window.innerWidth));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [duration, zoom]);

    const selectedClip = clips.find(c => c.id === selectedClipId);
    const showModal = selectedClip?.trackId === 'video' && !selectedClip.isGenerating;

    // Auto-open modal when selection changes to a valid video clip
    useEffect(() => {
        if (showModal) {
            setIsModalOpen(true);
        } else {
            setIsModalOpen(false);
        }
    }, [selectedClipId, showModal]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if ((e.code === 'Backspace' || e.code === 'Delete') && selectedClipId) {
                e.preventDefault();
                setIsDeleteModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, selectedClipId]);

    // Handle Playback
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                dispatch({ type: 'SET_TIME', payload: state.currentTime + 0.1 });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, state.currentTime, dispatch]);

    // Auto-scroll playhead (basic)
    useEffect(() => {
        if (isPlaying && scrollContainerRef.current) {
            const playheadPos = currentTime * zoom;
            const center = scrollContainerRef.current.clientWidth / 2;
            if (playheadPos > center) {
                scrollContainerRef.current.scrollLeft = playheadPos - center;
            }
        }
    }, [currentTime, isPlaying, zoom]);

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only seek if not clicking on a clip (handled by ClipItem) or button
        if ((e.target as HTMLElement).closest('.clip-item') || (e.target as HTMLElement).closest('button')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
        const time = Math.max(0, x / zoom);
        dispatch({ type: 'SET_TIME', payload: time });
    };

    const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });



    // Reset modal and preview state when selection changes
    useEffect(() => {
        // If we were previewing and switched clips without confirming, revert
        if (previewExtensionState && previewExtensionState.clipId !== selectedClipId) {
            dispatch({
                type: 'RESTORE_CLIPS',
                payload: previewExtensionState.snapshot
            });
            setPreviewExtensionState(null);
        }

        if (selectedClipId) {
            setIsModalOpen(true);
            // Reset mode to regenerate is handled in Modal, but we ensure no lingering preview state for the new clip
        } else {
            setIsModalOpen(false);
        }
    }, [selectedClipId, previewExtensionState, dispatch]); // Added dispatch to dependency array

    const handleDeleteConfirm = () => {
        if (selectedClipId) {
            dispatch({ type: 'DELETE_CLIP', payload: selectedClipId });
            setIsDeleteModalOpen(false);
            // Also close regenerate modal if open
            setIsModalOpen(false);
        }
    };

    const handleRegenerateConfirm = (prompt: string) => {
        if (!selectedClipId) return;

        // If confirming extension, we clear the preview state (making the change "permanent")
        if (previewExtensionState?.clipId === selectedClipId) {
            setPreviewExtensionState(null);
        }

        dispatch({
            type: 'SET_GENERATING',
            payload: { id: selectedClipId, isGenerating: true }
        });

        // Mock completion after 5 seconds
        setTimeout(() => {
            dispatch({
                type: 'SET_GENERATING',
                payload: { id: selectedClipId, isGenerating: false }
            });
        }, 5000);
    };

    const handleModeChange = (mode: 'regenerate' | 'extend') => {
        if (!selectedClip) return;

        if (mode === 'extend') {
            // Enter extend mode: Extend by 3s
            // Snapshot current clips state before modification
            setPreviewExtensionState({ clipId: selectedClip.id, snapshot: clips });

            const currentDuration = selectedClip.duration;
            const newDuration = currentDuration + 3;

            dispatch({
                type: 'UPDATE_CLIP',
                payload: {
                    id: selectedClip.id,
                    changes: {
                        duration: newDuration,
                        extensionStart: currentDuration // Mark where the extension begins
                    }
                }
            });
        } else {
            // Revert to regenerate mode
            if (previewExtensionState && previewExtensionState.clipId === selectedClip.id) {
                dispatch({
                    type: 'RESTORE_CLIPS',
                    payload: previewExtensionState.snapshot
                });
                setPreviewExtensionState(null);
            }
        }
    };

    const handleDurationChange = (newDuration: number) => {
        if (selectedClipId) {
            const clip = clips.find(c => c.id === selectedClipId);
            if (!clip) return;

            dispatch({
                type: 'UPDATE_CLIP',
                payload: {
                    id: selectedClipId,
                    changes: {
                        duration: newDuration
                    }
                }
            });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    // Determine duration to show in modal
    // If in extend mode (previewExtensionState active for this clip), show the extension amount (3s default or whatever set)
    // Actually, if we are in extend mode, the clip duration is (original + 3). The user wants to see "3s".
    // So we should calculate: if extensionStart is set, duration = total - extensionStart.
    const modalDuration = selectedClip?.extensionStart
        ? selectedClip.duration - selectedClip.extensionStart
        : selectedClip?.duration;

    return (
        <div
            className="bg-timeline border-t border-border flex flex-col shrink-0 select-none relative min-h-[320px]"
        >
            {/* Selection Hint Overlay */}
            {!selectedClipId && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-[#252525] border border-[#333] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-neutral-400">
                        <MousePointer2 className="w-4 h-4" />
                        <span className="text-sm font-medium">选中片段进行编辑</span>
                    </div>
                </div>
            )}

            {/* Timeline Toolbar */}
            <div className="h-10 border-b border-border flex items-center px-4 justify-between bg-panel">
                <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="hover:text-primary transition-colors">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <div className="w-24 h-1 bg-neutral-700 rounded-full relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-neutral-500 rounded-full"></div>
                        </div>
                        <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* Timeline Tracks Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-auto relative custom-scrollbar"
            >
                <div className="min-w-full relative" style={{ width: timelineWidth }}>
                    {/* Time Ruler */}
                    <div
                        className="h-8 border-b border-border flex items-end text-[10px] text-muted-foreground select-none bg-timeline sticky top-0 z-40"
                        onClick={handleTimelineClick}
                    >
                        {Array.from({ length: Math.ceil(duration) + 2 }).map((_, i) => (
                            <div key={i} className="absolute bottom-0 border-l border-neutral-700 h-2 pl-1" style={{ left: i * zoom }}>
                                {i % 5 === 0 && <span>{formatTime(i).slice(0, 5)}</span>}
                            </div>
                        ))}
                        {/* Sub-ticks */}
                        {Array.from({ length: (Math.ceil(duration) + 2) * 5 }).map((_, i) => (
                            <div key={`sub-${i}`} className="absolute bottom-0 border-l border-neutral-800 h-1" style={{ left: i * (zoom / 5) }}></div>
                        ))}
                    </div>

                    {/* Tracks */}
                    <div className="flex flex-col relative" onClick={handleTimelineClick}>
                        {/* Subtitle Track */}
                        <div className="h-12 border-b border-border flex relative group">
                            <div className="w-12 shrink-0 border-r border-border flex flex-col items-center justify-center gap-1 bg-panel z-30 sticky left-0">
                                <Type className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">旁白</span>
                            </div>
                            <div className="flex-1 bg-track relative min-w-0">
                                {clips.filter(c => c.trackId === 'subtitle').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} />
                                ))}
                            </div>
                        </div>

                        {/* Video Track */}
                        <div className="h-16 border-b border-border flex relative group">
                            <div className="w-12 shrink-0 border-r border-border flex flex-col items-center justify-center gap-1 bg-panel z-30 sticky left-0">
                                <Video className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">视频</span>
                            </div>
                            <div className="flex-1 bg-track relative min-w-0">
                                {clips.filter(c => c.trackId === 'video').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Playhead Line */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-white z-50 pointer-events-none"
                        style={{ left: currentTime * zoom }}
                    >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-white rotate-45"></div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
            />

            <div
                className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${isModalOpen && selectedClip ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                {selectedClip && (
                    <RegenerateModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            // Revert if closing without confirming
                            if (previewExtensionState && selectedClip) {
                                dispatch({
                                    type: 'RESTORE_CLIPS',
                                    payload: previewExtensionState.snapshot
                                });
                                setPreviewExtensionState(null);
                            }
                            setIsModalOpen(false);
                        }}
                        onConfirm={handleRegenerateConfirm}
                        currentDuration={modalDuration}
                        onDurationChange={handleDurationChange}
                        videoSrc={selectedClip.content}
                        initialPrompt={selectedClip.prompt}
                        onModeChange={handleModeChange}
                        thumbnail={selectedClip.thumbnail}
                        onThumbnailUpdate={(url) => {
                            dispatch({
                                type: 'UPDATE_CLIP',
                                payload: {
                                    id: selectedClip.id,
                                    changes: { thumbnail: url }
                                }
                            });
                        }}
                    />
                )}
            </div>
        </div>
    );
}
