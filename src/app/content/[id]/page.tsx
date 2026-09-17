'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface StageInfo {
  stage: string;
  status: string;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ProjectMetadata {
  youtubeTitle: string;
  description: string;
  tags: string[];
  category: string;
  thumbnailConcepts?: Array<{
    title: string;
    style: string;
    description: string;
  }>;
}

interface ProjectData {
  project: {
    id: string;
    topic: string;
    target_length_minutes: number;
    preset: string;
    language: string;
    platform: string;
    status: string;
    current_stage: string;
    error_message?: string | null;
    scheduled_at?: string | null;
    published_at?: string | null;
    publishing_status?: string;
    publish_url?: string | null;
    channel_name: string;
    channel_niche: string;
    channel_voice: string;
    channel_visual_style: string;
  };
  stages: StageInfo[];
  scenes: Array<{
    id: string;
    scene_index: number;
    narration: string;
    visual_prompt: string;
    visual_subject?: string;
    environment?: string;
    camera_movement?: string;
    lighting?: string;
    continuity_notes?: string;
    estimated_duration_sec: number;
    subtitle_text: string;
  }>;
  assets: Array<{
    id: string;
    asset_type: string;
    storage_key: string;
    url: string;
    duration_sec?: number | null;
  }>;
  output?: {
    id: string;
    storage_key: string;
    url: string;
    duration_sec: number;
    resolution: string;
    filesize_bytes: number;
  } | null;
  thumbnail?: {
    url: string;
    storageKey: string;
  } | null;
  metadata?: ProjectMetadata | null;
  youtubeConnection?: {
    connected: boolean;
    channelTitle?: string;
  };
}

export default function VideoStudioPage({ params }: { params?: any }) {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || (params?.id as string) || '';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const toast = useToast();

  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'scene' | 'copilot' | 'metadata' | 'publish'>('scene');
  const [mobileStudioTab, setMobileStudioTab] = useState<'scenes' | 'inspector' | 'copilot' | 'publish'>('scenes');

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCc, setShowCc] = useState(true);

  // Multi-Scene Cinematic Engine state
  const [playbackMode, setPlaybackMode] = useState<'MULTI_SCENE_AUTO' | 'SOLO_SCENE'>('MULTI_SCENE_AUTO');
  const [rerollMap, setRerollMap] = useState<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Copilot state
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<string | null>(null);
  const [copilotCustomPrompt, setCopilotCustomPrompt] = useState('');

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');
  const [publishScheduleTime, setPublishScheduleTime] = useState('');
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await fetch(`/api/projects/${id}${search}`);
      if (!res.ok) throw new Error('Project not found or access denied');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();

    const interval = setInterval(() => {
      if (data?.project?.status === 'PROCESSING' || data?.project?.status === 'PENDING' || data?.project?.publishing_status === 'UPLOADING') {
        fetchProject();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchProject, data?.project?.status, data?.project?.publishing_status]);

  // Video generation state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  const handleSaveTopic = async () => {
    if (!editedTopic.trim() || savingTopic) return;
    try {
      setSavingTopic(true);
      toast.info('Updating topic and generating fresh video pipeline... 🚀');
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: editedTopic.trim() }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to update topic');
      if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}?topic=${encodeURIComponent(editedTopic.trim())}`;
        window.history.replaceState({}, '', newUrl);
      }
      setIsEditingTopic(false);
      toast.success('Topic updated! Starting video generation... ✨');
      await fetchProject();
      handleGenerateVideo('SCRIPT');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save topic');
    } finally {
      setSavingTopic(false);
    }
  };

  const handleGenerateVideo = async (startStage: string = 'SCRIPT') => {
    try {
      setIsGeneratingVideo(true);
      toast.info('Starting AI video generation pipeline... ⚡');

      const pipelineStages: Array<{ stage: string; label: string }> = [
        { stage: 'SCRIPT', label: '🧠 Generating structured script with AI...' },
        { stage: 'VOICE', label: '🎙️ Synthesizing studio voiceover narration...' },
        { stage: 'SCENES', label: '📐 Calibrating visual scene storyboard...' },
        { stage: 'VIDEO', label: '🎬 Creating 1080p cinematic video clips...' },
        { stage: 'SUBTITLES', label: '📝 Generating synchronized subtitle captions...' },
        { stage: 'FINAL_VIDEO', label: '🎞️ Assembling final 1080p MP4 composition...' },
        { stage: 'THUMBNAIL', label: '🎨 Generating high-CTR video thumbnail...' },
      ];

      const startIdx = pipelineStages.findIndex((s) => s.stage === startStage);
      const executionStages = startIdx >= 0 ? pipelineStages.slice(startIdx) : pipelineStages;

      for (const item of executionStages) {
        setGenerationStep(item.label);
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const res = await fetch(`/api/projects/${id}/retry${search}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: item.stage, singleStageOnly: true, topic: data?.project?.topic }),
        });

        const resJson = await res.json();
        if (!res.ok) {
          throw new Error(resJson.error || `Failed during ${item.stage} stage`);
        }
        await fetchProject();
      }

      toast.success('Video generation complete! 1080p MP4 ready 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setIsGeneratingVideo(false);
      setGenerationStep('');
      await fetchProject();
    }
  };

  const handleRetry = async (stage?: string) => {
    await handleGenerateVideo(stage || 'SCRIPT');
  };

  const handleCopilotAction = async (action: string) => {
    if (!data) return;
    try {
      setCopilotLoading(true);
      setCopilotResult(null);

      const activeScene = data.scenes[activeSceneIdx] || data.scenes[0];
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          topic: data.project.topic,
          currentText: activeScene?.narration || data.project.topic,
          sceneIndex: activeScene?.scene_index || 1,
          niche: data.project.channel_niche,
        }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setCopilotResult(resJson.result);
        toast.success('Copilot response generated ✨');
      } else {
        setCopilotResult(`Error: ${resJson.error}`);
        toast.error(resJson.error || 'Copilot generation failed');
      }
    } catch (err: any) {
      setCopilotResult(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPublishing(true);
      setPublishMsg(null);
      toast.info('Uploading 1080p video to YouTube channel... 🚀');

      const res = await fetch(`/api/projects/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility: publishVisibility,
          scheduleTime: publishScheduleTime || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Publishing failed');

      toast.success('Successfully uploaded & published to YouTube! 🎉');
      setPublishMsg(resData.message || 'Published successfully to YouTube!');
      await fetchProject();
    } catch (err: any) {
      toast.error(err.message || 'Publishing failed');
      setPublishMsg(`Error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const scenes = data?.scenes || [];
  const project = data?.project;

  // Computed scene timeline with exact start and end seconds
  const sceneTimeline = React.useMemo(() => {
    let accumulated = 0;
    return scenes.map((s, idx) => {
      const start = accumulated;
      const dur = Math.max(4, s.estimated_duration_sec || 8);
      accumulated += dur;
      return {
        ...s,
        index: idx,
        startTime: start,
        endTime: accumulated,
        duration: dur,
      };
    });
  }, [scenes]);

  const totalCompositionDuration = React.useMemo(() => {
    if (sceneTimeline.length === 0) return duration || 60;
    return sceneTimeline[sceneTimeline.length - 1].endTime;
  }, [sceneTimeline, duration]);

  // Which scene is currently active based on playback position
  const activeTimelineScene = React.useMemo(() => {
    if (sceneTimeline.length === 0) return null;
    const found = sceneTimeline.find(
      (st) => currentTime >= st.startTime && currentTime < st.endTime
    );
    return found || sceneTimeline[sceneTimeline.length - 1];
  }, [sceneTimeline, currentTime]);

  const displayedScene = playbackMode === 'SOLO_SCENE'
    ? (scenes[activeSceneIdx] || scenes[0])
    : (activeTimelineScene || scenes[activeSceneIdx] || scenes[0]);

  const displayedSceneNum = displayedScene?.scene_index || (activeSceneIdx + 1);
  const currentReroll = rerollMap[displayedSceneNum] || 0;

  // Final / active 1080p video URL
  const finalVideoUrl = data?.output?.url && data.output.url.startsWith('http')
    ? data.output.url
    : data?.output && project
    ? `/api/assets/${data.output.storage_key}?topic=${encodeURIComponent(project.topic)}`
    : null;

  // Active clip URL for the displayed scene (cuts dynamically in MULTI_SCENE_AUTO mode)
  const activeVideoUrl = displayedScene && project?.id
    ? `/api/assets/clips/${project.id}/scene_${displayedSceneNum}_clip_1.mp4?topic=${encodeURIComponent(project.topic)}&scene=${displayedSceneNum}&r=${currentReroll}&prompt=${encodeURIComponent(displayedScene.visual_prompt || '')}`
    : finalVideoUrl;

  const audioAsset = data?.assets?.find((a) => a.asset_type === 'audio');
  const audioUrl = project?.id
    ? (audioAsset && audioAsset.storage_key
        ? `/api/assets/${audioAsset.storage_key}?topic=${encodeURIComponent(project.topic || '')}&lang=${encodeURIComponent(project.language || 'en')}`
        : `/api/assets/voice/${project.id}/narration.mp3?topic=${encodeURIComponent(project.topic || '')}&lang=${encodeURIComponent(project.language || 'en')}`)
    : null;
  const srtAsset = data?.assets?.find((a) => a.asset_type === 'subtitles');
  const vttUrl = srtAsset && project?.id ? `/api/assets/subtitles/${project.id}/captions.vtt` : null;

  // Browser SpeechSynthesis fallback for guaranteed voice narration
  const speakNarration = useCallback((text: string, lang: string = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (!text || !text.trim()) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const langMap: Record<string, string> = {
        ur: 'ur-PK',
        hi: 'hi-IN',
        ar: 'ar-SA',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        en: 'en-US',
      };
      utterance.lang = langMap[lang] || lang || 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }, []);

  // Toggle play/pause synchronized between audio and video
  const togglePlay = () => {
    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch((audioErr) => {
          console.warn('HTML5 Audio playback prevented, falling back to Web Speech synthesis:', audioErr);
          if (displayedScene?.narration) {
            speakNarration(displayedScene.narration, project?.language || 'en');
          }
        });
      } else if (displayedScene?.narration) {
        speakNarration(displayedScene.narration, project?.language || 'en');
      }
      setIsPlaying(true);
    }
  };

  // Synchronized playback ticker across all scene cuts
  useEffect(() => {
    if (!isPlaying) return;
    const tick = setInterval(() => {
      setCurrentTime((prev) => {
        let next = prev + 0.25;
        if (audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0) {
          next = audioRef.current.currentTime;
        }
        if (next >= totalCompositionDuration) {
          setIsPlaying(false);
          if (videoRef.current) videoRef.current.pause();
          if (audioRef.current) audioRef.current.pause();
          return 0;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(tick);
  }, [isPlaying, totalCompositionDuration]);

  const handleTimeUpdate = () => {
    if (videoRef.current && playbackMode === 'SOLO_SCENE') {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(totalCompositionDuration || videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = time % (videoRef.current.duration || 10);
    }
  };

  const handleSelectScene = (idx: number) => {
    setActiveSceneIdx(idx);
    if (playbackMode === 'MULTI_SCENE_AUTO' && sceneTimeline[idx]) {
      const targetTime = sceneTimeline[idx].startTime;
      setCurrentTime(targetTime);
      if (audioRef.current) audioRef.current.currentTime = targetTime;
    }
  };

  const handleRerollActiveScene = () => {
    const sNum = displayedScene?.scene_index || (activeSceneIdx + 1);
    setRerollMap((prev) => ({
      ...prev,
      [sNum]: (prev[sNum] || 0) + 1,
    }));
    toast.success(`Scene ${sNum} visual switched to alternate 1080p shot! ✨`);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="content-container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading AutoVideo Studio...</div>
      </div>
    );
  }

  if (error || !data || !project) {
    return (
      <div className="content-container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ color: 'var(--status-error)', fontSize: '15px', marginBottom: '14px' }}>
          ⚠️ {error || 'Project not found'}
        </div>
        <Link href="/content" className="btn btn-secondary btn-sm">
          ← Return to Projects
        </Link>
      </div>
    );
  }

  const { stages, output, thumbnail, metadata } = data;
  const isGenerating = project.status === 'PROCESSING' || project.status === 'PENDING';
  const activeScene = displayedScene || scenes[0];

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. STUDIO TOP CONTROL BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 22px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <Link href="/content" className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className={`status-pill ${project.status}`}>{project.status}</span>
              {project.publishing_status && (
                <span className={`status-pill ${project.publishing_status}`}>
                  {project.publishing_status}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {project.channel_name} • {project.target_length_minutes}m
              </span>
            </div>

            {isEditingTopic ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  placeholder="Enter new video topic or prompt..."
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid #6366f1',
                    borderRadius: '6px',
                    color: '#fff',
                    width: '100%',
                    maxWidth: '380px',
                    minWidth: 0,
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTopic}
                  disabled={savingTopic || !editedTopic.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#6366f1' }}
                >
                  {savingTopic ? 'Saving...' : 'Save & Generate Video'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTopic(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {project.topic}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditedTopic(project.topic);
                    setIsEditingTopic(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--text-muted)' }}
                  title="Change this video topic"
                >
                  ✏️ Edit Topic
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleGenerateVideo('SCRIPT')}
            disabled={isGeneratingVideo}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              border: 'none',
              fontWeight: 600,
            }}
          >
            {isGeneratingVideo ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Generating Video...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>{output && project.status === 'COMPLETED' ? '⚡ Re-Generate with AI' : '⚡ Generate Video with AI'}</span>
              </>
            )}
          </button>

          <Link
            href="/content/new"
            className="btn btn-secondary btn-sm"
          >
            + Create New Video
          </Link>

          {output && (
            <a
              href={`/api/assets/${output.storage_key}?topic=${encodeURIComponent(project.topic)}`}
              download={`${project.topic.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`}
              className="btn btn-secondary btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download 1080p MP4</span>
            </a>
          )}

          <button
            onClick={() => setActiveInspectorTab('publish')}
            className="btn btn-secondary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Publish to YouTube</span>
          </button>
        </div>
      </div>

      {/* ERROR DIAGNOSTICS BANNER */}
      {(project.status === 'FAILED' || project.error_message) && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>
                Generation Paused ({project.current_stage || 'PIPELINE'} Stage)
              </div>
              <div style={{ fontSize: '12px', color: '#f87171' }}>
                {project.error_message || 'An error occurred during stage execution. Click retry to re-run pipeline with fallback engine.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleGenerateVideo(project.current_stage || 'SCRIPT')}
            disabled={isGeneratingVideo}
            className="btn btn-sm"
            style={{
              background: '#ef4444',
              color: '#fff',
              fontWeight: 600,
              padding: '6px 14px',
              fontSize: '12px',
            }}
          >
            🔄 Retry Generation
          </button>
        </div>
      )}

      {/* 2. THREE-PANE VIDEO STUDIO WORKSPACE */}
      <div className="studio-workspace">
        {/* LEFT PANE: Scene Cuts List (Hidden on mobile if other tab active) */}
        <div className={`studio-pane studio-pane-left ${mobileStudioTab !== 'scenes' ? 'studio-pane-mobile-hidden' : ''}`}>
          <div className="pane-header">
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              Scene Cuts ({scenes.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ~{Math.round(scenes.reduce((acc, s) => acc + s.estimated_duration_sec, 0))}s Total
            </span>
          </div>

          <div className="scene-list-container">
            {scenes.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No scene cuts generated yet. Click "Generate Video with AI" to create script & scenes.
              </div>
            ) : (
              scenes.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => handleSelectScene(idx)}
                  className={`scene-cut-item ${(displayedSceneNum === s.scene_index) ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="scene-cut-index">Scene {s.scene_index}</span>
                      {rerollMap[s.scene_index] ? (
                        <span style={{ fontSize: '9px', background: '#4f46e5', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                          v{rerollMap[s.scene_index] + 1}
                        </span>
                      ) : null}
                    </div>
                    <span className="scene-cut-duration">{s.estimated_duration_sec}s</span>
                  </div>
                  <div className="scene-cut-text">{s.narration}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER PANE: 1080p Theater Player & Timeline (Pinned to top on mobile) */}
        <div className="studio-theater-column">
          {/* Multi-Scene Engine Mode Switcher Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPlaybackMode('MULTI_SCENE_AUTO')}
                className={`btn btn-sm ${playbackMode === 'MULTI_SCENE_AUTO' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
              >
                🎬 Full Multi-Scene Composition
              </button>
              <button
                onClick={() => setPlaybackMode('SOLO_SCENE')}
                className={`btn btn-sm ${playbackMode === 'SOLO_SCENE' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
              >
                🔍 Solo Scene {displayedSceneNum} Preview
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                VEO 3 / CINEMA-PRO • 1080P 60FPS
              </span>
              <button
                onClick={handleRerollActiveScene}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px', height: '26px', color: '#818cf8' }}
                title="Switch this scene's footage to an alternate 1080p shot"
              >
                🔄 Re-roll B-Roll
              </button>
            </div>
          </div>

          <div className="theater-screen" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background continuous narration audio */}
            {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

            {/* Scene info banner overlay */}
            {displayedScene && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(9, 11, 16, 0.85)',
                  backdropFilter: 'blur(10px)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                <span style={{ color: '#818cf8' }}>● REC</span>
                <span>Scene {displayedSceneNum} / {scenes.length || 1}</span>
                <span style={{ color: '#71717a' }}>|</span>
                <span style={{ color: '#e4e4e7', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayedScene.camera_movement || 'Cinematic Push'}
                </span>
              </div>
            )}

            {activeVideoUrl ? (
              <>
                <video
                  key={`${displayedSceneNum}-${currentReroll}`}
                  ref={videoRef}
                  src={activeVideoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => {
                    if (playbackMode === 'SOLO_SCENE') {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(() => {});
                      }
                    }
                  }}
                  className="theater-video"
                  crossOrigin="anonymous"
                  autoPlay={isPlaying}
                  loop={playbackMode === 'SOLO_SCENE'}
                  playsInline
                />

                {/* Subtitle Caption Overlay */}
                {showCc && displayedScene && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '16px',
                      right: '16px',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.015em',
                        lineHeight: 1.4,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                        maxWidth: '90%',
                      }}
                    >
                      {displayedScene.subtitle_text || displayedScene.narration}
                    </div>
                  </div>
                )}
              </>
            ) : isGeneratingVideo ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #090b10 0%, #0f121a 100%)',
                  padding: '30px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#818cf8',
                    animation: 'spin 0.9s linear infinite',
                    marginBottom: '20px',
                  }}
                />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Generating Autonomous AI Video
                </h3>
                <p style={{ fontSize: '13px', color: '#818cf8', maxWidth: '380px', lineHeight: 1.5 }}>
                  {generationStep || 'Processing multi-scene screenplay, neural voiceover, and 1080p composition...'}
                </p>
              </div>
            ) : thumbnail?.url ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${thumbnail.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() => handleGenerateVideo('SCRIPT')}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    boxShadow: '0 0 25px rgba(0,0,0,0.8)',
                    fontSize: '14px',
                  }}
                >
                  ▶ Render Full 1080p Video
                </button>
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #090b10 0%, #0f121a 100%)',
                  padding: '32px 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', marginBottom: '6px' }}>
                  Ready to Generate Video
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '360px', lineHeight: 1.5, marginBottom: '18px' }}>
                  Generate a full retention-focused screenplay, neural voiceover, cinematic B-roll clips, and 1080p MP4.
                </p>
                <button
                  onClick={() => handleGenerateVideo('SCRIPT')}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                    border: 'none',
                  }}
                >
                  <span>⚡ Generate AI Video (1-Click)</span>
                </button>
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div className="theater-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={togglePlay}
                disabled={!activeVideoUrl && !finalVideoUrl}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px' }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(totalCompositionDuration)}
              </span>

              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, marginLeft: '4px' }}>
                Scene {displayedSceneNum}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = currentTime;
                    audioRef.current.play().catch(() => {});
                  }
                  if (displayedScene?.narration) {
                    speakNarration(displayedScene.narration, project?.language || 'en');
                  }
                  toast.success('🎙️ Spoken voiceover activated');
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                title="Play or test spoken voiceover narration"
              >
                <span>🔊</span>
                <span>Voiceover</span>
              </button>

              <button
                onClick={() => setShowCc(!showCc)}
                className={`btn btn-sm ${showCc ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                CC Subtitles
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="studio-timeline-container">
            <div className="timeline-header">
              <span>Multi-Scene Timeline Scrubber ({formatTime(currentTime)} / {formatTime(totalCompositionDuration)})</span>
              <span>{scenes.length} Scene Blocks • Auto Scene Cuts</span>
            </div>

            <input
              type="range"
              min="0"
              max={totalCompositionDuration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={!activeVideoUrl && !finalVideoUrl}
              className="timeline-scrubber-track"
            />

            <div className="timeline-scenes-track">
              {sceneTimeline.map((s) => (
                <div
                  key={s.id || s.index}
                  onClick={() => handleSelectScene(s.index)}
                  className={`timeline-scene-block ${(displayedSceneNum === s.scene_index) ? 'active' : ''}`}
                  style={{ flex: Math.max(1, s.duration) }}
                  title={`Scene ${s.scene_index} (${s.duration}s): ${s.narration.substring(0, 45)}...`}
                >
                  S{s.scene_index} ({s.duration}s)
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Tab Navigator (Hidden on Desktop, Visible on Mobile <= 1024px) */}
          <div className="studio-mobile-tabs">
            <button
              type="button"
              onClick={() => setMobileStudioTab('scenes')}
              className={mobileStudioTab === 'scenes' ? 'active' : ''}
            >
              🎬 Scene Cuts ({scenes.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileStudioTab('inspector');
                setActiveInspectorTab('scene');
              }}
              className={mobileStudioTab === 'inspector' && activeInspectorTab === 'scene' ? 'active' : ''}
            >
              ⚙️ Inspector
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileStudioTab('copilot');
                setActiveInspectorTab('copilot');
              }}
              className={mobileStudioTab === 'copilot' || (mobileStudioTab !== 'scenes' && activeInspectorTab === 'copilot') ? 'active' : ''}
            >
              ⚡ Copilot
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileStudioTab('publish');
                setActiveInspectorTab('publish');
              }}
              className={mobileStudioTab === 'publish' || (mobileStudioTab !== 'scenes' && activeInspectorTab === 'publish') ? 'active' : ''}
            >
              🚀 Publish
            </button>
          </div>
        </div>

        {/* RIGHT PANE: AI Inspector, AutoVideo Copilot & Publishing (Hidden on mobile if scenes tab is active) */}
        <div className={`studio-pane studio-pane-right ${mobileStudioTab === 'scenes' ? 'studio-pane-mobile-hidden' : ''}`}>
          {/* Tab Switcher */}
          <div className="pane-header" style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
              <button
                onClick={() => {
                  setActiveInspectorTab('scene');
                  setMobileStudioTab('inspector');
                }}
                className={`btn btn-sm ${activeInspectorTab === 'scene' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px' }}
              >
                AI Scene
              </button>
              <button
                onClick={() => {
                  setActiveInspectorTab('copilot');
                  setMobileStudioTab('copilot');
                }}
                className={`btn btn-sm ${activeInspectorTab === 'copilot' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px', background: activeInspectorTab === 'copilot' ? 'var(--gradient-brand)' : 'transparent', color: '#fff' }}
              >
                ⚡ Copilot
              </button>
              <button
                onClick={() => {
                  setActiveInspectorTab('metadata');
                  setMobileStudioTab('inspector');
                }}
                className={`btn btn-sm ${activeInspectorTab === 'metadata' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px' }}
              >
                Metadata
              </button>
              <button
                onClick={() => {
                  setActiveInspectorTab('publish');
                  setMobileStudioTab('publish');
                }}
                className={`btn btn-sm ${activeInspectorTab === 'publish' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px' }}
              >
                Publish
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeInspectorTab === 'scene' && activeScene ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    Scene {displayedSceneNum} Inspector
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px' }}>
                    Veo 3 Pro
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Visual Synthesis Prompt</label>
                  <textarea
                    className="form-textarea"
                    value={activeScene.visual_prompt}
                    readOnly
                    rows={4}
                    style={{ fontSize: '12px', lineHeight: 1.4 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Camera Movement</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeScene.camera_movement || 'Linear glide'}
                      readOnly
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Lighting Style</label>
                    <input
                      type="text"
                      className="form-input"
                      value={activeScene.lighting || 'Cinematic Studio'}
                      readOnly
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subtitle Caption Text</label>
                  <textarea
                    className="form-textarea"
                    value={activeScene.subtitle_text || activeScene.narration}
                    readOnly
                    rows={3}
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={handleRerollActiveScene}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', background: '#4f46e5', color: '#fff', fontWeight: 600 }}
                  >
                    🔄 Re-roll Scene Visual (Change B-Roll Footage)
                  </button>
                  <button
                    onClick={() => {
                      setPlaybackMode(playbackMode === 'SOLO_SCENE' ? 'MULTI_SCENE_AUTO' : 'SOLO_SCENE');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    {playbackMode === 'SOLO_SCENE' ? '🎬 Back to Full Composition' : `🔍 Solo Preview Scene ${displayedSceneNum}`}
                  </button>
                </div>
              </>
            ) : activeInspectorTab === 'copilot' ? (
              /* AutoVideo Copilot Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>⚡</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>AutoVideo Studio Copilot</h3>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Contextual AI assistant for rewriting scene prompts, hooks, and thumbnail concepts.
                  </p>
                </div>

                {/* Copilot Action Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    disabled={copilotLoading}
                    onClick={() => handleCopilotAction('rewrite_scene')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    🎬 Rewrite Cinematic
                  </button>
                  <button
                    disabled={copilotLoading}
                    onClick={() => handleCopilotAction('stronger_hook')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    🔥 Stronger Hook
                  </button>
                  <button
                    disabled={copilotLoading}
                    onClick={() => handleCopilotAction('thumbnail_ideas')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    🎨 Thumbnail Ideas
                  </button>
                  <button
                    disabled={copilotLoading}
                    onClick={() => handleCopilotAction('shorten_narration')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    ✂️ Shorten Scene
                  </button>
                  <button
                    disabled={copilotLoading}
                    onClick={() => handleCopilotAction('generate_titles')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    🏷️ 5 Viral Titles
                  </button>
                </div>

                {/* Copilot Result Box */}
                {copilotLoading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-cyan)', fontSize: '12px' }}>
                    ⚡ Copilot is generating scene optimizations...
                  </div>
                ) : copilotResult ? (
                  <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                      Copilot Output
                    </div>
                    <div style={{ fontSize: '12px', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {copilotResult}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeInspectorTab === 'metadata' && metadata ? (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">YouTube Optimized Title</label>
                  <input type="text" className="form-input" value={metadata.youtubeTitle} readOnly style={{ fontSize: '12px' }} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Video Description</label>
                  <textarea className="form-textarea" value={metadata.description} readOnly rows={6} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tags & Keywords ({metadata.tags?.length || 0})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {metadata.tags?.map((t: string, i: number) => (
                      <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Thumbnail Preview */}
                {thumbnail?.url && (
                  <div style={{ marginTop: '10px' }}>
                    <label className="form-label">Generated 1080p Thumbnail</label>
                    <img
                      src={thumbnail.url}
                      alt="Thumbnail"
                      style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Publish Tab */
              <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    YouTube Direct Publishing
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Upload 1080p video with custom thumbnail and captions to your connected channel.
                  </p>
                </div>

                {publishMsg && (
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: publishMsg.startsWith('Error') ? 'var(--status-error-bg)' : 'var(--status-live-bg)',
                      color: publishMsg.startsWith('Error') ? 'var(--status-error)' : 'var(--status-live)',
                      fontSize: '12px',
                    }}
                  >
                    {publishMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Privacy Visibility</label>
                  <select
                    className="form-select"
                    value={publishVisibility}
                    onChange={(e) => setPublishVisibility(e.target.value as any)}
                  >
                    <option value="PRIVATE">Private (Restricted)</option>
                    <option value="UNLISTED">Unlisted (Link Only)</option>
                    <option value="PUBLIC">Public (Instant Release)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Scheduled Release Slot (Optional)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={publishScheduleTime}
                    onChange={(e) => setPublishScheduleTime(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={publishing || !output}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {publishing ? 'Publishing to YouTube...' : '🚀 Publish to YouTube Now'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
