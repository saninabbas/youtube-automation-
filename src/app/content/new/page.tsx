'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

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

const VIRAL_TOPIC_PRESETS = [
  { id: 'ai-trends', tag: '🤖 AI', label: '5 AI Tools in 2026 That Feel Illegal to Know', full: '5 AI Tools in 2026 That Feel Illegal to Know: How Autonomous Agents Are Replacing Entire Software Teams' },
  { id: 'wealth', tag: '💰 Wealth', label: 'Why 99% of People Stay Broke (Velocity of Money)', full: 'Why 99% of People Stay Broke: The Brutal Truth About The Velocity of Money and Compounding Leverage' },
  { id: 'mindset', tag: '🧠 Stoic', label: 'The 2,000-Year-Old Stoic Rule to Stop Overthinking', full: 'The 2,000-Year-Old Stoic Rule to Stop Overthinking: How Marcus Aurelius Mastered Mental Discipline' },
  { id: 'mystery', tag: '🕵️ Mystery', label: 'The Flight That Vanished in 1982', full: 'The Unsolved Mystery of Flight 729: How an Entire Plane Vanished from Radar Without a Trace' },
  { id: 'space', tag: '🌌 Space', label: 'What Actually Happens If You Enter a Black Hole?', full: 'What Actually Happens If You Cross the Event Horizon of a Supermassive Black Hole in 4K' },
];

const FORMAT_OPTIONS = [
  {
    id: 'STANDARD_LANDSCAPE',
    title: 'YouTube Landscape',
    ratio: '16:9',
    res: '1920x1080',
    time: '3-5 Mins',
    icon: '🖥️',
    desc: 'Standard widescreen HD, ideal for YouTube monetization, tutorials, and storytelling.',
    badge: 'Most Popular',
  },
  {
    id: 'SHORT_VERTICAL',
    title: 'Shorts & TikTok',
    ratio: '9:16',
    res: '1080x1920',
    time: '60 Seconds',
    icon: '📱',
    desc: 'High-velocity vertical format with fast hooks and dynamic subtitles for virality.',
    badge: 'Viral Boost',
  },
  {
    id: 'DOCUMENTARY_EPIC',
    title: 'Deep Documentary',
    ratio: '16:9',
    res: '1920x1080',
    time: '8-12 Mins',
    icon: '🎬',
    desc: 'Multi-chapter narrative with deep pacing, layered sound design, and archival feel.',
    badge: 'High RPM',
  },
];

const STYLE_GALLERY = [
  {
    id: 'CINEMATIC',
    name: 'Cinematic 35mm Masterpiece',
    tag: 'Anamorphic Lens • HDR',
    desc: 'Volumetric god rays, dramatic high-contrast lighting, and shallow depth of field.',
    icon: '🎬',
    color: '#6366f1',
  },
  {
    id: 'CYBERPUNK',
    name: 'Cyberpunk Neo-Tokyo',
    tag: 'Neon Magenta • Holographic',
    desc: 'Atmospheric neon glow, rain reflections, futuristic mega-cityscapes, and tech HUDs.',
    icon: '🌆',
    color: '#06b6d4',
  },
  {
    id: 'PHOTOREALISTIC',
    name: 'Photorealistic 8K',
    tag: 'Unreal Engine 5 • Macro Detail',
    desc: 'Ultra-crisp natural sunlight, organic textures, micro-focus, and broadcast realism.',
    icon: '📸',
    color: '#10b981',
  },
  {
    id: 'DOCUMENTARY_BW',
    name: 'Historical Archival & Noir',
    tag: 'Film Grain • Dark Moody',
    desc: 'Authentic 16mm film grain, sepia tones, dramatic vignette, and vintage archival mood.',
    icon: '🏛️',
    color: '#f59e0b',
  },
  {
    id: 'ANIME_MOTION',
    name: 'Anime Motion Aesthetic',
    tag: 'Makoto Shinkai • Luminous',
    desc: 'Vivid color grading, painterly clouds, radiant sunlight flare, and cel-shaded aesthetic.',
    icon: '✨',
    color: '#ec4899',
  },
];

const VOICES_LIST = [
  { id: 'en-US-ChristopherNeural', name: 'Christopher', gender: 'Male', tone: 'Authoritative, Deep, Cinematic', lang: 'English (US)' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', tone: 'Conversational, Engaging Storyteller', lang: 'English (US)' },
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Female', tone: 'Warm, Articulate, Dynamic', lang: 'English (US)' },
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Female', tone: 'High-Energy, Expressive, Punchy', lang: 'English (US)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'Male', tone: 'British BBC, Sophisticated, Calm', lang: 'English (UK)' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', tone: 'Clear, Intellectual, Documentary', lang: 'English (UK)' },
];

function CreateVideoWizardContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectedChannelId = searchParams.get('channel_id') || searchParams.get('channelId');
  const templateTopic = searchParams.get('topic');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  // Wizard State
  const [activeStep, setActiveStep] = useState<number>(1);
  const [channelId, setChannelId] = useState<string>('');
  const [topic, setTopic] = useState<string>(templateTopic || '');
  const [format, setFormat] = useState<FormatType>('STANDARD_LANDSCAPE');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [visualStyle, setVisualStyle] = useState<VisualStyleType>('CINEMATIC');
  const [voice, setVoice] = useState<string>('en-US-ChristopherNeural');
  const [voiceSpeed, setVoiceSpeed] = useState<string>('1.0x');
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

  const enhancePrompt = () => {
    if (!topic.trim()) {
      toast.info('Please write a basic topic or keyword first!');
      return;
    }
    setEnhancing(true);
    setTimeout(() => {
      const topicLower = topic.toLowerCase();
      let enhanced = topic.trim();
      if (!enhanced.includes(':') && !enhanced.includes('?')) {
        if (topicLower.includes('ai') || topicLower.includes('tech') || topicLower.includes('code')) {
          enhanced = `The Untold Reality of ${topic.trim()}: Why Autonomous AI Is Changing Everything in 2026`;
        } else if (topicLower.includes('money') || topicLower.includes('wealth') || topicLower.includes('finance')) {
          enhanced = `The Psychology of ${topic.trim()}: The Brutal Lessons 99% of People Learn Too Late`;
        } else if (topicLower.includes('space') || topicLower.includes('universe')) {
          enhanced = `What Actually Happens In ${topic.trim()}? The Cosmic Science Explained in 4K`;
        } else {
          enhanced = `The Complete Breakdown of ${topic.trim()}: What Nobody Tells You`;
        }
      }
      setTopic(enhanced);
      setEnhancing(false);
      toast.success('Prompt enhanced with high-retention viral framing! ✨');
    }, 350);
  };

  const selectFormat = (f: FormatType) => {
    setFormat(f);
    if (f === 'SHORT_VERTICAL') setDurationMinutes(1);
    else if (f === 'STANDARD_LANDSCAPE') setDurationMinutes(5);
    else if (f === 'DOCUMENTARY_EPIC') setDurationMinutes(8);
  };

  const selectedChannel = channels.find((c) => c.id === channelId);

  // Real-time calculations
  const totalSeconds = durationMinutes * 60;
  const approxWords = Math.round(totalSeconds * 2.3);
  const estimatedScenes = durationMinutes <= 1 ? 5 : durationMinutes <= 5 ? 10 : 18;
  const creditCost = 25;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || submitting) return;

    try {
      setSubmitting(true);
      toast.info('Initializing autonomous AI video pipeline... 🚀');

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId || channels[0]?.id || 'default_channel',
          topic: topic.trim(),
          target_length_minutes: durationMinutes,
          preset: format === 'SHORT_VERTICAL' ? 'SHORT' : 'STANDARD',
          language,
          platform: 'YouTube',
          auto_publish: autoPublish ? 1 : 0,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize video generation');
      }

      toast.success('Pipeline queued! Generating script & scenes... ✨');
      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      toast.error(err.message || 'Error queuing video generation');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Dashboard</Link>
            <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500 }}>Studio</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.025em' }}>
            Create Video
          </h1>
        </div>

        <Link
          href="/templates"
          className="btn btn-secondary btn-sm"
        >
          <span>Browse Templates</span>
          <span style={{ color: 'var(--text-muted)' }}>➔</span>
        </Link>
      </div>

      {/* 3-Column Studio Wizard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 290px', gap: '18px', alignItems: 'start' }}>
        {/* LEFT: STEP NAVIGATION */}
        <div
          className="card"
          style={{
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {[
            { num: 1, label: 'Topic & Idea', tag: '01' },
            { num: 2, label: 'Format & Ratio', tag: '02' },
            { num: 3, label: 'Visual Style', tag: '03' },
            { num: 4, label: 'Voice & Speed', tag: '04' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`nav-item ${activeStep === s.num ? 'active' : ''}`}
              style={{
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeStep === s.num ? 500 : 400,
              }}
            >
              <span className="tabular-nums" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                {s.tag}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* CENTER: MAIN CONFIGURATION PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* STEP 1: TOPIC & INSPIRATION */}
          {activeStep === 1 && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5' }}>
                  Topic & Narrative Concept
                </h2>
                <button
                  type="button"
                  onClick={enhancePrompt}
                  disabled={enhancing || !topic.trim()}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    opacity: topic.trim() ? 1 : 0.4,
                  }}
                >
                  <span>✨ Enhance Hook</span>
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Enter any prompt or topic. The autonomous engine generates viral hooks, scene breakdowns, and voice scripts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    style={{
                      padding: '12px 14px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                    placeholder="e.g. 'The Untold Mystery of Ancient Deep-Sea Megastructures in 4K'..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                {/* Viral Topic Ideas Presets */}
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Quick Presets
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {VIRAL_TOPIC_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setTopic(preset.full)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: topic === preset.full ? 'var(--bg-tertiary)' : 'var(--bg-surface)',
                          border: topic === preset.full ? '1px solid #71717a' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'border-color 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {preset.tag}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preset.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          Use ➔
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel Selector */}
                {channels.length > 0 && (
                  <div>
                    <label className="form-label" style={{ marginBottom: '6px' }}>
                      Target Channel Persona
                    </label>
                    <select
                      className="form-select"
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
                )}
              </div>
            </div>
          )}

          {/* STEP 2: FORMAT & ASPECT RATIO */}
          {activeStep === 2 && (
            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '2px' }}>
                Format Archetype & Aspect Ratio
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Select display aspect ratio and pacing profile.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {FORMAT_OPTIONS.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => selectFormat(f.id as FormatType)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: format === f.id ? 'var(--bg-tertiary)' : 'var(--bg-surface)',
                      border: format === f.id ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{f.icon}</span>
                      <span
                        className="badge"
                        style={{
                          background: format === f.id ? '#ffffff' : 'var(--bg-surface)',
                          color: format === f.id ? '#09090b' : 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        {f.ratio}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', marginBottom: '2px' }}>
                      {f.title}
                    </h3>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {f.res} • {f.time}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: VISUAL STYLE GALLERY */}
          {activeStep === 3 && (
            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '2px' }}>
                Visual Style & Aesthetics
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Directs the generative visuals engine and color grading.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {STYLE_GALLERY.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setVisualStyle(v.id as VisualStyleType)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: visualStyle === v.id ? 'var(--bg-tertiary)' : 'var(--bg-surface)',
                      border: visualStyle === v.id ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{v.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>{v.name}</h3>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{v.tag}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.desc}</p>
                      </div>
                    </div>

                    <span style={{ fontSize: '12px', color: visualStyle === v.id ? '#ffffff' : 'transparent', fontWeight: 600 }}>
                      ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: VOICE & LANGUAGE */}
          {activeStep === 4 && (
            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '2px' }}>
                Neural Voiceover & Narration
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Select AI voice synthesizer model and speech speed multiplier.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {VOICES_LIST.map((voc) => (
                  <div
                    key={voc.id}
                    onClick={() => setVoice(voc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: voice === voc.id ? 'var(--bg-tertiary)' : 'var(--bg-surface)',
                      border: voice === voc.id ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                        }}
                      >
                        🎙️
                      </div>
                      <div>
                        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                          {voc.name} ({voc.gender})
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {voc.tone} • {voc.lang}
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: voice === voc.id ? '#ffffff' : 'var(--text-dim)', fontWeight: 500 }}>
                      {voice === voc.id ? 'Selected' : 'Select'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Speed multiplier */}
              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>
                  Speech Velocity Multiplier
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['0.9x', '1.0x', '1.1x', '1.2x'].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setVoiceSpeed(spd)}
                      className="btn"
                      style={{
                        flex: 1,
                        background: voiceSpeed === spd ? '#ffffff' : 'var(--bg-surface)',
                        color: voiceSpeed === spd ? '#09090b' : 'var(--text-secondary)',
                        border: voiceSpeed === spd ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: LIVE STUDIO BLUEPRINT (Terminal Grade) */}
        <div
          className="card"
          style={{
            padding: '16px',
            position: 'sticky',
            top: '76px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Studio Blueprint
            </span>
            <span className="badge badge-ready">
              1080P CFR
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aspect Ratio</span>
              <span style={{ color: 'var(--text-primary)' }}>{format === 'SHORT_VERTICAL' ? '9:16 (Vert)' : '16:9 (Land)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{durationMinutes}m ({totalSeconds}s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Scene Cuts</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>~{estimatedScenes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Script Target</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>~{approxWords}w</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Credit Cost</span>
              <span className="tabular-nums" style={{ color: 'var(--status-ready)', fontWeight: 600 }}>⚡ {creditCost} Credits</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !topic.trim()}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginBottom: '10px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: topic.trim() && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Queuing Pipeline...' : 'Generate 1080p Video'}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 }}>
            Autonomous Script $\to$ TTS $\to$ Stock B-Roll $\to$ 1080p MP4.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Studio...</div>}>
      <CreateVideoWizardContent />
    </Suspense>
  );
}
