export type TrackType = 'video' | 'subtitle';

export interface Clip {
    id: string;
    trackId: TrackType;
    startTime: number; // in seconds
    duration: number; // in seconds
    originalDuration: number; // max duration constraint
    content: string; // text for subtitle, image/video url for video
    isGenerating?: boolean;
    prompt?: string;
    extensionStart?: number; // Time where the "extension" visual effect begins
    thumbnail?: string;
}

export interface EditorState {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    clips: Clip[];
    selectedClipId: string | null;
    zoom: number; // pixels per second
}

export type EditorAction =
    | { type: 'SET_TIME'; payload: number }
    | { type: 'TOGGLE_PLAY' }
    | { type: 'SELECT_CLIP'; payload: string | null }
    | { type: 'UPDATE_CLIP'; payload: { id: string; changes: Partial<Clip> } }
    | { type: 'SET_GENERATING'; payload: { id: string; isGenerating: boolean } }
    | { type: 'RESTORE_CLIPS'; payload: Clip[] }
    | { type: 'DELETE_CLIP'; payload: string };
