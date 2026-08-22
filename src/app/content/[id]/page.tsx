'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VisualWorkflowCanvas } from '@/components/VisualWorkflowCanvas';


interface StageInfo {
  stage: 'SCRIPT' | 'VOICE' | 'SCENES' | 'VIDEO' | 'SUBTITLES' | 'FINAL_VIDEO' | 'THUMBNAIL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ProjectMetadata {
  youtubeTitle: string;
  description: string;
  tags: string[];
  hashtags: string[];
  shortDescription: string;
  suggestedFilename: string;
}

interface ProjectTelemetry {
  generationStartTime?: string;
  generationEndTime?: string;
  totalGenerationDurationSec?: number;
  sceneCount?: number;
  clipCount?: number;
  audioDurationSec?: number;
  finalVideoDurationSec?: number;
  filesizeBytes?: number;
  providerUsed?: string;
  generationStatus?: string;
  cost?: string;
}

interface ProjectData {
  project: {
    id: string;
    topic: string;
    target_length_minutes: number;
    preset?: string;
    language: string;
    platform?: string;
    visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    current_stage: string;
    publishing_status?: string;
    publish_provider?: string | null;
    publish_video_id?: string | null;
    publish_url?: string | null;
    publish_started_at?: string | null;
    publish_completed_at?: string | null;
    publish_error?: string | null;
    scheduled_at?: string | null;
    error_message?: string | null;
    channel_name: string;
    channel_niche: string;
    channel_voice: string;
    channel_voice_speed?: string;
    channel_visual_style?: string;
    channel_subtitle_style?: string;
    created_at: string;
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
    metadata_json?: string | null;
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
  telemetry?: ProjectTelemetry | null;
  youtubeConnection?: {
    connected: boolean;
    channelId?: string;
    channelTitle?: string;
    accountEmail?: string;
  };
}

const STAGE_LABELS: Record<string, string> = {
  SCRIPT: '1. Script Generation',
  VOICE: '2. Voiceover Synthesis & Timing Probe',
  SCENES: '3. Scene & Timing Calibration',
  VIDEO: '4. Video Clips (8s Sequencing & Continuity)',
  SUBTITLES: '5. Subtitle Synchronization',
  FINAL_VIDEO: '6. Final MP4 Composition',
  THUMBNAIL: '7. Thumbnail Generation (1280x720)',
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retrySelectedStage, setRetrySelectedStage] = useState<string>('VIDEO');
  const [thumbGenerating, setThumbGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Publishing form state
  const [visibility, setVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [publishingNow, setPublishingNow] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.project?.visibility) {
          setVisibility(json.project.visibility);
        }
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Project not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();

    const interval = setInterval(() => {
      if (data?.project.status === 'PENDING' || data?.project.status === 'PROCESSING') {
        fetchProject();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchProject, data?.project.status]);

  const handleRetryStage = async (stageName: string) => {
    try {
      setRetrying(stageName);
      const res = await fetch(`/api/projects/${id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageName }),
      });
      if (res.ok) {
        await fetchProject();
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(null);
    }
  };

  const handleGenerateThumbnail = async () => {
    try {
      setThumbGenerating(true);
      const res = await fetch(`/api/projects/${id}/thumbnail`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchProject();
      }
    } catch (err: any) {
      alert(`Thumbnail generation failed: ${err.message}`);
    } finally {
      setThumbGenerating(false);
    }
  };

  const handlePublish = async (isScheduled: boolean) => {
    try {
      setPublishingNow(true);
      setPublishMessage(null);

      const res = await fetch(`/api/projects/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          scheduleTime: isScheduled && scheduleDate ? new Date(scheduleDate).toISOString() : null,
          platform: 'YouTube',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Publishing failed');
      }

      setPublishMessage({
        type: 'success',
        text: isScheduled ? `Video scheduled for ${scheduleDate}` : `Video published! Video ID: ${resData.videoId || 'Success'}`,
      });
      await fetchProject();
    } catch (err: any) {
      setPublishMessage({ type: 'error', text: err.message });
      await fetchProject();
    } finally {
      setPublishingNow(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const getStatusBadge = (status: StageInfo['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="badge badge-completed">
            <span className="status-dot completed" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="badge badge-processing">
            <span className="status-dot processing" />
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge badge-failed">
            <span className="status-dot failed" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <span className="status-dot pending" />
            PENDING
          </span>
        );
    }
  };

  if (loading && !data) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading project details...</div>;
  }

  if (error || !data) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Error</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error || 'Project not found'}</p>
        <Link href="/content" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { project, stages, scenes, assets, output, thumbnail, metadata, telemetry, youtubeConnection } = data;
  const audioAsset = assets.find((a) => a.asset_type === 'audio');
  const subtitlesAsset = assets.find((a) => a.asset_type === 'subtitles');
  const scriptAsset = assets.find((a) => a.asset_type === 'script');
  const finalVideoAsset = assets.find((a) => a.asset_type === 'final_video');
  const thumbnailAsset = assets.find((a) => a.asset_type === 'thumbnail');
  const failedStage = stages.find((s) => s.status === 'FAILED');


  const pubStatus = project.publishing_status || 'DRAFT';
  const completedCount = stages.filter((s) => s.status === 'COMPLETED').length;
  const progressPct = Math.round((completedCount / (stages.length || 1)) * 100);


  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span className="badge badge-tag">{project.channel_name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{project.channel_niche}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Preset: {project.preset || 'STANDARD'}</span>
          </div>
          <h1 className="page-title">{project.topic}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/content" className="btn btn-secondary">
            Back to Videos
          </Link>
        </div>
      </div>

      {/* n8n-Style Interactive Visual Workflow Canvas */}
      <VisualWorkflowCanvas
        currentStage={project.current_stage || 'SCRIPT'}
        projectStatus={project.status}
        stageProgress={progressPct}
        projectData={{
          topic: project.topic,
          channelName: project.channel_name,
          targetLengthMinutes: project.target_length_minutes,
          niche: project.channel_niche,
          script: scriptAsset ? 'Generated script narration available' : null,
          audioUrl: audioAsset ? (audioAsset.url || `/api/assets/${audioAsset.storage_key}`) : null,
          videoUrl: finalVideoAsset ? (finalVideoAsset.url || `/api/assets/${finalVideoAsset.storage_key}`) : null,
          thumbnailUrl: thumbnailAsset ? (thumbnailAsset.url || `/api/assets/${thumbnailAsset.storage_key}`) : null,
          subtitlesUrl: subtitlesAsset ? (subtitlesAsset.url || `/api/assets/${subtitlesAsset.storage_key}`) : null,

          clipCount: telemetry?.clipCount || 0,
          videoProvider: telemetry?.providerUsed || 'Local FFmpeg',
          publishingStatus: pubStatus,
          publishUrl: project.publish_url,
          visibility: visibility,
        }}
        onRetryStage={handleRetryStage}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Pipeline Execution Stepper, Publishing Controls & Telemetry */}
        <div>
          {/* Pipeline Stepper */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Pipeline Stages</h3>
            <div className="stepper">
              {stages.map((st) => (
                <div key={st.stage} className={`step-item ${st.status.toLowerCase()}`}>
                  <div className="step-row">
                    <div>
                      <div className="step-name">{STAGE_LABELS[st.stage] || st.stage}</div>
                      {st.error_message && (
                        <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
                          Error: {st.error_message}
                        </div>
                      )}
                    </div>
                    <div className="step-actions">
                      {getStatusBadge(st.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Failure Recovery & Retry Actions */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Pipeline Recovery & Retries
              </div>

              {failedStage && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', marginBottom: '10px' }}
                  onClick={() => handleRetryStage(failedStage.stage)}
                  disabled={retrying !== null}
                >
                  {retrying === failedStage.stage ? 'Retrying...' : `RETRY FAILED STAGE (${failedStage.stage})`}
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="form-select"
                  value={retrySelectedStage}
                  onChange={(e) => setRetrySelectedStage(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <option value="SCRIPT">Retry from SCRIPT</option>
                  <option value="VOICE">Retry from VOICE</option>
                  <option value="SCENES">Retry from SCENES</option>
                  <option value="VIDEO">Retry from VIDEO</option>
                  <option value="SUBTITLES">Retry from SUBTITLES</option>
                  <option value="FINAL_VIDEO">Retry from FINAL_VIDEO</option>
                  <option value="THUMBNAIL">Retry THUMBNAIL</option>
                </select>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRetryStage(retrySelectedStage)}
                  disabled={retrying !== null}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {retrying === retrySelectedStage ? 'Running...' : 'Retry From'}
                </button>
              </div>
            </div>
          </div>

          {/* Publishing Controls Section */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="card-title">YouTube Publishing</h3>
              <span
                className="badge"
                style={{
                  backgroundColor: pubStatus === 'PUBLISHED' ? 'rgba(52, 211, 153, 0.15)' : pubStatus === 'SCHEDULED' ? 'rgba(56, 189, 248, 0.15)' : pubStatus === 'UPLOADING' ? 'rgba(250, 204, 21, 0.15)' : 'var(--bg-secondary)',
                  color: pubStatus === 'PUBLISHED' ? '#34d399' : pubStatus === 'SCHEDULED' ? '#38bdf8' : pubStatus === 'UPLOADING' ? '#facc15' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {pubStatus}
              </span>
            </div>

            {publishMessage && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '4px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  backgroundColor: publishMessage.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'var(--error-bg)',
                  color: publishMessage.type === 'success' ? '#34d399' : '#f87171',
                }}
              >
                {publishMessage.text}
              </div>
            )}

            {/* YouTube Account Status */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '14px', fontSize: '13px' }}>
              {youtubeConnection?.connected ? (
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>✓ {youtubeConnection.channelTitle || 'Connected Channel'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>ID: {youtubeConnection.channelId}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>YouTube not connected</span>
                  <Link href="/settings/publishing" className="btn btn-primary btn-sm" style={{ fontSize: '11px', padding: '3px 8px' }}>
                    Connect YouTube
                  </Link>
                </div>
              )}
            </div>

            {/* If Video is Published */}
            {project.publish_video_id && (
              <div style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)', marginBottom: '14px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: '4px' }}>Published on YouTube</div>
                <div>ID: <code>{project.publish_video_id}</code></div>
                {project.publish_url && (
                  <a href={project.publish_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                    View on YouTube ↗
                  </a>
                )}
              </div>
            )}

            {/* Visibility Selector */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Visibility</label>
              <select
                className="form-select"
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                style={{ fontSize: '13px', padding: '6px 10px' }}
                disabled={project.status !== 'COMPLETED' || pubStatus === 'PUBLISHED'}
              >
                <option value="PRIVATE">PRIVATE (Only you can view)</option>
                <option value="UNLISTED">UNLISTED (Anyone with link)</option>
                <option value="PUBLIC">PUBLIC (Searchable to all)</option>
              </select>
            </div>

            {/* Schedule Input */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Schedule Release Date / Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{ fontSize: '13px', padding: '6px 10px' }}
                disabled={project.status !== 'COMPLETED' || pubStatus === 'PUBLISHED'}
              />
            </div>

            {/* Publishing Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePublish(false)}
                disabled={publishingNow || project.status !== 'COMPLETED' || pubStatus === 'PUBLISHED'}
              >
                {publishingNow ? 'Publishing...' : 'PUBLISH NOW'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handlePublish(true)}
                disabled={publishingNow || project.status !== 'COMPLETED' || !scheduleDate || pubStatus === 'PUBLISHED'}
              >
                SCHEDULE
              </button>
            </div>

            {project.publish_error && (
              <div style={{ color: '#f87171', fontSize: '12px', marginTop: '10px' }}>
                Error: {project.publish_error}
              </div>
            )}
          </div>

          {/* Cost & Runtime Telemetry Card */}
          <div className="telemetry-card">
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cost & Runtime Telemetry
            </div>
            <div className="telemetry-grid">
              <div>
                <div className="telemetry-stat-label">Generation Time</div>
                <div className="telemetry-stat-value">{telemetry?.totalGenerationDurationSec ? `${telemetry.totalGenerationDurationSec}s` : 'In Progress'}</div>
              </div>
              <div>
                <div className="telemetry-stat-label">Scenes / Clips</div>
                <div className="telemetry-stat-value">{telemetry?.sceneCount || scenes.length} scenes / {telemetry?.clipCount || assets.filter(a => a.asset_type === 'clip').length} clips</div>
              </div>
              <div>
                <div className="telemetry-stat-label">Audio Duration</div>
                <div className="telemetry-stat-value">{telemetry?.audioDurationSec ? `${telemetry.audioDurationSec}s` : audioAsset?.duration_sec ? `${audioAsset.duration_sec}s` : '—'}</div>
              </div>
              <div>
                <div className="telemetry-stat-label">Video Duration</div>
                <div className="telemetry-stat-value">{output?.duration_sec ? `${output.duration_sec}s` : '—'}</div>
              </div>
              <div>
                <div className="telemetry-stat-label">File Size</div>
                <div className="telemetry-stat-value">{output?.filesize_bytes ? `${(output.filesize_bytes / (1024 * 1024)).toFixed(2)} MB` : '—'}</div>
              </div>
              <div>
                <div className="telemetry-stat-label">Estimated Cost</div>
                <div className="telemetry-stat-value" style={{ color: 'var(--text-muted)' }}>COST: UNAVAILABLE</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontFamily: 'monospace' }}>
              Provider: {telemetry?.providerUsed || 'Local FFmpeg Motion Engine'}
            </div>
          </div>
        </div>

        {/* Right Column: Output Media, Thumbnail, Metadata, Scenes */}
        <div>
          {/* Final Video Player */}
          {output && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="card-title">Final Video Output (1080p MP4)</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                    {output.resolution} • {output.duration_sec}s • {(output.filesize_bytes / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <a href={output.url} download="video.mp4" className="btn btn-primary btn-sm">
                  Download MP4
                </a>
              </div>

              <div className="video-player-container">
                <video
                  className="video-player"
                  controls
                  playsInline
                  preload="metadata"
                  src={output.url}
                />
              </div>
            </div>
          )}

          {/* Thumbnail Generation Card */}
          <div className="thumbnail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Video Thumbnail (1280×720)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  High-contrast channel-branded thumbnail graphic
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateThumbnail}
                  disabled={thumbGenerating}
                >
                  {thumbGenerating ? 'Generating...' : thumbnail ? 'Regenerate' : 'Generate Thumbnail'}
                </button>
                {thumbnail && (
                  <a href={thumbnail.url} download="thumbnail.png" className="btn btn-primary btn-sm">
                    Download PNG
                  </a>
                )}
              </div>
            </div>

            {thumbnail ? (
              <div className="thumbnail-img-wrapper">
                <img src={thumbnail.url} alt="Video Thumbnail" className="thumbnail-img" />
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '12px', fontSize: '13px' }}>
                Thumbnail not generated yet. Click &quot;Generate Thumbnail&quot; to synthesize.
              </div>
            )}
          </div>

          {/* Video Metadata Generator (Publish-Ready) */}
          {metadata && (
            <div className="metadata-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 className="card-title">Video Metadata (Publish-Ready)</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                    Automated title, chapters, description, tags, and hashtags
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const fullText = `TITLE:\n${metadata.youtubeTitle}\n\nDESCRIPTION:\n${metadata.description}\n\nTAGS:\n${metadata.tags.join(', ')}\n\nHASHTAGS:\n${metadata.hashtags.join(' ')}`;
                    copyToClipboard(fullText, 'all');
                  }}
                >
                  {copiedSection === 'all' ? '✓ Copied All!' : 'Copy All Metadata'}
                </button>
              </div>

              <div className="meta-field">
                <div className="meta-label">
                  <span>YouTube Title</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => copyToClipboard(metadata.youtubeTitle, 'title')}
                  >
                    {copiedSection === 'title' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="meta-value-box" style={{ fontWeight: 600 }}>{metadata.youtubeTitle}</div>
              </div>

              <div className="meta-field">
                <div className="meta-label">
                  <span>Description (with Chapters)</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => copyToClipboard(metadata.description, 'desc')}
                  >
                    {copiedSection === 'desc' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="meta-value-box" style={{ maxHeight: '160px', overflowY: 'auto' }}>{metadata.description}</div>
              </div>

              <div className="meta-field">
                <div className="meta-label">
                  <span>Tags ({metadata.tags.length})</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => copyToClipboard(metadata.tags.join(', '), 'tags')}
                  >
                    {copiedSection === 'tags' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="meta-value-box" style={{ fontSize: '12px' }}>{metadata.tags.join(', ')}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="meta-field">
                  <div className="meta-label">
                    <span>Hashtags</span>
                  </div>
                  <div className="meta-value-box" style={{ color: '#38bdf8' }}>{metadata.hashtags.join(' ')}</div>
                </div>
                <div className="meta-field">
                  <div className="meta-label">
                    <span>Suggested Filename</span>
                  </div>
                  <div className="meta-value-box" style={{ fontFamily: 'monospace' }}>{metadata.suggestedFilename}</div>
                </div>
              </div>
            </div>
          )}

          {/* Voiceover Audio Asset */}
          {audioAsset && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Voiceover Audio</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Duration: {audioAsset.duration_sec}s
                </span>
              </div>
              <audio className="audio-preview" controls src={audioAsset.url} />
            </div>
          )}

          {/* Subtitles Asset */}
          {subtitlesAsset && (
            <div className="card" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Subtitles & Captions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  Mobile-safe line breaks synchronized with voiceover
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={subtitlesAsset.url} download="captions.srt" className="btn btn-secondary btn-sm">
                  Download .SRT
                </a>
                <a href={subtitlesAsset.url.replace('.srt', '.vtt')} download="captions.vtt" className="btn btn-secondary btn-sm">
                  Download .VTT
                </a>
              </div>
            </div>
          )}

          {/* Scene Visual Continuity Cards */}
          {scenes.length > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>
                Scene Breakdown & Visual Continuity ({scenes.length} Scenes)
              </h3>
              {scenes.map((scene) => (
                <div key={scene.id} className="scene-card">
                  <div className="scene-header">
                    <span>Scene {scene.scene_index} — {scene.visual_subject || `Segment ${scene.scene_index}`}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{scene.estimated_duration_sec}s</span>
                  </div>
                  {scene.environment && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                      📍 <strong>Environment:</strong> {scene.environment} • 🎥 <strong>Camera:</strong> {scene.camera_movement || 'Cinematic Dolly'}
                    </div>
                  )}
                  {scene.continuity_notes && (
                    <div style={{ fontSize: '12px', color: '#38bdf8', marginBottom: '6px', fontStyle: 'italic' }}>
                      🔗 <strong>Continuity:</strong> {scene.continuity_notes}
                    </div>
                  )}
                  <div className="scene-prompt">&ldquo;{scene.visual_prompt}&rdquo;</div>
                  <div className="scene-narration">{scene.narration}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
