/**
 * Interactive Video Player Component
 * Advanced video player with chapters, captions, analytics, and note-taking
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { VideoContent, VideoChapter, VideoCaption, VideoInteraction } from '@/lib/video/video-service';
import { videoService } from '@/lib/video/video-service';

interface VideoPlayerProps {
  videoId: string;
  userId: string;
  autoplay?: boolean;
  startTime?: number;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  className?: string;
}

interface VideoNote {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface PlaybackSettings {
  playbackRate: number;
  quality: string;
  volume: number;
  captions: boolean;
  captionLanguage: string;
}

export default function VideoPlayer({
  videoId,
  userId,
  autoplay = false,
  startTime = 0,
  onProgress,
  onComplete,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [captions, setCaptions] = useState<VideoCaption[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Settings
  const [settings, setSettings] = useState<PlaybackSettings>({
    playbackRate: 1.0,
    quality: 'auto',
    volume: 1.0,
    captions: false,
    captionLanguage: 'en',
  });

  // Current chapter
  const [currentChapter, setCurrentChapter] = useState<VideoChapter | null>(null);

  // Hide controls timer
  const hideControlsTimer = useRef<NodeJS.Timeout>();

  // Load video content and related data
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const content = await videoService.getVideoContent(videoId);
        if (!content) {
          throw new Error('Video not found');
        }

        setVideoContent(content);
        setChapters(content.chapters);

        // Load captions if available
        if (content.captions) {
          setCaptions(content.captions);
          setSettings(prev => ({
            ...prev,
            captions: content.captions!.length > 0,
          }));
        }

        setDuration(content.duration);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
        console.error('Error loading video:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [videoId]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (startTime > 0) {
        videoRef.current.currentTime = startTime;
      }
    }
  }, [startTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && duration > 0) {
      const current = videoRef.current.currentTime;
      const prog = (current / duration) * 100;

      setCurrentTime(current);
      setProgress(prog);
      onProgress?.(prog, current);

      // Update current chapter
      const chapter = chapters.find(
        ch => current >= ch.startTime && current <= ch.endTime,
      );
      setCurrentChapter(chapter || null);

      // Track viewing progress
      trackInteraction({
        type: 'seek',
        timestamp: Date.now(),
        videoTime: current,
      });
    }
  }, [duration, chapters, onProgress]);

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / duration) * 100;
        setBuffered(bufferedPercent);
      }
    }
  }, [duration]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();

    trackInteraction({
      type: 'pause',
      timestamp: Date.now(),
      videoTime: duration,
    });
  }, [duration, onComplete]);

  // Playback controls
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        trackInteraction({
          type: 'pause',
          timestamp: Date.now(),
          videoTime: currentTime,
        });
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        trackInteraction({
          type: 'play',
          timestamp: Date.now(),
          videoTime: currentTime,
        });
      }
    }
  }, [isPlaying, currentTime]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      trackInteraction({
        type: 'seek',
        timestamp: Date.now(),
        videoTime: time,
      });
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setSettings(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const changeVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setSettings(prev => ({ ...prev, volume }));
    }
  }, []);

  // Chapter navigation
  const goToChapter = useCallback((chapter: VideoChapter) => {
    seekTo(chapter.startTime);
    setShowChapters(false);

    trackInteraction({
      type: 'chapter_change',
      timestamp: Date.now(),
      videoTime: chapter.startTime,
      data: { chapterId: chapter.id, title: chapter.title },
    });
  }, [seekTo]);

  // Note-taking
  const addNote = useCallback(async () => {
    if (!newNote.trim()) {return;}

    const note: VideoNote = {
      id: `note_${Date.now()}`,
      timestamp: currentTime,
      content: newNote.trim(),
      createdAt: new Date(),
    };

    setNotes(prev => [...prev, note].sort((a, b) => a.timestamp - b.timestamp));
    setNewNote('');
    setAddingNote(false);

    trackInteraction({
      type: 'note_add',
      timestamp: Date.now(),
      videoTime: currentTime,
      data: { noteContent: note.content },
    });

    // In a real implementation, save note to database
  }, [newNote, currentTime]);

  const goToNote = useCallback((note: VideoNote) => {
    seekTo(note.timestamp);
    setShowNotes(false);
  }, [seekTo]);

  // Analytics tracking
  const trackInteraction = useCallback((interaction: VideoInteraction) => {
    videoService.trackInteraction(videoId, userId, interaction);
  }, [videoId, userId]);

  // Control visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }

    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <p className="mb-4">Error loading video: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!videoContent) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white">Video not found</div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={showControlsTemporarily}
      onMouseMove={showControlsTemporarily}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoContent.url}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
        preload="metadata"
        autoPlay={autoplay}
      />

      {/* Video Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-2 bg-gray-600 rounded-full">
              {/* Buffered Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-gray-400 rounded-full"
                style={{ width: `${buffered}%` }}
              ></div>
              {/* Playback Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
              {/* Seek Handle */}
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />

              {/* Chapter Markers */}
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="absolute top-0 w-1 h-full bg-yellow-400 opacity-70"
                  style={{ left: `${(chapter.startTime / duration) * 100}%` }}
                  title={chapter.title}
                />
              ))}

              {/* Note Markers */}
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="absolute top-0 w-1 h-full bg-green-400 opacity-70"
                  style={{ left: `${(note.timestamp / duration) * 100}%` }}
                  title={note.content}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="hover:text-blue-400 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Current Chapter */}
              {currentChapter && (
                <div className="text-sm text-blue-400">
                  {currentChapter.title}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Notes Button */}
              <button
                onClick={() => setAddingNote(true)}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title="Add Note"
              >
                📝
              </button>

              {/* Chapters Button */}
              {chapters.length > 0 && (
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Chapters"
                >
                  📚
                </button>
              )}

              {/* Notes List Button */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-2 hover:bg-white/20 rounded transition-colors ${notes.length > 0 ? 'text-green-400' : ''}`}
                title={`Notes (${notes.length})`}
              >
                📋
              </button>

              {/* Captions Button */}
              {captions.length > 0 && (
                <button
                  onClick={() => setSettings(prev => ({ ...prev, captions: !prev.captions }))}
                  className={`p-2 hover:bg-white/20 rounded transition-colors ${settings.captions ? 'text-blue-400' : ''}`}
                  title="Captions"
                >
                  CC
                </button>
              )}

              {/* Playback Speed */}
              <select
                value={settings.playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-gray-600"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-16"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Panel */}
      {showChapters && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/90 text-white p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Chapters</h3>
            <button
              onClick={() => setShowChapters(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                onClick={() => goToChapter(chapter)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  currentChapter?.id === chapter.id
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{chapter.title}</h4>
                  <span className="text-sm text-gray-400">
                    {formatTime(chapter.startTime)}
                  </span>
                </div>
                {chapter.description && (
                  <p className="text-sm text-gray-400">{chapter.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Panel */}
      {showNotes && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/90 text-white p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notes ({notes.length})</h3>
            <button
              onClick={() => setShowNotes(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => goToNote(note)}
                className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-400">
                    {formatTime(note.timestamp)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {note.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <p className="text-gray-400 text-center">No notes yet</p>
          )}
        </div>
      )}

      {/* Add Note Modal */}
      {addingNote && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Add Note at {formatTime(currentTime)}
            </h3>

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              className="w-full h-24 p-3 bg-gray-700 text-white rounded resize-none"
              autoFocus
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setAddingNote(false);
                  setNewNote('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
