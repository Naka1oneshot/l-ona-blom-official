import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Youtube } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYTApi() {
  if (apiLoaded) return;
  apiLoaded = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    readyCallbacks.forEach(cb => cb());
    readyCallbacks.length = 0;
  };
}

function onApiReady(cb: () => void) {
  if (apiReady) cb();
  else readyCallbacks.push(cb);
}

const YouTubePlayer = ({ videoId, className = '' }: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const iframeId = useRef(`yt-${videoId}-${Math.random().toString(36).slice(2, 8)}`);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(80);
  const [showControls, setShowControls] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadYTApi();
    onApiReady(() => {
      playerRef.current = new window.YT.Player(iframeId.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: videoId,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volume);
          },
        },
      });
    });
    return () => {
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) { p.pauseVideo(); setPlaying(false); }
    else { p.playVideo(); setPlaying(true); }
  }, [playing]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); p.setVolume(volume); setMuted(false); }
    else { p.mute(); setMuted(true); }
  }, [muted, volume]);

  const handleVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    if (v === 0) { p.mute(); setMuted(true); }
    else if (muted) { p.unMute(); setMuted(false); }
  }, [muted]);

  const goFullscreen = useCallback(() => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) {
      if (iframe.requestFullscreen) iframe.requestFullscreen();
    }
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(hideTimer.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolume(false);
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ paddingBottom: '56.25%' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div id={iframeId.current} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Play/Pause */}
        <button onClick={togglePlay} className="text-white/90 hover:text-white transition-colors" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Volume */}
        <div className="relative flex items-center gap-1.5" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
          <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors" aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className={`transition-all duration-200 overflow-hidden ${showVolume ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
            <Slider
              value={[muted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolume}
              className="w-full [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:h-3 [&_[data-slot=slider-thumb]]:w-3 [&_[data-slot=slider-thumb]]:border-white"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* YouTube link */}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Voir sur YouTube"
        >
          <Youtube size={18} />
        </a>

        {/* Fullscreen */}
        <button onClick={goFullscreen} className="text-white/90 hover:text-white transition-colors" aria-label="Plein écran">
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayer;
