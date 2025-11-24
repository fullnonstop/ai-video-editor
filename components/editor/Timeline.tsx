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
    const [creationState, setCreationState] = useState<{ startTime: number, duration: number, trackId: 'video' | 'subtitle' } | null>(null);

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
            // Ensure creation state is cleared when selecting a clip
            setCreationState(null);
        } else if (!creationState) {
            setIsModalOpen(false);
        }
    }, [selectedClipId, showModal, creationState]);

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
    // Playback State Refs
    const startTimeRef = useRef<number>(0);
    const lastDispatchTimeRef = useRef(state.currentTime);

    // Handle external seeks
    useEffect(() => {
        // If the difference between current state time and what we last dispatched is large (> 0.05s),
        // it's likely an external seek (or initial load). We need to reset our anchor.
        // We also update if we are NOT playing, to keep the anchor ready for when we start.
        if (!isPlaying || Math.abs(state.currentTime - lastDispatchTimeRef.current) > 0.05) {
            startTimeRef.current = performance.now() - state.currentTime * 1000;
            lastDispatchTimeRef.current = state.currentTime;
        }
    }, [state.currentTime, isPlaying]);

    // Playback Loop
    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            const now = performance.now();
            // Calculate exact time based on anchor
            const newTime = (now - startTimeRef.current) / 1000;

            // Update ref before dispatch to match the seek detection logic
            lastDispatchTimeRef.current = newTime;
            dispatch({ type: 'SET_TIME', payload: newTime });

            animationFrameId = requestAnimationFrame(animate);
        };

        if (isPlaying) {
            // Initialize anchor (redundant with the seek effect but safe)
            startTimeRef.current = performance.now() - state.currentTime * 1000;
            lastDispatchTimeRef.current = state.currentTime;

            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, dispatch]); // Intentionally exclude state.currentTime to prevent loop restart

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
        // Subtract header width (96px)
        const time = Math.max(0, (x - 96) / zoom);
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
        } else if (!creationState) {
            setIsModalOpen(false);
        }
    }, [selectedClipId, previewExtensionState, dispatch, creationState]); // Added dispatch to dependency array

    const handleDeleteConfirm = () => {
        if (selectedClipId) {
            dispatch({ type: 'DELETE_CLIP', payload: selectedClipId });
            setIsDeleteModalOpen(false);
            // Also close regenerate modal if open
            setIsModalOpen(false);
        }
    };

    const handleAddClick = (startTime: number, duration: number, trackId: 'video' | 'subtitle' = 'video') => {
        // Sanitize inputs to 0.1s precision
        const cleanStartTime = Math.round(startTime * 10) / 10;
        const cleanDuration = Math.round(duration * 10) / 10;

        setCreationState({ startTime: cleanStartTime, duration: cleanDuration, trackId });
        dispatch({ type: 'SELECT_CLIP', payload: null }); // Deselect current
        setIsModalOpen(true);
    };

    const handleRegenerateConfirm = (prompt: string, mode?: 'regenerate' | 'extend') => {
        // Handle new clip creation
        if (creationState) {
            const newClip: Clip = {
                id: `clip-${Date.now()}`,
                trackId: creationState.trackId,
                startTime: creationState.startTime,
                duration: creationState.duration,
                originalDuration: creationState.duration,
                content: creationState.trackId === 'video' ? '/sample-video.mp4' : '音频生成中...',
                prompt: prompt,
                isGenerating: true,
                thumbnail: creationState.trackId === 'video' ? '/sample-thumbnail.jpg' : undefined,
                lastGenerationMode: mode || 'regenerate'
            };

            dispatch({ type: 'ADD_CLIP', payload: newClip });
            setCreationState(null);

            // Mock completion
            setTimeout(() => {
                const changes: Partial<Clip> = {
                    isGenerating: false,
                    isPendingConfirmation: true
                };

                // For subtitle, simulate new duration
                if (newClip.trackId === 'subtitle') {
                    const newDuration = 3 + Math.random() * 5;
                    changes.duration = Math.round(newDuration * 10) / 10;
                    changes.originalDuration = changes.duration;
                    changes.content = prompt;
                }

                dispatch({
                    type: 'UPDATE_CLIP',
                    payload: {
                        id: newClip.id,
                        changes
                    }
                });
            }, 3000);
            return;
        }

        if (!selectedClipId) return;
        const selectedClip = clips.find(c => c.id === selectedClipId);
        if (!selectedClip) return;

        // If confirming extension, we clear the preview state (making the change "permanent")
        if (previewExtensionState?.clipId === selectedClipId) {
            setPreviewExtensionState(null);
        }

        // Snapshot for subtitle regeneration to allow revert of duration change
        if (selectedClip.trackId === 'subtitle') {
            setPreviewExtensionState({ clipId: selectedClipId, snapshot: clips });
        }

        dispatch({
            type: 'UPDATE_CLIP',
            payload: {
                id: selectedClipId,
                changes: {
                    prompt: prompt,
                    isGenerating: true,
                    lastGenerationMode: mode || 'regenerate'
                }
            }
        });

        // Mock completion after 3 seconds
        setTimeout(() => {
            const changes: Partial<Clip> = {
                isGenerating: false,
                isPendingConfirmation: true
            };

            if (selectedClip.trackId === 'subtitle') {
                const newDuration = 3 + Math.random() * 5;
                changes.duration = Math.round(newDuration * 10) / 10;
                changes.originalDuration = changes.duration;
                changes.content = prompt;
            }

            dispatch({
                type: 'UPDATE_CLIP',
                payload: {
                    id: selectedClipId,
                    changes
                }
            });
        }, 3000);
    };

    const handleConfirmVideo = () => {
        if (selectedClipId) {
            dispatch({
                type: 'UPDATE_CLIP',
                payload: {
                    id: selectedClipId,
                    changes: { isPendingConfirmation: false }
                }
            });
            setPreviewExtensionState(null); // Clear snapshot on confirm
            setIsModalOpen(false);
        }
    };

    const handleRegenerateFromConfirmation = () => {
        if (selectedClipId) {
            // Revert if we have a snapshot (e.g. for subtitle duration change)
            if (previewExtensionState && previewExtensionState.clipId === selectedClipId) {
                dispatch({
                    type: 'RESTORE_CLIPS',
                    payload: previewExtensionState.snapshot
                });
                setPreviewExtensionState(null);
            } else {
                dispatch({
                    type: 'UPDATE_CLIP',
                    payload: {
                        id: selectedClipId,
                        changes: { isPendingConfirmation: false }
                    }
                });
            }
        }
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
        const cleanDuration = Math.round(newDuration * 10) / 10;

        if (creationState) {
            setCreationState({
                ...creationState,
                duration: cleanDuration
            });
            return;
        }

        if (selectedClipId) {
            const clip = clips.find(c => c.id === selectedClipId);
            if (!clip) return;

            let finalDuration = cleanDuration;
            if (clip.extensionStart) {
                finalDuration = clip.extensionStart + cleanDuration;
            }

            dispatch({
                type: 'UPDATE_CLIP',
                payload: {
                    id: selectedClipId,
                    changes: {
                        duration: Math.round(finalDuration * 10) / 10
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
            className="mx-4 mb-4 bg-timeline/95 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col shrink-0 select-none overflow-hidden shadow-2xl z-40"
        >





            {/* Timeline Tracks Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-auto relative custom-scrollbar"
            >
                <div className="min-w-full relative" style={{ width: timelineWidth }}>
                    {/* Time Ruler */}
                    <div
                        className="h-8 border-b border-white/10 flex items-end text-[10px] text-muted-foreground select-none bg-[#1e1e1e] sticky top-0 z-40"
                        onClick={handleTimelineClick}
                    >
                        {/* Zoom Controls (Sticky Left) */}
                        <div className="sticky left-0 w-24 h-full bg-[#1e1e1e] border-r border-white/10 flex items-center justify-center gap-2 px-2 z-50 shrink-0">
                            <Search className="w-3 h-3 text-neutral-500" />
                            <div className="flex-1 h-1 bg-neutral-700 rounded-full relative group cursor-pointer">
                                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-neutral-500 rounded-full group-hover:bg-neutral-400 transition-colors"></div>
                            </div>
                            <Search className="w-3 h-3 text-neutral-500" />
                        </div>

                        {Array.from({ length: Math.ceil(duration) + 2 }).map((_, i) => (
                            <div key={i} className="absolute bottom-0 border-l border-neutral-700 h-2 pl-1" style={{ left: i * zoom + 96 }}> {/* +96 for header width */}
                                {i % 5 === 0 && <span>{formatTime(i).slice(0, 5)}</span>}
                            </div>
                        ))}
                        {/* Sub-ticks */}
                        {Array.from({ length: (Math.ceil(duration) + 2) * 5 }).map((_, i) => (
                            <div key={`sub-${i}`} className="absolute bottom-0 border-l border-neutral-800 h-1" style={{ left: i * (zoom / 5) + 96 }}></div>
                        ))}
                    </div>

                    {/* Tracks */}
                    <div className="flex flex-col relative" onClick={handleTimelineClick}>
                        {/* Subtitle Track */}
                        <div className="h-16 border-b border-white/5 flex relative group">
                            <div className="w-24 shrink-0 border-r border-white/10 flex items-center gap-2 px-3 bg-[#1e1e1e] z-30 sticky left-0">
                                <Type className="w-4 h-4 text-neutral-400" />
                                <span className="text-xs text-neutral-400 font-medium">旁白/字幕</span>
                            </div>
                            <div className="flex-1 bg-track relative min-w-0">
                                {clips.filter(c => c.trackId === 'subtitle').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} />
                                ))}

                                {/* Render Add Buttons in Gaps for Subtitle Track */}
                                {(() => {
                                    const subtitleClips = clips.filter(c => c.trackId === 'subtitle').sort((a, b) => a.startTime - b.startTime);
                                    const gaps = [];

                                    // Gap before first clip
                                    if (subtitleClips.length > 0 && subtitleClips[0].startTime > 0) {
                                        const duration = subtitleClips[0].startTime;
                                        const width = duration < 10 ? duration * zoom : 5 * zoom;
                                        gaps.push(
                                            <HoverAddButton
                                                key="sub-start-gap"
                                                left={0}
                                                width={width}
                                                onClick={() => handleAddClick(0, duration < 10 ? duration : 5, 'subtitle')}
                                            />
                                        );
                                    } else if (subtitleClips.length === 0) {
                                        // Empty track
                                        gaps.push(
                                            <HoverAddButton
                                                key="sub-empty-gap"
                                                left={0}
                                                width={5 * zoom}
                                                onClick={() => handleAddClick(0, 5, 'subtitle')}
                                            />
                                        );
                                    }

                                    // Gaps between clips
                                    for (let i = 0; i < subtitleClips.length - 1; i++) {
                                        const currentEnd = subtitleClips[i].startTime + subtitleClips[i].duration;
                                        const nextStart = subtitleClips[i + 1].startTime;
                                        const gapDuration = nextStart - currentEnd;

                                        if (gapDuration > 0.1) {
                                            const width = gapDuration < 10 ? gapDuration * zoom : 5 * zoom;
                                            gaps.push(
                                                <HoverAddButton
                                                    key={`sub-gap-${i}`}
                                                    left={currentEnd * zoom}
                                                    width={width}
                                                    onClick={() => handleAddClick(currentEnd, gapDuration < 10 ? gapDuration : 5, 'subtitle')}
                                                />
                                            );
                                        }
                                    }

                                    // Gap after last clip
                                    if (subtitleClips.length > 0) {
                                        const lastClip = subtitleClips[subtitleClips.length - 1];
                                        const currentEnd = lastClip.startTime + lastClip.duration;
                                        gaps.push(
                                            <HoverAddButton
                                                key="sub-end-gap"
                                                left={currentEnd * zoom}
                                                width={5 * zoom}
                                                onClick={() => handleAddClick(currentEnd, 5, 'subtitle')}
                                            />
                                        );
                                    }

                                    return gaps;
                                })()}
                            </div>
                        </div>

                        {/* Video Track */}
                        <div className="h-16 border-b border-white/5 flex relative group">
                            <div className="w-24 shrink-0 border-r border-white/10 flex items-center gap-2 px-3 bg-[#1e1e1e] z-30 sticky left-0">
                                <Video className="w-4 h-4 text-neutral-400" />
                                <span className="text-xs text-neutral-400 font-medium">视频</span>
                            </div>
                            <div className="flex-1 bg-track relative min-w-0">
                                {clips.filter(c => c.trackId === 'video').map(clip => (
                                    <ClipItem key={clip.id} clip={clip} />
                                ))}

                                {/* Render Add Buttons in Gaps */}
                                {(() => {
                                    const videoClips = clips.filter(c => c.trackId === 'video').sort((a, b) => a.startTime - b.startTime);
                                    const gaps = [];

                                    // Gap before first clip
                                    if (videoClips.length > 0 && videoClips[0].startTime > 0) {
                                        const duration = videoClips[0].startTime;
                                        // If gap < 10s, fill it. Else 5s button.
                                        const width = duration < 10 ? duration * zoom : 5 * zoom;
                                        gaps.push(
                                            <HoverAddButton
                                                key="start-gap"
                                                left={0}
                                                width={width}
                                                onClick={() => handleAddClick(0, duration < 10 ? duration : 5, 'video')}
                                            />
                                        );
                                    }

                                    // Gaps between clips
                                    for (let i = 0; i < videoClips.length - 1; i++) {
                                        const currentEnd = videoClips[i].startTime + videoClips[i].duration;
                                        const nextStart = videoClips[i + 1].startTime;
                                        const gapDuration = nextStart - currentEnd;

                                        if (gapDuration > 0.1) { // Ignore tiny gaps
                                            const width = gapDuration < 10 ? gapDuration * zoom : 5 * zoom;
                                            gaps.push(
                                                <HoverAddButton
                                                    key={`gap-${i}`}
                                                    left={currentEnd * zoom}
                                                    width={width}
                                                    onClick={() => handleAddClick(currentEnd, gapDuration < 10 ? gapDuration : 5, 'video')}
                                                />
                                            );
                                        }
                                    }

                                    // Gap after last clip
                                    const lastEndTime = videoClips.length > 0
                                        ? videoClips[videoClips.length - 1].startTime + videoClips[videoClips.length - 1].duration
                                        : 0;

                                    gaps.push(
                                        <HoverAddButton
                                            key="end-gap"
                                            left={lastEndTime * zoom}
                                            width={5 * zoom}
                                            onClick={() => handleAddClick(lastEndTime, 5, 'video')}
                                        />
                                    );

                                    return gaps;
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Playhead Line */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-white z-50 pointer-events-none"
                        style={{ left: currentTime * zoom + 96 }}
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

            {/* Timeline Footer (Input / Hint) */}
            <div className="min-h-[80px] flex items-center justify-center bg-[#1a1a1a] border-t border-white/5 relative z-50">
                <div
                    className={`w-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${isModalOpen && (selectedClip || creationState) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    {(selectedClip || creationState) && (
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
                                setCreationState(null);
                            }}
                            onConfirm={handleRegenerateConfirm}
                            onConfirmVideo={handleConfirmVideo}
                            onRegenerateFromConfirmation={handleRegenerateFromConfirmation}
                            currentDuration={creationState ? creationState.duration : modalDuration}
                            onDurationChange={handleDurationChange}
                            videoSrc={selectedClip?.content}
                            initialPrompt={selectedClip?.prompt || ''}
                            onModeChange={handleModeChange}
                            thumbnail={selectedClip?.thumbnail}
                            onThumbnailUpdate={(url) => {
                                if (selectedClip) {
                                    dispatch({
                                        type: 'UPDATE_CLIP',
                                        payload: {
                                            id: selectedClip.id,
                                            changes: { thumbnail: url }
                                        }
                                    });
                                }
                            }}
                            isCreationMode={!!creationState}
                            isPendingConfirmation={selectedClip?.isPendingConfirmation}
                            lastGenerationMode={selectedClip?.lastGenerationMode}
                            trackType={selectedClip ? selectedClip.trackId : creationState?.trackId}
                        />
                    )}
                </div>

                {/* Selection Hint (Default State) */}
                {!selectedClipId && !creationState && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#252525] border border-[#333] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer pointer-events-auto">
                            <MousePointer2 className="w-4 h-4" />
                            <span className="text-sm font-medium">选中片段进行编辑</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function HoverAddButton({ left, width, onClick }: { left: number, width: number, onClick: () => void }) {
    return (
        <div
            className="absolute top-0 bottom-0 z-20 group/add flex items-center justify-center cursor-pointer transition-all hover:bg-white/5 hover:border-2 hover:border-neutral-600 hover:rounded-lg box-border"
            style={{ left, width }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/50 flex items-center justify-center opacity-0 group-hover/add:opacity-100 transition-opacity transform scale-75 group-hover/add:scale-100 duration-200">
                <span className="text-lg font-bold leading-none mb-0.5">+</span>
            </div>
        </div>
    );
}
