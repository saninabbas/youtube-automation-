'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface StageInfo {
  stage: 'SCRIPT' | 'SCENES' | 'VIDEO' | 'VOICE' | 'SUBTITLES' | 'FINAL_VIDEO';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ProjectData {
  project: {
    id: string;
    topic: string;
    target_length_minutes: number;
    language: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    current_stage: string;
    error_message?: string | null;
    channel_name: string;
    channel_niche: string;
    channel_voice: string;
    created_at: string;
  };
  stages: StageInfo[];
  scenes: Array<{
    id: string;
    scene_index: number;
    narration: string;
    visual_prompt: string;
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
}

const STAGE_LABELS: Record<string, string> = {
  SCRIPT: '1. Script Generation',
  SCENES: '2. Scene Breakdown',
  VIDEO: '3. Video Clips Generation',
  VOICE: '4. Voiceover Synthesis',
  SUBTITLES: '5. Subtitle Timing',
  FINAL_VIDEO: '6. Final MP4 Composition',
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

    // Poll while project is not COMPLETED or FAILED
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
    return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading project details...</div>;
  }

  if (error || !data) {
    return (
      <div className="card empty-state">
        <h3 className="empty-state-title">Project Not Found</h3>
        <p className="empty-state-text">{error || 'Could not load project information.'}</p>
        <Link href="/content" className="btn btn-primary">
          Back to Videos
        </Link>
      </div>
    );
  }

  const { project, stages, scenes, assets, output } = data;
  const audioAsset = assets.find((a) => a.asset_type === 'audio');
  const subAsset = assets.find((a) => a.asset_type === 'subtitles');

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-tag">{project.channel_name}</span>
            <span className="badge badge-tag">{project.channel_niche}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {project.target_length_minutes} min duration
            </span>
          </div>
          <h1 className="page-title">{project.topic}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/content" className="btn btn-secondary">
            All Videos
          </Link>
          <Link href="/content/new" className="btn btn-primary">
            + New Video
          </Link>
        </div>
      </div>

      {/* Production Pipeline Vertical Stepper */}
      <div className="pipeline-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Production Pipeline
          </h2>
          <div>{getStatusBadge(project.status)}</div>
        </div>

        <div className="pipeline-list">
          {stages.map((st, idx) => {
            const isCurrent = project.current_stage === st.stage && project.status === 'PROCESSING';
            const isFailed = st.status === 'FAILED';

            return (
              <div
                key={st.stage}
                className={`pipeline-step ${isCurrent ? 'active' : ''} ${st.status === 'COMPLETED' ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
              >
                <div className="step-info">
                  <div className="step-number">{idx + 1}</div>
                  <div>
                    <div className="step-name">{STAGE_LABELS[st.stage] || st.stage}</div>
                    {st.error_message && (
                      <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px' }}>
                        Error: {st.error_message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="step-actions">
                  {getStatusBadge(st.status)}
                  {isFailed && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRetryStage(st.stage)}
                      disabled={retrying === st.stage}
                    >
                      {retrying === st.stage ? 'Retrying...' : 'RETRY'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final MP4 Video Player Section */}
      {output && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div className="card-header">
            <h3 className="card-title">Final Video Output</h3>
            <span className="badge badge-completed">Ready for Distribution</span>
          </div>

          <div className="video-player-container">
            <video
              src={output.url}
              controls
              playsInline
              className="video-player"
              poster=""
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Resolution: <strong>{output.resolution}</strong> &nbsp;•&nbsp; Duration:{' '}
              <strong>{Math.round(output.duration_sec)}s</strong> &nbsp;•&nbsp; Size:{' '}
              <strong>{(output.filesize_bytes / (1024 * 1024)).toFixed(2)} MB</strong>
            </div>
            <a
              href={output.url}
              download={`${project.topic.toLowerCase().replace(/\s+/g, '_')}.mp4`}
              className="btn btn-primary btn-sm"
            >
              Download MP4
            </a>
          </div>
        </div>
      )}

      {/* Voiceover Audio Preview */}
      {audioAsset && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Voiceover Audio</h3>
            <span className="badge badge-completed">{project.channel_voice}</span>
          </div>
          <audio controls src={audioAsset.url} className="audio-preview" />
        </div>
      )}

      {/* Generated Scenes Breakdown */}
      {scenes && scenes.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Scene Breakdown ({scenes.length} Scenes)</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total: {scenes.reduce((acc, s) => acc + s.estimated_duration_sec, 0)}s
            </span>
          </div>

          <div>
            {scenes.map((scene) => (
              <div key={scene.id} className="scene-card">
                <div className="scene-header">
                  <span>Scene {scene.scene_index}</span>
                  <span className="badge badge-tag">{scene.estimated_duration_sec} sec</span>
                </div>
                <div className="scene-prompt">
                  <strong>Visual Prompt: </strong>
                  {scene.visual_prompt}
                </div>
                <div className="scene-narration">
                  <strong>Narration: </strong>
                  {scene.narration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtitles Preview */}
      {subAsset && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Subtitles (SRT / WebVTT)</h3>
            <a href={subAsset.url} download="captions.srt" className="btn btn-secondary btn-sm">
              Download SRT
            </a>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Timed captions generated and embedded matching narration pace.
          </p>
        </div>
      )}
    </div>
  );
}
