'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
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

export default function VideoStudioPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const toast = useToast();

  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'scene' | 'copilot' | 'metadata' | 'publish'>('scene');

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCc, setShowCc] = useState(true);

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
      const res = await fetch(`/api/projects/${id}`);
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

  const handleRetry = async (stage?: string) => {
    try {
      toast.info('Restarting rendering pipeline... ⚡');
      const res = await fetch(`/api/projects/${id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        toast.success('Pipeline queued for retry');
        await fetchProject();
      } else {
        toast.error('Failed to trigger retry');
      }
    } catch (err: any) {
      toast.error(err.message || 'Retry failed');
    }
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
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

  if (error || !data) {
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

  const { project, stages, scenes, output, thumbnail, metadata } = data;
  const isGenerating = project.status === 'PROCESSING' || project.status === 'PENDING';
  const activeScene = scenes[activeSceneIdx] || scenes[0];
  const finalVideoUrl = output ? `/api/assets/${output.storage_key}` : null;
  const srtAsset = data.assets.find((a) => a.asset_type === 'subtitles');
  const vttUrl = srtAsset ? `/api/assets/subtitles/${project.id}/captions.vtt` : null;

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

            <h1
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {project.topic}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {project.status === 'FAILED' && (
            <button onClick={() => handleRetry()} className="btn btn-danger btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>Retry Pipeline</span>
            </button>
          )}

          {output && (
            <a
              href={`/api/assets/${output.storage_key}`}
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
            className="btn btn-primary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Publish to YouTube</span>
          </button>
        </div>
      </div>

      {/* 2. THREE-PANE VIDEO STUDIO WORKSPACE */}
      <div className="studio-workspace">
        {/* LEFT PANE: Scene Cuts List */}
        <div className="studio-pane">
          <div className="pane-header">
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              Scene Cuts ({scenes.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ~{Math.round(scenes.reduce((acc, s) => acc + s.estimated_duration_sec, 0))}s Total
            </span>
          </div>

          <div className="scene-list-container">
            {scenes.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => setActiveSceneIdx(idx)}
                className={`scene-cut-item ${activeSceneIdx === idx ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="scene-cut-index">Scene {s.scene_index}</span>
                  <span className="scene-cut-duration">{s.estimated_duration_sec}s</span>
                </div>
                <div className="scene-cut-text">{s.narration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANE: 1080p Theater Player & Timeline */}
        <div className="studio-theater-column">
          <div className="theater-screen">
            {finalVideoUrl ? (
              <video
                ref={videoRef}
                src={finalVideoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="theater-video"
                crossOrigin="anonymous"
              >
                {showCc && vttUrl && (
                  <track label="English Subtitles" kind="subtitles" srcLang="en" src={vttUrl} default />
                )}
              </video>
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
                {isGenerating && (
                  <div
                    style={{
                      background: 'rgba(6, 7, 10, 0.85)',
                      padding: '16px 24px',
                      borderRadius: 'var(--radius-md)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-glow)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                      ⚡ Generating Scene Visuals & Narration...
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Current Stage: {project.current_stage}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0a0d14',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                {isGenerating ? 'Rendering High-Definition Assets...' : 'No Video Output Rendered'}
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div className="theater-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={togglePlay}
                disabled={!finalVideoUrl}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px' }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <span>Multi-Scene Timeline Scrubber</span>
              <span>{scenes.length} Scene Blocks</span>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!finalVideoUrl}
              className="timeline-scrubber-track"
            />

            <div className="timeline-scenes-track">
              {scenes.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`timeline-scene-block ${activeSceneIdx === idx ? 'active' : ''}`}
                  style={{ flex: Math.max(1, s.estimated_duration_sec) }}
                  title={`Scene ${s.scene_index} (${s.estimated_duration_sec}s)`}
                >
                  S{s.scene_index} ({s.estimated_duration_sec}s)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: AI Inspector, AutoVideo Copilot & Publishing */}
        <div className="studio-pane">
          {/* Tab Switcher */}
          <div className="pane-header" style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
              <button
                onClick={() => setActiveInspectorTab('scene')}
                className={`btn btn-sm ${activeInspectorTab === 'scene' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px' }}
              >
                AI Scene
              </button>
              <button
                onClick={() => setActiveInspectorTab('copilot')}
                className={`btn btn-sm ${activeInspectorTab === 'copilot' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px', background: activeInspectorTab === 'copilot' ? 'var(--gradient-brand)' : 'transparent', color: '#fff' }}
              >
                ⚡ Copilot
              </button>
              <button
                onClick={() => setActiveInspectorTab('metadata')}
                className={`btn btn-sm ${activeInspectorTab === 'metadata' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '11px' }}
              >
                Metadata
              </button>
              <button
                onClick={() => setActiveInspectorTab('publish')}
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

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => handleRetry('VIDEO')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    🔄 Regenerate Scene Visuals
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
