import { useEffect, useRef, useState } from 'react';

interface VideoFilmstripProps {
    src: string;
    duration: number;
    width: number;
    height: number;
}

export function VideoFilmstrip({ src, duration, width, height }: VideoFilmstripProps) {
    // Calculate number of frames based on width and a target aspect ratio
    // User requested narrower frames for higher density.
    const frameWidth = height * 0.8; // Narrow aspect ratio
    const frameCount = Math.ceil(width / frameWidth);

    return (
        <div className="flex h-full w-full overflow-hidden bg-black">
            {Array.from({ length: frameCount }).map((_, i) => (
                <VideoFrame
                    key={i}
                    src={src}
                    time={(i / frameCount) * duration}
                    width={width / frameCount} // Distribute evenly to fill space
                    height={height}
                />
            ))}
        </div>
    );
}

function VideoFrame({ src, time, width, height }: { src: string, time: number, width: number, height: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const seek = () => {
            video.currentTime = time;
        };

        if (video.readyState >= 1) {
            seek();
        } else {
            video.addEventListener('loadedmetadata', seek);
        }

        const onSeeked = () => {
            setLoaded(true);
        };

        video.addEventListener('seeked', onSeeked);

        return () => {
            video.removeEventListener('loadedmetadata', seek);
            video.removeEventListener('seeked', onSeeked);
        };
    }, [time]);

    return (
        <div style={{ width, height }} className="shrink-0 relative overflow-hidden border-r border-white/10 last:border-0 bg-black">
            <video
                ref={videoRef}
                src={src}
                className={`w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                preload="metadata"
                muted
            />
        </div>
    );
}
