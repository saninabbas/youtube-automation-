'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
  visual_style?: string;
  target_duration_minutes?: number;
  publishing_platform?: string;
}

type FormatType = 'SHORT_VERTICAL' | 'STANDARD_LANDSCAPE' | 'DOCUMENTARY_EPIC';
type VisualStyleType = 'CINEMATIC' | 'PHOTOREALISTIC' | 'CYBERPUNK' | 'DOCUMENTARY_BW' | 'ANIME_MOTION';

function CreateVideoWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedChannelId = searchParams.get('channel_id');
  const templateTopic = searchParams.get('topic');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard State
  const [activeStep, setActiveStep] = useState<number>(1);
  const [channelId, setChannelId] = useState<string>('');
  const [topic, setTopic] = useState<string>(templateTopic || '');
  const [format, setFormat] = useState<FormatType>('STANDARD_LANDSCAPE');
  const [durationMinutes, setDurationMinutes] = useState<number>(3);
  const [visualStyle, setVisualStyle] = useState<VisualStyleType>('CINEMATIC');
  const [voice, setVoice] = useState<string>('en-US-ChristopherNeural');
  const [language, setLanguage] = useState<string>('en');
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
          } else if (list.length > 0) {
            setChannelId(list[0].id);
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

  const selectFormat = (f: FormatType) => {
    setFormat(f);
    if (f === 'SHORT_VERTICAL') setDurationMinutes(1);
    else if (f === 'STANDARD_LANDSCAPE') setDurationMinutes(3);
    else if (f === 'DOCUMENTARY_EPIC') setDurationMinutes(8);
  };

  const selectedChannel = channels.find((c) => c.id === channelId);

  // Real-time calculations
  const totalSeconds = durationMinutes * 60;
  const approxWords = Math.round(totalSeconds * 2.3);
  const estimatedScenes = durationMinutes <= 1 ? 4 : durationMinutes <= 3 ? 8 : 16;
  const creditCost = 25;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || submitting) return;

    if (!channelId && channels.length === 0) {
      // Auto-create default channel
      try {
        const cRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Studio Channel', niche: 'AI & Tech', target_duration_minutes: durationMinutes }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          setChannelId(cData.channel.id);
        }
      } catch {}
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId || channels[0]?.id,
          topic: topic.trim(),
          target_length_minutes: durationMinutes,
          preset: format === 'SHORT_VERTICAL' ? 'SHORT' : 'STANDARD',
          language,
          platform: 'YouTube',
          auto_publish: autoPublish ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize video generation');
      }

      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Dashboard</Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Create Video</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            AI Video Generation Studio
          </h1>
        </div>

        <Link href="/templates" className="btn btn-secondary btn-sm">
          Browse Templates ➔
        </Link>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-error)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* 3-Column Studio Wizard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT: STEP NAVIGATION */}
        <div className="card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { num: 1, label: 'Topic & Channel' },
            { num: 2, label: 'Format Archetype' },
            { num: 3, label: 'Visual Aesthetic' },
            { num: 4, label: 'Voice & Tone' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`nav-item ${activeStep === s.num ? 'active' : ''}`}
              style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="tabular-nums" style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>
                0{s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* CENTER: MAIN CONFIGURATION PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: TOPIC & CHANNEL */}
          {activeStep === 1 && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                01. What is this video about?
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Enter a topic, headline, or rough idea. The AI engine will decompose it into cinematic scenes.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Video Topic / Concept Prompt *
                  </label>
                  <textarea
                    rows={4}
                    className="topbar-search"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '12px 14px', background: 'var(--bg-primary)', resize: 'vertical' }}
                    placeholder="e.g. 'The Future of Autonomous AI Coding Agents in 2026: Why Everything is Changing'..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Target Channel Workspace
                  </label>
                  <select
                    className="topbar-search"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '10px 14px', background: 'var(--bg-primary)' }}
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                  >
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.niche})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FORMAT ARCHETYPE */}
          {activeStep === 2 && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                02. Choose Format Archetype
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Select aspect ratio, duration target, and video pacing.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                  { id: 'SHORT_VERTICAL', title: 'Vertical Shorts', ratio: '9:16', time: '60 Seconds', icon: '📱', desc: 'Fast hook, viral TikTok/Reels/Shorts' },
                  { id: 'STANDARD_LANDSCAPE', title: 'YouTube Explainer', ratio: '16:9', time: '3 Minutes', icon: '🎬', desc: 'Standard high-retention structured video' },
                  { id: 'DOCUMENTARY_EPIC', title: 'Deep Documentary', ratio: '16:9', time: '8 Minutes', icon: '🎙️', desc: 'In-depth storytelling with multiple arcs' },
                ].map((f) => (
                  <div
                    key={f.id}
                    onClick={() => selectFormat(f.id as FormatType)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: format === f.id ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                      border: format === f.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{f.icon}</div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{f.title}</h3>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                      <span>{f.ratio}</span>
                      <span>•</span>
                      <span>{f.time}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: VISUAL STYLE */}
          {activeStep === 3 && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                03. Visual Aesthetics & Grading
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Directs the AI visuals engine and stock B-Roll footage matching.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'CINEMATIC', label: 'Cinematic High-Contrast', desc: 'Anamorphic lens, rich blacks, volumetric god rays' },
                  { id: 'PHOTOREALISTIC', label: 'Photorealistic 8K', desc: 'Hyper-detailed textures, macro focus, natural sunlight' },
                  { id: 'CYBERPUNK', label: 'Cyberpunk Neo-Tokyo', desc: 'Neon magenta & cyan reflections, holographic HUDs' },
                  { id: 'DOCUMENTARY_BW', label: 'Historical Archival', desc: 'Grain texture, monochrome tones, historic archival feel' },
                ].map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setVisualStyle(v.id as VisualStyleType)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: visualStyle === v.id ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                      border: visualStyle === v.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{v.label}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: VOICE & TONE */}
          {activeStep === 4 && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                04. Voiceover & Narration Tone
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Select neural voice synthesizer model.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'en-US-ChristopherNeural', name: 'Christopher (Neural)', tone: 'Authoritative, Deep, Cinematic', lang: 'English (US)' },
                  { id: 'en-US-JennyNeural', name: 'Jenny (Neural)', tone: 'Energetic, Friendly, Clear', lang: 'English (US)' },
                  { id: 'en-GB-RyanNeural', name: 'Ryan (British BBC)', tone: 'Sophisticated, Documentary, Calm', lang: 'English (UK)' },
                ].map((voc) => (
                  <div
                    key={voc.id}
                    onClick={() => setVoice(voc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: voice === voc.id ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                      border: voice === voc.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{voc.name}</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{voc.tone} • {voc.lang}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {voice === voc.id ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: LIVE BLUEPRINT & COST CARD */}
        <div className="card card-elevated" style={{ padding: '24px', position: 'sticky', top: '88px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Blueprint
            </span>
            <span className="badge badge-ready">1080p CFR</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration Target:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>{durationMinutes} Minutes ({totalSeconds}s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Scenes:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>~{estimatedScenes} Sub-clips</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Script Target:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>~{approxWords} Words</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resolution:</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>1920x1080 Full HD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Generation Cost:</span>
              <span className="tabular-nums" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>⚡ {creditCost} Credits</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !topic.trim()}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: '12px' }}
          >
            {submitting ? 'Queuing Pipeline...' : '⚡ Generate Video'}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 }}>
            Directs the 10-stage autonomous engine: Script $\to$ Voice $\to$ Visuals $\to$ 1080p MP4.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading Video Wizard...</div>}>
      <CreateVideoWizardContent />
    </Suspense>
  );
}
