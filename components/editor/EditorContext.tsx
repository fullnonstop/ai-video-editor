"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Clip, EditorState, TrackType, EditorAction } from './types';

type Action = EditorAction;

const initialState: EditorState = {
    currentTime: 0,
    duration: 120, // 2 minutes default
    isPlaying: false,
    selectedClipId: null,
    zoom: 50, // 50px per second
    clips: [
        // Generate video clips from imported files with Istanbul history prompts
        ...Array.from({ length: 10 }).map((_, i) => {
            const prompts = [
                "清晨的伊斯坦布尔，蓝色清真寺在晨雾中若隐若现，海鸥在博斯普鲁斯海峡上空盘旋。",
                "圣索菲亚大教堂宏伟的穹顶，阳光透过彩色玻璃窗洒在古老的大理石地面上。",
                "热闹的大巴扎集市，五颜六色的香料堆积如山，精美的土耳其地毯挂满墙壁。",
                "加拉塔大桥上垂钓的人们，远处是金角湾的波光粼粼和城市的剪影。",
                "地下水宫幽暗神秘的氛围，巨大的石柱倒映在水中，美杜莎头像静静注视。",
                "托普卡帕宫的庭院，郁金香盛开，远处可以眺望到马尔马拉海的壮丽景色。",
                "独立大街上红色的复古电车缓缓驶过，两旁是熙熙攘攘的人群和欧式建筑。",
                "博斯普鲁斯海峡上的游船，连接欧亚两洲的跨海大桥在夕阳下熠熠生辉。",
                "古老的城墙遗址，见证了拜占庭和奥斯曼帝国的兴衰，爬山虎在墙缝中生长。",
                "夜晚的伊斯坦布尔，灯火辉煌，清真寺的宣礼塔在夜空中轮廓分明。"
            ];

            const voiceovers = [
                "公元前667年，来自麦加拉的希腊殖民者在此建立拜占庭，开启了这座城市千年的传奇。",
                "330年，君士坦丁大帝迁都于此，更名为君士坦丁堡，成为罗马帝国的新中心。",
                "查士丁尼大帝时期，圣索菲亚大教堂建成，象征着拜占庭帝国建筑艺术的巅峰。",
                "1204年，第四次十字军东征攻陷君士坦丁堡，城市遭到洗劫，帝国元气大伤。",
                "1453年，奥斯曼苏丹穆罕默德二世攻占君士坦丁堡，拜占庭帝国灭亡，城市更名为伊斯坦布尔。",
                "苏莱曼大帝统治时期，奥斯曼帝国达到鼎盛，伊斯坦布尔成为伊斯兰世界的文化中心。",
                "19世纪，奥斯曼帝国推行坦志麦特改革，伊斯坦布尔开始呈现出东西方交融的近代化风貌。",
                "1923年，土耳其共和国成立，首都迁往安卡拉，但伊斯坦布尔依然是土耳其的经济和文化心脏。",
                "如今的伊斯坦布尔，横跨欧亚两洲，是世界上唯一一座跨越两个大洲的国际大都市。",
                "历史的厚重与现代的活力在这里交织，伊斯坦布尔永远诉说着文明的故事。"
            ];

            return [
                {
                    id: `vid-${i + 1}`,
                    trackId: 'video' as const,
                    startTime: i * 4, // 4 seconds each
                    duration: 4,
                    originalDuration: 10, // Assume 10s source
                    content: `/videos/${i + 1}.mp4`,
                    prompt: prompts[i]
                },
                {
                    id: `sub-${i + 1}`,
                    trackId: 'subtitle' as const,
                    startTime: i * 4,
                    duration: 4,
                    originalDuration: 4,
                    content: voiceovers[i],
                    prompt: voiceovers[i] // Use content as prompt for now
                }
            ];
        }).flat()
    ]
};

function editorReducer(state: EditorState, action: Action): EditorState {
    switch (action.type) {
        case 'SET_TIME':
            return { ...state, currentTime: Math.max(0, Math.min(action.payload, state.duration)) };
        case 'TOGGLE_PLAY':
            return { ...state, isPlaying: !state.isPlaying };
        case 'SELECT_CLIP':
            return { ...state, selectedClipId: action.payload };
        case 'UPDATE_CLIP': {
            const { id, changes } = action.payload;
            const clipIndex = state.clips.findIndex(c => c.id === id);
            if (clipIndex === -1) return state;

            const oldClip = state.clips[clipIndex];
            const updatedClip = { ...oldClip, ...changes };

            // Create a new clips array
            let newClips = [...state.clips];
            newClips[clipIndex] = updatedClip;

            // Ripple Logic (Collision-based)
            // Only trigger if duration changed
            if (changes.duration !== undefined && changes.duration !== oldClip.duration) {
                const durationDelta = changes.duration - oldClip.duration;

                // Only ripple if extending (delta > 0)
                if (durationDelta > 0) {
                    // Sort clips by startTime to process in order
                    const trackClips = newClips
                        .filter(c => c.trackId === updatedClip.trackId && c.id !== updatedClip.id && c.startTime >= updatedClip.startTime)
                        .sort((a, b) => a.startTime - b.startTime);

                    let currentEndTime = updatedClip.startTime + updatedClip.duration;

                    for (const nextClip of trackClips) {
                        // If overlap (or touching if we want strict no-gap, but usually overlap)
                        // Using a small epsilon for float comparison safety if needed, but strict > is usually fine
                        if (currentEndTime > nextClip.startTime) {
                            // Shift this clip
                            const shift = currentEndTime - nextClip.startTime;
                            const nextClipIndex = newClips.findIndex(c => c.id === nextClip.id);
                            if (nextClipIndex !== -1) {
                                newClips[nextClipIndex] = {
                                    ...newClips[nextClipIndex],
                                    startTime: newClips[nextClipIndex].startTime + shift
                                };
                                // Update currentEndTime for the next iteration
                                currentEndTime = newClips[nextClipIndex].startTime + newClips[nextClipIndex].duration;
                            }
                        } else {
                            // If no overlap with this one, and since they are sorted, 
                            // we might stop? No, because a later clip might have been pushed by this one?
                            // Actually, if we don't touch this one, we don't push it, so we don't push subsequent ones *via* this one.
                            // But we should continue checking just in case? 
                            // Optimization: if no overlap, we can stop because subsequent clips are even further away.
                            break;
                        }
                    }
                }
            }

            // Also handle startTime change for drag-move ripple (reordering)
            if (changes.startTime !== undefined && changes.startTime !== oldClip.startTime) {
                // Get indices of all clips on this track, sorted by startTime
                // Prioritize the target clip (the one being moved) if start times are equal to allow reordering
                const trackId = updatedClip.trackId;
                const trackClipsIndices = newClips
                    .map((c, index) => ({ c, index }))
                    .filter(item => item.c.trackId === trackId)
                    .sort((a, b) => {
                        const diff = a.c.startTime - b.c.startTime;
                        if (Math.abs(diff) < 0.01) { // Treat very close times as equal
                            if (a.c.id === id) return -1; // Target comes first
                            if (b.c.id === id) return 1;
                        }
                        return diff;
                    });

                // Find where our target clip is in this sorted list
                const sortedTargetIndex = trackClipsIndices.findIndex(item => item.c.id === id);

                // We need to check collisions against ALL other clips, not just subsequent ones in the old order,
                // because moving a clip might make it collide with a previous clip or a later clip.
                // However, the requirement is "switching after automatic backward shift" (ripple push).
                // Simple approach: Sort by start time. Iterate. If overlap, push next one.

                for (let i = 0; i < trackClipsIndices.length - 1; i++) {
                    const currentItem = trackClipsIndices[i];
                    const nextItem = trackClipsIndices[i + 1];

                    const currentClip = newClips[currentItem.index];
                    const nextClip = newClips[nextItem.index];

                    const currentEndTime = currentClip.startTime + currentClip.duration;

                    // If overlap
                    if (currentEndTime > nextClip.startTime) {
                        // Shift next clip
                        newClips[nextItem.index] = {
                            ...nextClip,
                            startTime: currentEndTime
                        };
                    }
                }
            }

            // Recalculate total duration based on the new clip positions
            const maxEndTime = Math.max(...newClips.map(c => c.startTime + c.duration));

            return {
                ...state,
                clips: newClips,
                // Ensure duration accommodates all clips, but doesn't necessarily shrink below previous duration 
                // (unless we want to allow shrinking? let's keep it monotonic for now or just maxEndTime)
                duration: Math.max(state.duration, maxEndTime)
            };
        }
        case 'RESTORE_CLIPS': {
            return {
                ...state,
                clips: action.payload
            };
        }
        case 'DELETE_CLIP':
            return {
                ...state,
                clips: state.clips.filter(clip => clip.id !== action.payload),
                selectedClipId: state.selectedClipId === action.payload ? null : state.selectedClipId
            };
        case 'ADD_CLIP':
            return {
                ...state,
                clips: [...state.clips, action.payload],
                selectedClipId: action.payload.id,
                duration: Math.max(state.duration, action.payload.startTime + action.payload.duration)
            };
        case 'SET_GENERATING':
            return {
                ...state,
                clips: state.clips.map(clip =>
                    clip.id === action.payload.id ? { ...clip, isGenerating: action.payload.isGenerating } : clip
                )
            };
        default:
            return state;
    }
}

const EditorContext = createContext<{
    state: EditorState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(editorReducer, initialState);

    return (
        <EditorContext.Provider value={{ state, dispatch }}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) throw new Error('useEditor must be used within EditorProvider');
    return context;
}
