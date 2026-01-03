/**
 * Lesson Player Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  BookOpen,
  MessageSquare,
  Rewind,
  FastForward
} from 'lucide-react';
import { useVideoPlayer } from '../shared/hooks';
import { LessonWithRelations, VideoPlayerState } from '../shared/types';

interface LessonPlayerProps {
  lesson: LessonWithRelations;
  onProgress: (progress: { currentTime: number; duration: number }) => void;
  onComplete: () => void;
  showTranscript?: boolean;
  showNotes?: boolean;
  className?: string;
}

export function LessonPlayer({
  lesson,
  onProgress,
  onComplete,
  showTranscript = false,
  showNotes = false,
  className = ''
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes'>('transcript');
  const [userNotes, setUserNotes] = useState('');
  const [transcript, setTranscript] = useState<Array<{
    start: number;
    end: number;
    text: string;
  }>>([]);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    captions,
    play,
    pause,
    toggle,
    seek,
    setCurrentTime,
    setDuration,
    setVolume,
    setPlaybackRate,
    setCaptions
  } = useVideoPlayer();

  // Auto-hide controls
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      setShowControls(true);
      timer = setTimeout(() => {
        if (isPlaying && !showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };

    resetTimer();

    const handleMouseMove = () => resetTimer();
    const handleClick = () => resetTimer();

    if (videoRef.current) {
      videoRef.current.addEventListener('mousemove', handleMouseMove);
      videoRef.current.addEventListener('click', handleClick);
    }

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.removeEventListener('mousemove', handleMouseMove);
        videoRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [isPlaying, showSettings]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgress({ currentTime: video.currentTime, duration: video.duration });

      // Auto-complete lesson when video ends
      if (video.currentTime >= video.duration * 0.95) {
        onComplete();
      }
    };

    const handlePlay = () => play();
    const handlePause = () => pause();

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onProgress, onComplete, play, pause, setCurrentTime, setDuration]);

  // Sync video with player state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play();
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }

    video.volume = volume;
    video.playbackRate = playbackRate;
  }, [isPlaying, volume, playbackRate]);

  // Handle seek
  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    seek(time);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mock transcript data
  useEffect(() => {
    setTranscript([
      { start: 0, end: 5, text: "Welcome to this lesson on advanced concepts." },
      { start: 5, end: 12, text: "Today we'll be covering the fundamental principles that will help you understand the core concepts." },
      { start: 12, end: 20, text: "Let's start by examining the basic structure and how it relates to our previous lessons." },
      // Add more transcript segments...
    ]);
  }, []);

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Player */}
      <div className="relative group">
        <video
          ref={videoRef}
          src={lesson.videoUrl || '/videos/sample-lesson.mp4'}
          className="w-full aspect-video bg-black"
          poster={lesson.course?.thumbnail || '/api/placeholder/800/450'}
          onClick={toggle}
        />

        {/* Video Overlay Controls */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50
            flex items-center justify-center
            transition-opacity duration-300
            ${showControls ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Center Play/Pause Button */}
          <button
            onClick={toggle}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <Pause size={32} className="text-white ml-1" />
            ) : (
              <Play size={32} className="text-white ml-2" />
            )}
          </button>
        </div>

        {/* Controls Bar */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4
            transition-opacity duration-300
            ${showControls ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-1 bg-white/20 rounded-full cursor-pointer">
              <div
                className="absolute top-0 left-0 h-full bg-miyabi-blue rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={toggle}
                className="p-2 text-white hover:text-miyabi-blue transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                className="p-2 text-white hover:text-miyabi-blue transition-colors"
                title="Rewind 10s"
              >
                <Rewind size={20} />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                className="p-2 text-white hover:text-miyabi-blue transition-colors"
                title="Forward 10s"
              >
                <FastForward size={20} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  className="p-2 text-white hover:text-miyabi-blue transition-colors"
                >
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-miyabi-blue"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1 focus:outline-none focus:border-miyabi-blue"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Captions Toggle */}
              <button
                onClick={() => setCaptions(!captions)}
                className={`p-2 transition-colors ${
                  captions ? 'text-miyabi-blue' : 'text-white hover:text-miyabi-blue'
                }`}
                title="Toggle captions"
              >
                <MessageSquare size={20} />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-white hover:text-miyabi-blue transition-colors"
              >
                <Settings size={20} />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:text-miyabi-blue transition-colors"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute bottom-20 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-48">
            <h4 className="text-white font-medium mb-3">Playback Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Quality</label>
                <select className="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-miyabi-blue">
                  <option>Auto (720p)</option>
                  <option>1080p</option>
                  <option>720p</option>
                  <option>480p</option>
                  <option>360p</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Captions</label>
                <select className="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-miyabi-blue">
                  <option>Off</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Info Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
            {lesson.description && (
              <p className="text-gray-400 text-sm mt-1">{lesson.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lesson.attachments && lesson.attachments.length > 0 && (
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                <Download size={16} />
                <span className="text-sm">Resources</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab(activeTab === 'transcript' ? 'notes' : 'transcript')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              <BookOpen size={16} />
              <span className="text-sm">
                {activeTab === 'transcript' ? 'Notes' : 'Transcript'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Transcript and Notes */}
      {(showTranscript || showNotes) && (
        <div className="bg-gray-800 p-4">
          <div className="flex border-b border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transcript'
                  ? 'border-miyabi-blue text-miyabi-blue'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-miyabi-blue text-miyabi-blue'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              My Notes
            </button>
          </div>

          {activeTab === 'transcript' && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {transcript.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => handleSeek(segment.start)}
                  className={`block w-full text-left p-2 rounded text-sm transition-colors ${
                    currentTime >= segment.start && currentTime < segment.end
                      ? 'bg-miyabi-blue/20 text-miyabi-blue'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs text-gray-500 mr-2">
                    {formatTime(segment.start)}
                  </span>
                  {segment.text}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Take notes while watching the lesson..."
                className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>Auto-saved at {formatTime(currentTime)}</span>
                <span>{userNotes.length}/2000 characters</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonPlayer;