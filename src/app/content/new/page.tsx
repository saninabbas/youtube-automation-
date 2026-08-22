'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
  target_duration_minutes?: number;
  publishing_platform?: string;
}

type PresetType = 'SHORT' | 'STANDARD' | 'LONG' | 'CUSTOM';

function NewVideoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedChannelId = searchParams.get('channel_id');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [channelId, setChannelId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [preset, setPreset] = useState<PresetType>('STANDARD');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [language, setLanguage] = useState<string>('en');
  const [platform, setPlatform] = useState<string>('YouTube');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');
  const [autoPublish, setAutoPublish] = useState<boolean>(false);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/channels');
        if (res.ok) {
          const data = await res.json();
          const list = data.channels || [];
          setChannels(list);
          if (preselectedChannelId && list.some((c: Channel) => c.id === preselectedChannelId)) {
            setChannelId(preselectedChannelId);
            const found = list.find((c: Channel) => c.id === preselectedChannelId);
            if (found?.target_duration_minutes) {
              setDurationMinutes(found.target_duration_minutes);
            }
            if (found?.default_visibility) {
              setVisibility(found.default_visibility);
            }
            if (found?.auto_publish) {
              setAutoPublish(!!found.auto_publish);
            }
          } else if (list.length > 0) {
            setChannelId(list[0].id);
            if (list[0].target_duration_minutes) {
              setDurationMinutes(list[0].target_duration_minutes);
            }
            if (list[0].default_visibility) {
              setVisibility(list[0].default_visibility);
            }
            if (list[0].auto_publish) {
              setAutoPublish(!!list[0].auto_publish);
            }
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadChannels();
  }, [preselectedChannelId]);

  const selectPreset = (p: PresetType) => {
    setPreset(p);
    if (p === 'SHORT') {
      setDurationMinutes(1);
    } else if (p === 'STANDARD') {
      setDurationMinutes(5);
    } else if (p === 'LONG') {
      setDurationMinutes(8);
    }
  };

  // Calculations based on duration in minutes
  const totalSeconds = durationMinutes * 60;
  const approxWords = Math.round(totalSeconds * 2.3);
  let estimatedScenes = 3;
  if (durationMinutes <= 1) {
    estimatedScenes = 3;
  } else if (durationMinutes <= 5) {
    estimatedScenes = 8;
  } else {
    estimatedScenes = 14;
  }
  const approx8sClips = Math.ceil(totalSeconds / 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !topic.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          topic: topic.trim(),
          preset,
          target_length_minutes: Number(durationMinutes),
          language,
          platform,
          visibility,
          auto_publish: autoPublish ? 1 : 0,
        }),
      });


      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start video generation');
      }

      const data = await res.json();
      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Video</h1>
          <p className="page-subtitle">Select video preset or custom duration to start automated production</p>
        </div>
        <Link href="/content" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', maxWidth: '640px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading channel options...</div>
      ) : channels.length === 0 ? (
        <div className="card form-container">
          <h3 className="card-title" style={{ marginBottom: '8px' }}>No Channels Configured</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            You need at least one channel profile to generate videos.
          </p>
          <Link href="/channels" className="btn btn-primary">
            Create Channel Profile
          </Link>
        </div>
      ) : (
        <div className="form-container" style={{ maxWidth: '640px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Channel Profile</label>
              <select
                className="form-select"
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value);
                  const ch = channels.find((c) => c.id === e.target.value);
                  if (ch?.target_duration_minutes) {
                    setDurationMinutes(ch.target_duration_minutes);
                  }
                  if (ch?.publishing_platform) {
                    setPlatform(ch.publishing_platform);
                  }
                }}
                required
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.niche} ({c.publishing_platform || 'YouTube'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Video Topic / Core Concept</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 5 Morning Habits That Can Improve Your Health"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Video Generation Preset</label>
              <div className="preset-grid">
                <div
                  className={`preset-card ${preset === 'SHORT' ? 'active' : ''}`}
                  onClick={() => selectPreset('SHORT')}
                >
                  <div className="preset-title">Short</div>
                  <div className="preset-desc">30–60 seconds</div>
                </div>

                <div
                  className={`preset-card ${preset === 'STANDARD' ? 'active' : ''}`}
                  onClick={() => selectPreset('STANDARD')}
                >
                  <div className="preset-title">Standard</div>
                  <div className="preset-desc">3–5 minutes</div>
                </div>

                <div
                  className={`preset-card ${preset === 'LONG' ? 'active' : ''}`}
                  onClick={() => selectPreset('LONG')}
                >
                  <div className="preset-title">Long</div>
                  <div className="preset-desc">8–10 minutes</div>
                </div>

                <div
                  className={`preset-card ${preset === 'CUSTOM' ? 'active' : ''}`}
                  onClick={() => selectPreset('CUSTOM')}
                >
                  <div className="preset-title">Custom</div>
                  <div className="preset-desc">Manual Length</div>
                </div>
              </div>
            </div>

            {/* Target Duration Override Slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Target Duration (Minutes)</label>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{durationMinutes} min ({totalSeconds}s)</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(Number(e.target.value));
                  setPreset('CUSTOM');
                }}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Live Calculation Readout */}
            <div className="calculation-readout">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Production Specs Calculation
              </div>
              <div className="calc-grid">
                <div>
                  <div className="calc-item-label">Narration Words</div>
                  <div className="calc-item-val">~{approxWords}</div>
                </div>
                <div>
                  <div className="calc-item-label">Scene Count</div>
                  <div className="calc-item-val">{estimatedScenes} scenes</div>
                </div>
                <div>
                  <div className="calc-item-label">8s Video Clips</div>
                  <div className="calc-item-val">~{approx8sClips} clips</div>
                </div>
                <div>
                  <div className="calc-item-label">Target Duration</div>
                  <div className="calc-item-val">{durationMinutes} min</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select
                  className="form-select"
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                >
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="UNLISTED">UNLISTED</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', margin: '14px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                />
                <span><strong>Auto-Publish on Completion:</strong> Automatically upload & schedule to YouTube upon generation completion</span>
              </label>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'Initiating Pipeline...' : 'START VIDEO GENERATION'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


export default function NewVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading...</div>}>
      <NewVideoForm />
    </Suspense>
  );
}
