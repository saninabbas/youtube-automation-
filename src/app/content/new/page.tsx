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
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Dashboard</Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: 600 }}>Studio</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            AI Video Creation Studio
          </h1>
        </div>

        <Link
          href="/templates"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
        >
          <span>Browse Templates</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 3-Column Studio Wizard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr minmax(280px, 320px)', gap: '24px', alignItems: 'start' }}>
        {/* LEFT: STEP NAVIGATION */}
        <div
          className="card"
          style={{
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(22,26,36,0.8) 0%, rgba(16,19,26,0.95) 100%)',
          }}
        >
          {[
            { num: 1, label: 'Topic & Idea', icon: '💡' },
            { num: 2, label: 'Aspect & Format', icon: '📐' },
            { num: 3, label: 'Visual Aesthetic', icon: '🎨' },
            { num: 4, label: 'Voice & Language', icon: '🎙️' },
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
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: activeStep === s.num ? 700 : 500,
                background: activeStep === s.num ? 'rgba(99,102,241,0.18)' : 'transparent',
                border: activeStep === s.num ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                color: activeStep === s.num ? '#a5b4fc' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* CENTER: MAIN CONFIGURATION PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: TOPIC & INSPIRATION */}
          {activeStep === 1 && (
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'linear-gradient(180deg, rgba(22,26,36,0.7) 0%, rgba(16,19,26,0.95) 100%)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  01. What is this video about?
                </h2>
                <button
                  type="button"
                  onClick={enhancePrompt}
                  disabled={enhancing || !topic.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#c4b5fd',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: topic.trim() ? 'pointer' : 'not-allowed',
                    opacity: topic.trim() ? 1 : 0.5,
                  }}
                >
                  <span>✨ Enhance Hook</span>
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                Enter any topic or headline. The AI engine decomposes it into viral hooks, narration scenes, and visual prompts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                    Video Concept / Topic Prompt *
                  </label>
                  <textarea
                    rows={4}
                    className="topbar-search"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-medium)',
                      color: '#fff',
                      fontSize: '14px',
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>
                    ⚡ Viral Topic Inspirations (1-Click Fill)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {VIRAL_TOPIC_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setTopic(preset.full)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: topic === preset.full ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                          border: topic === preset.full ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>
                            {preset.tag}
                          </span>
                          <span style={{ fontSize: '13px', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preset.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, flexShrink: 0 }}>
                          + Use Idea
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel Selector */}
                {channels.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                      Target YouTube Channel Persona
                    </label>
                    <select
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border-medium)',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    >
                      {channels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ({c.niche})
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
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'linear-gradient(180deg, rgba(22,26,36,0.7) 0%, rgba(16,19,26,0.95) 100%)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                02. Choose Format & Aspect Ratio
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Select aspect ratio, render resolution, and duration archetype.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {FORMAT_OPTIONS.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => selectFormat(f.id as FormatType)}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: format === f.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: format === f.id ? '2px solid #6366f1' : '1px solid var(--border-subtle)',
                      boxShadow: format === f.id ? '0 0 24px rgba(99,102,241,0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '28px' }}>{f.icon}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: format === f.id ? '#6366f1' : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {f.ratio}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      {f.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 600, marginBottom: '8px' }}>
                      {f.res} • {f.time}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: VISUAL STYLE GALLERY */}
          {activeStep === 3 && (
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'linear-gradient(180deg, rgba(22,26,36,0.7) 0%, rgba(16,19,26,0.95) 100%)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                03. Visual Aesthetics & Grading
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Directs the AI generative visuals pipeline, stock scene matching, and color grading.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {STYLE_GALLERY.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setVisualStyle(v.id as VisualStyleType)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: visualStyle === v.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: visualStyle === v.id ? '2px solid #6366f1' : '1px solid var(--border-subtle)',
                      boxShadow: visualStyle === v.id ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '26px' }}>{v.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{v.name}</h3>
                          <span style={{ fontSize: '11px', color: v.color, fontWeight: 600 }}>{v.tag}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.desc}</p>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: visualStyle === v.id ? '6px solid #6366f1' : '2px solid rgba(255,255,255,0.2)',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: VOICE & LANGUAGE */}
          {activeStep === 4 && (
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'linear-gradient(180deg, rgba(22,26,36,0.7) 0%, rgba(16,19,26,0.95) 100%)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                04. Neural Voiceover & Pacing
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Select AI voice narrator model and speech velocity.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {VOICES_LIST.map((voc) => (
                  <div
                    key={voc.id}
                    onClick={() => setVoice(voc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: voice === voc.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: voice === voc.id ? '2px solid #6366f1' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: voice === voc.id ? '#6366f1' : 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        🎙️
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                          {voc.name} ({voc.gender})
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {voc.tone} • {voc.lang}
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: '12px', color: voice === voc.id ? '#a5b4fc' : 'var(--text-muted)', fontWeight: 600 }}>
                      {voice === voc.id ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Speed multiplier */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Speech Velocity Multiplier
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['0.9x', '1.0x', '1.1x', '1.2x'].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setVoiceSpeed(spd)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: voiceSpeed === spd ? '#6366f1' : 'rgba(255,255,255,0.04)',
                        border: voiceSpeed === spd ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
                        color: voiceSpeed === spd ? '#fff' : '#cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
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

        {/* RIGHT: LIVE STUDIO BLUEPRINT & LAUNCH */}
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            position: 'sticky',
            top: '88px',
            background: 'linear-gradient(180deg, #161a26 0%, #0d1017 100%)',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Studio Blueprint
            </span>
            <span className="badge badge-ready" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>
              1080p CFR
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aspect Ratio:</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{format === 'SHORT_VERTICAL' ? '9:16 (Vertical)' : '16:9 (Landscape)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Duration:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>{durationMinutes} Mins ({totalSeconds}s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Scenes:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>~{estimatedScenes} Dynamic Cuts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Script Wordcount:</span>
              <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>~{approxWords} Words</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pipeline Cost:</span>
              <span className="tabular-nums" style={{ color: '#34d399', fontWeight: 700 }}>⚡ {creditCost} Credits</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !topic.trim()}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              marginBottom: '14px',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '15px',
              boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
              cursor: topic.trim() && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Queuing Pipeline...' : '⚡ Generate 1080p Video'}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.45 }}>
            Autonomous pipeline: Script Engine $\to$ Neural Voiceover $\to$ Stock B-Roll $\to$ Dynamic Subtitles $\to$ FFmpeg 1080p MP4.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading Studio...</div>}>
      <CreateVideoWizardContent />
    </Suspense>
  );
}
