'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const STUDIO_VOICES = [
  { id: 'elevenlabs:rachel', name: 'Studio Voice 1', desc: 'Rachel (Female, Calm & Professional)' },
  { id: 'elevenlabs:adam', name: 'Studio Voice 2', desc: 'Adam (Male, Deep & Cinematic)' },
  { id: 'elevenlabs:antoni', name: 'Studio Voice 3', desc: 'Antoni (Male, Energetic & Dynamic)' },
  { id: 'elevenlabs:bella', name: 'Studio Voice 4', desc: 'Bella (Female, Warm & Conversational)' },
  { id: 'en-US-ChristopherNeural', name: 'Studio Voice 5', desc: 'Christopher (Male, Clear Broadcast)' },
  { id: 'custom', name: 'My Voice', desc: 'Use your own ElevenLabs voice' },
];

function CreateVideoWizardContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const templateTopic = searchParams.get('topic');

  const [topic, setTopic] = useState(templateTopic || '');
  const [selectedVoice, setSelectedVoice] = useState('elevenlabs:rachel');
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState({ used: 0, limit: 30, remaining: 30 });
  const [creating, setCreating] = useState(false);

  // Optional collapsible advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visualStyle, setVisualStyle] = useState('Cinematic High-Contrast');
  const [videoLength, setVideoLength] = useState<number>(1);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [chanRes, projRes] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/projects'),
      ]);

      if (chanRes.ok) {
        const cData = await chanRes.json();
        setChannels(cData.channels || []);
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.monthlyUsage) {
          setMonthlyUsage(pData.monthlyUsage);
        }
      }
    } catch {}
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.warning('Please enter what you want your video to be about');
      return;
    }
    if (monthlyUsage.remaining <= 0) {
      toast.error(`Monthly plan limit reached (${monthlyUsage.used}/${monthlyUsage.limit} videos).`);
      return;
    }
    if (selectedVoice === 'custom' && !customVoiceId.trim()) {
      toast.warning('Please enter your ElevenLabs Voice ID');
      return;
    }
    if (creating) return;

    try {
      setCreating(true);
      toast.info('Starting AI video creation pipeline... ⚡');

      let targetChannelId = channels[0]?.id;
      if (!targetChannelId) {
        const cRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Studio Channel', niche: 'General', target_duration_minutes: videoLength }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          targetChannelId = cData.channel?.id;
        }
      }

      const activeVoice = selectedVoice === 'custom' ? customVoiceId.trim() : selectedVoice;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: targetChannelId || 'default_channel',
          topic: topic.trim(),
          target_length_minutes: videoLength,
          voice: activeVoice,
          visual_style: visualStyle,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start video generation');
      }

      const data = await res.json();
      toast.success('Your video is being created!');
      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 0 60px' }}>
      {/* Top Breadcrumb & Quota Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back to Dashboard
        </Link>
        <div style={{ fontSize: '12px', color: monthlyUsage.remaining > 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
          {monthlyUsage.used} / {monthlyUsage.limit} videos this month ({monthlyUsage.remaining} remaining)
        </div>
      </div>

      <div style={{
        background: '#121215',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
          Create Your Video
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 28px 0' }}>
          Tell us what you want your video to be about.
        </p>

        <form onSubmit={handleCreateVideo} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          {/* STEP 1: TOPIC INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#f4f4f5', marginBottom: '6px' }}>
              What do you want to make a video about?
            </label>
            <textarea
              className="form-input"
              rows={3}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                background: '#09090b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                resize: 'none',
                lineHeight: 1.5
              }}
              placeholder="e.g. 10 foods that help support healthy aging"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div style={{ fontSize: '12px', color: '#71717a', marginTop: '6px' }}>
              Tip: You can enter a headline, a question, or a detailed prompt.
            </div>
          </div>

          {/* STEP 2: CHOOSE VOICE */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#f4f4f5', marginBottom: '10px' }}>
              Choose Your Voice
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {STUDIO_VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                      background: isSelected ? '#09090b' : 'transparent'
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{v.name}</div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa' }}>{v.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Voice ID Input */}
            {selectedVoice === 'custom' && (
              <div style={{ marginTop: '14px', padding: '14px', background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                  Your ElevenLabs Voice ID:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    background: '#121215',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                  placeholder="Paste your 20-character Voice ID (e.g. 21m00Tcm4TlvDq8ikWAM)"
                  value={customVoiceId}
                  onChange={(e) => setCustomVoiceId(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* HEALTH CONTENT SAFE MODE NOTICE */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.15)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>ℹ️</span>
            <span>AI-generated health content should be reviewed before publishing.</span>
          </div>

          {/* OPTIONAL ADVANCED SETTINGS (COLLAPSIBLE) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{showAdvanced ? '− Hide' : '+ Show'} Advanced Settings (Optional)</span>
            </button>

            {showAdvanced && (
              <div style={{ marginTop: '14px', padding: '16px', background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                    Visual Style
                  </label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      background: '#121215',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  >
                    <option value="Cinematic High-Contrast">Cinematic Documentary</option>
                    <option value="Photorealistic 8K">Natural Realism</option>
                    <option value="Modern Clean">Minimalist Modern</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                    Target Duration
                  </label>
                  <select
                    value={videoLength}
                    onChange={(e) => setVideoLength(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      background: '#121215',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  >
                    <option value={1}>Short Format (1 Minute)</option>
                    <option value={3}>Standard Breakdown (3 Minutes)</option>
                    <option value={5}>Full Story (5 Minutes)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* PRIMARY CTA & MANDATORY EXPLANATION */}
          <div style={{ marginTop: '10px' }}>
            <button
              type="submit"
              disabled={creating || !topic.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: '#ffffff',
                color: '#09090b',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {creating ? 'Creating Video...' : 'Create Video ➔'}
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#a1a1aa',
              margin: '12px 0 0 0',
              lineHeight: 1.5
            }}>
              AI will write the script, create the scenes, generate the voiceover and render your final video automatically.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateVideoWizard() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading Studio Creator...</div>}>
      <CreateVideoWizardContent />
    </Suspense>
  );
}
