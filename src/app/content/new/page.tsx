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

const VIRAL_IDEAS = [
  { label: '🤖 AI Trends', prompt: '5 AI Tools in 2026 That Feel Illegal to Know: How Autonomous Agents Are Replacing Entire Software Teams' },
  { label: '💰 Wealth', prompt: 'Why 99% of People Stay Broke: The Brutal Truth About The Velocity of Money and Compounding Leverage' },
  { label: '🧠 Stoic Mindset', prompt: 'The 2,000-Year-Old Stoic Rule to Stop Overthinking: How Marcus Aurelius Mastered Mental Discipline' },
  { label: '🌌 Deep Space', prompt: 'What Actually Happens If You Cross the Event Horizon of a Supermassive Black Hole in 4K' },
  { label: '🥗 Longevity', prompt: '5 Foods That Support Healthy Aging & Cellular Vitality: Evidence-Based Longevity Protocols' },
];

const CURATED_VOICES = [
  {
    id: 'elevenlabs:rachel',
    name: 'Rachel',
    provider: 'ElevenLabs Studio',
    gender: 'Female',
    tone: 'Calm, Professional Documentary',
    badge: 'Popular',
  },
  {
    id: 'elevenlabs:adam',
    name: 'Adam',
    provider: 'ElevenLabs Studio',
    gender: 'Male',
    tone: 'Deep, Authoritative & Cinematic',
    badge: 'High RPM',
  },
  {
    id: 'elevenlabs:antoni',
    name: 'Antoni',
    provider: 'ElevenLabs Studio',
    gender: 'Male',
    tone: 'Energetic, Dynamic Storyteller',
  },
  {
    id: 'elevenlabs:bella',
    name: 'Bella',
    provider: 'ElevenLabs Studio',
    gender: 'Female',
    tone: 'Warm, Engaging & Conversational',
  },
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher',
    provider: 'Neural HD',
    gender: 'Male',
    tone: 'Deep Broadcast Narrator',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny',
    provider: 'Neural HD',
    gender: 'Female',
    tone: 'Articulate, Clear & Engaging',
  },
  {
    id: 'ur-PK-AsadNeural',
    name: 'Asad (Urdu)',
    provider: 'Neural HD',
    gender: 'Male',
    tone: 'Urdu Storyteller & Narrator',
  },
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (Hindi)',
    provider: 'Neural HD',
    gender: 'Male',
    tone: 'Hindi Cinematic Voiceover',
  },
];

const STYLES = [
  { id: 'Cinematic High-Contrast', name: '🎬 Cinematic 35mm', desc: 'Volumetric god-rays, 35mm anamorphic blur, 8k documentary lighting' },
  { id: 'Photorealistic 8K', name: '📸 Photorealistic 8K', desc: 'Ultra-detailed natural textures, crisp sunlight, macro studio photography' },
  { id: 'Cyberpunk Neo-Tokyo', name: '🌆 Cyberpunk Neo-Tokyo', desc: 'Holographic magenta glow, dark rain reflections, futuristic cityscapes' },
  { id: 'Historical Archival', name: '🏛️ Historical Archival', desc: '16mm film grain, sepia tones, dramatic vintage vignette' },
];

function CreateVideoWizardContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const templateTopic = searchParams.get('topic');

  const [topic, setTopic] = useState<string>(templateTopic || '');
  const [voiceType, setVoiceType] = useState<'CURATED' | 'CUSTOM'>('CURATED');
  const [selectedVoice, setSelectedVoice] = useState<string>('elevenlabs:rachel');
  const [customVoiceId, setCustomVoiceId] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState<string>('');
  const [monthlyUsage, setMonthlyUsage] = useState({ used: 0, limit: 30, remaining: 30 });
  
  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [format, setFormat] = useState<'STANDARD' | 'SHORT'>('STANDARD');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [visualStyle, setVisualStyle] = useState<string>('Cinematic High-Contrast');
  const [autoPublish, setAutoPublish] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [chanRes, projRes] = await Promise.all([
          fetch('/api/channels'),
          fetch('/api/projects'),
        ]);

        if (chanRes.ok) {
          const cData = await chanRes.json();
          const list = cData.channels || [];
          setChannels(list);
          if (list.length > 0) setChannelId(list[0].id);
        }

        if (projRes.ok) {
          const pData = await projRes.json();
          if (pData.monthlyUsage) {
            setMonthlyUsage(pData.monthlyUsage);
          }
        }
      } catch (err: any) {
        console.error('Failed to load studio data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const enhanceTopicPrompt = () => {
    if (!topic.trim()) {
      toast.info('Please enter a topic or keyword first!');
      return;
    }
    setEnhancing(true);
    setTimeout(() => {
      const lower = topic.toLowerCase();
      let enhanced = topic.trim();
      if (!enhanced.includes(':') && !enhanced.includes('?')) {
        if (lower.includes('ai') || lower.includes('tech')) {
          enhanced = `The Untold Reality of ${topic.trim()}: Why Autonomous AI Is Changing Everything in 2026`;
        } else if (lower.includes('money') || lower.includes('wealth')) {
          enhanced = `The Psychology of ${topic.trim()}: The Financial Lessons 99% of People Learn Too Late`;
        } else if (lower.includes('space') || lower.includes('universe')) {
          enhanced = `What Actually Happens In ${topic.trim()}? The Cosmic Science Explained in 4K`;
        } else if (lower.includes('health') || lower.includes('diet')) {
          enhanced = `The Science Behind ${topic.trim()}: What Cellular Research Reveals About Longevity`;
        } else {
          enhanced = `The Complete Breakdown of ${topic.trim()}: The Hidden Truth Explained`;
        }
      }
      setTopic(enhanced);
      setEnhancing(false);
      toast.success('Topic prompt enhanced with viral documentary framing! ✨');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.warning('Please enter a video topic');
      return;
    }
    if (monthlyUsage.remaining <= 0) {
      toast.error(`Monthly plan quota reached (${monthlyUsage.used}/${monthlyUsage.limit} videos). Upgrade or wait for next billing cycle.`);
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      toast.info('Initializing autonomous AI video pipeline... 🚀');

      const finalVoice = voiceType === 'CUSTOM' && customVoiceId.trim()
        ? customVoiceId.trim()
        : selectedVoice;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId || channels[0]?.id || 'default_channel',
          topic: topic.trim(),
          target_length_minutes: format === 'SHORT' ? 1 : durationMinutes,
          preset: format === 'SHORT' ? 'SHORT' : 'STANDARD',
          voice: finalVoice,
          visual_style: visualStyle,
          platform: 'YouTube',
          auto_publish: autoPublish ? 1 : 0,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      toast.success('Video queued! Script & visual generation in progress... ✨');
      router.push(`/content/${data.projectId}?topic=${encodeURIComponent(topic.trim())}`);
    } catch (err: any) {
      toast.error(err.message || 'Error generating video');
      setSubmitting(false);
    }
  };

  const usagePercent = Math.min(100, Math.round((monthlyUsage.used / Math.max(1, monthlyUsage.limit)) * 100));

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px 0 60px 0' }}>
      {/* 1. Header & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Link href="/" style={{ color: '#71717a', fontSize: '12px', textDecoration: 'none' }}>Dashboard</Link>
            <span style={{ color: '#3f3f46', fontSize: '12px' }}>/</span>
            <span style={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 500 }}>Studio</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.025em', margin: 0 }}>
            Create AI Video
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
            Enter a topic, select your narrator voice, and let autonomous AI craft your 1080p video.
          </p>
        </div>

        {/* Monthly Plan Quota Pill */}
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(24, 24, 27, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '170px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
            <span style={{ color: '#71717a' }}>PLAN QUOTA</span>
            <span style={{ color: monthlyUsage.remaining > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {monthlyUsage.used} / {monthlyUsage.limit}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${usagePercent}%`, height: '100%', background: monthlyUsage.remaining > 0 ? '#10b981' : '#ef4444' }} />
          </div>
          <span style={{ fontSize: '10px', color: '#71717a', textAlign: 'right' }}>
            {monthlyUsage.remaining} videos remaining this month
          </span>
        </div>
      </div>

      {/* 2. Main Creation Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* STEP 1: TOPIC INPUT */}
        <div
          className="card"
          style={{
            padding: '24px',
            background: 'rgba(24, 24, 27, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', color: '#09090b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                1
              </span>
              <span>What do you want to make a video about?</span>
            </label>

            <button
              type="button"
              onClick={enhanceTopicPrompt}
              disabled={enhancing || !topic.trim()}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', height: '28px', gap: '4px' }}
            >
              <span>{enhancing ? 'Enhancing...' : '✨ AI Enhance Prompt'}</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 AI Breakthroughs in 2026 That Are Changing Everything, or The Hidden Psychology of Money and Compounding Leverage..."
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '14px',
                lineHeight: 1.5,
                background: '#09090b',
                color: '#f4f4f5',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Quick Viral Ideas Pill Selector */}
          <div>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>
              Or choose a viral concept:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {VIRAL_IDEAS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(item.prompt)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: topic === item.prompt ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: topic === item.prompt ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: topic === item.prompt ? '#ffffff' : '#a1a1aa',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 2: VOICE SELECTION */}
        <div
          className="card"
          style={{
            padding: '24px',
            background: 'rgba(24, 24, 27, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', color: '#09090b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                2
              </span>
              <span>Select Narrator Voice</span>
            </label>

            {/* Voice Type Segmented Switch */}
            <div style={{ display: 'inline-flex', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setVoiceType('CURATED')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  background: voiceType === 'CURATED' ? '#ffffff' : 'transparent',
                  color: voiceType === 'CURATED' ? '#09090b' : '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                🎙️ Curated AI Voices
              </button>
              <button
                type="button"
                onClick={() => setVoiceType('CUSTOM')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  background: voiceType === 'CUSTOM' ? '#ffffff' : 'transparent',
                  color: voiceType === 'CUSTOM' ? '#09090b' : '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                🧬 Custom Cloned Voice ID
              </button>
            </div>
          </div>

          {voiceType === 'CURATED' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {CURATED_VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : '#09090b',
                      border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                        {v.name}
                      </span>
                      {v.badge ? (
                        <span style={{ fontSize: '9px', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          {v.badge}
                        </span>
                      ) : (
                        <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#71717a' }}>
                          {v.provider}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      {v.tone}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Paste your ElevenLabs Voice ID (e.g. 21m00Tcm4TlvDq8ikWAM or voice_...)"
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '13px',
                  background: '#09090b',
                  color: '#f4f4f5',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '11px', color: '#71717a' }}>
                💡 You can find your authorized voice IDs in your ElevenLabs Voice Lab dashboard.
              </span>
            </div>
          )}
        </div>

        {/* STEP 3: COLLAPSIBLE ADVANCED SETTINGS */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'rgba(24, 24, 27, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              color: '#d4d4d8',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span>
              <span>Advanced Options (Format, Duration, Visual Style)</span>
            </span>
            <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
              {showAdvanced ? '▲ HIDE' : '▼ SHOW'}
            </span>
          </button>

          {showAdvanced && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {/* Aspect Ratio & Format */}
              <div>
                <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>
                  Video Format
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setFormat('STANDARD'); setDurationMinutes(5); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: format === 'STANDARD' ? '#ffffff' : '#09090b',
                      color: format === 'STANDARD' ? '#09090b' : '#a1a1aa',
                      border: format === 'STANDARD' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    🖥️ YouTube Landscape (16:9)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormat('SHORT'); setDurationMinutes(1); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: format === 'SHORT' ? '#ffffff' : '#09090b',
                      color: format === 'SHORT' ? '#09090b' : '#a1a1aa',
                      border: format === 'SHORT' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📱 Shorts & TikTok (9:16)
                  </button>
                </div>
              </div>

              {/* Duration Slider */}
              {format === 'STANDARD' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                      Target Duration
                    </span>
                    <span style={{ fontSize: '12px', color: '#f4f4f5', fontFamily: 'monospace', fontWeight: 600 }}>
                      {durationMinutes} Minutes (~{Math.round(durationMinutes * 138)} words)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[3, 5, 8, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMinutes(m)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          background: durationMinutes === m ? 'rgba(255,255,255,0.15)' : '#09090b',
                          color: durationMinutes === m ? '#ffffff' : '#a1a1aa',
                          border: durationMinutes === m ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        {m}m {m === 5 ? '(Recommended)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Aesthetic */}
              <div>
                <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>
                  Visual Style
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {STYLES.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setVisualStyle(s.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: visualStyle === s.id ? 'rgba(255,255,255,0.08)' : '#09090b',
                        border: visualStyle === s.id ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', display: 'block' }}>{s.name}</span>
                      <span style={{ fontSize: '10px', color: '#71717a', display: 'block', marginTop: '2px' }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Publish Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#f4f4f5', display: 'block' }}>
                    Auto-Schedule to YouTube
                  </span>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>
                    Automatically queue for scheduled release according to your channel slot.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: BIG ACTION BUTTON */}
        <div>
          <button
            type="submit"
            disabled={submitting || !topic.trim() || monthlyUsage.remaining <= 0}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '10px',
              background: monthlyUsage.remaining <= 0 ? '#3f3f46' : '#ffffff',
              color: monthlyUsage.remaining <= 0 ? '#71717a' : '#09090b',
              cursor: submitting || !topic.trim() || monthlyUsage.remaining <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: monthlyUsage.remaining > 0 ? '0 0 20px rgba(255, 255, 255, 0.15)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {submitting ? (
              <span>Initializing Autonomous Video Pipeline... 🚀</span>
            ) : monthlyUsage.remaining <= 0 ? (
              <span>Monthly Quota Reached (30/30 Videos)</span>
            ) : (
              <span>🚀 Create Video</span>
            )}
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
            <span>✓ Topic-Matched Script</span>
            <span>✓ Seamless Scene Continuity</span>
            <span>✓ 1080p MP4 Render</span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#71717a', fontFamily: 'monospace' }}>Loading Studio...</div>}>
      <CreateVideoWizardContent />
    </Suspense>
  );
}
