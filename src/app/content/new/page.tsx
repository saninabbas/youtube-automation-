'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface UserVoice {
  id: string;
  user_id: string;
  name: string;
  voice_id: string;
  sample_url?: string;
  created_at: string;
}

const STUDIO_VOICES = [
  { id: 'elevenlabs:rachel', name: 'Studio Voice 1', desc: 'Rachel (Female, Calm & Professional)' },
  { id: 'elevenlabs:adam', name: 'Studio Voice 2', desc: 'Adam (Male, Deep & Cinematic)' },
  { id: 'elevenlabs:antoni', name: 'Studio Voice 3', desc: 'Antoni (Male, Energetic & Dynamic)' },
  { id: 'elevenlabs:bella', name: 'Studio Voice 4', desc: 'Bella (Female, Warm & Conversational)' },
  { id: 'en-US-ChristopherNeural', name: 'Studio Voice 5', desc: 'Christopher (Male, Clear Broadcast)' },
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

  // User Cloned Voices
  const [myVoices, setMyVoices] = useState<UserVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Voice Cloning Modal State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTab, setCloneTab] = useState<'mic' | 'upload'>('mic');
  const [newVoiceName, setNewVoiceName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [cloningLoading, setCloningLoading] = useState(false);

  // Audio Playback Preview State
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optional collapsible advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visualStyle, setVisualStyle] = useState('Cinematic High-Contrast');
  const [videoLength, setVideoLength] = useState<number>(1);

  useEffect(() => {
    fetchUserData();
    fetchUserVoices();
  }, []);

  // Cleanup object URLs and audio recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordedAudioUrl, uploadedAudioUrl]);

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

  const fetchUserVoices = async () => {
    try {
      setLoadingVoices(true);
      const res = await fetch('/api/voice/my-voices');
      if (res.ok) {
        const data = await res.json();
        const voices: UserVoice[] = data.voices || [];
        setMyVoices(voices);
        // If user already has a custom voice and none selected yet, could auto-select
      }
    } catch (err) {
      console.warn('Could not load user voices:', err);
    } finally {
      setLoadingVoices(false);
    }
  };

  // Live Audio Recording Handlers
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Microphone access is not supported by this browser. Please upload an audio file instead.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(audioBlob);
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Stop all tracks to turn off microphone indicator
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // collect data chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            // Auto stop at 60s
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      toast.error(err.message?.includes('Permission') ? 'Microphone permission denied. Please allow microphone access or upload an audio file.' : 'Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25 MB limit.');
      return;
    }

    setUploadedFile(file);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setUploadedAudioUrl(URL.createObjectURL(file));

    // Auto-suggest name from file
    if (!newVoiceName.trim()) {
      const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewVoiceName(suggested.charAt(0).toUpperCase() + suggested.slice(1));
    }
  };

  const handleCloneVoice = async () => {
    const nameToUse = newVoiceName.trim() || 'My Cloned Voice';
    let audioToSend: Blob | File | null = null;
    let fileName = 'recording.webm';

    if (cloneTab === 'mic') {
      if (!recordedBlob) {
        toast.warning('Please record an audio sample first.');
        return;
      }
      if (recordingSeconds < 5 && recordedBlob.size < 10000) {
        toast.warning('Please record at least 5-10 seconds of clear speech.');
        return;
      }
      audioToSend = recordedBlob;
    } else {
      if (!uploadedFile) {
        toast.warning('Please select an audio file to upload.');
        return;
      }
      audioToSend = uploadedFile;
      fileName = uploadedFile.name;
    }

    try {
      setCloningLoading(true);
      toast.info('Cloning your voice with AI... This takes ~5 to 10 seconds ⚡');

      const formData = new FormData();
      formData.append('name', nameToUse);
      formData.append('file', audioToSend, fileName);

      const res = await fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clone voice');
      }

      toast.success(`🎉 Voice "${nameToUse}" successfully cloned!`);

      // Add to state and select it
      const newVoice: UserVoice = data.voice;
      setMyVoices((prev) => [newVoice, ...prev]);
      setSelectedVoice(newVoice.voice_id);

      // Reset modal state and close
      setShowCloneModal(false);
      setRecordedBlob(null);
      setRecordedAudioUrl(null);
      setUploadedFile(null);
      setUploadedAudioUrl(null);
      setNewVoiceName('');
      setRecordingSeconds(0);
    } catch (err: any) {
      toast.error(err.message || 'Voice cloning failed');
    } finally {
      setCloningLoading(false);
    }
  };

  const handleDeleteVoice = async (e: React.MouseEvent, voiceDbId: string, voiceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this cloned voice?')) return;

    try {
      const res = await fetch(`/api/voice/my-voices?id=${voiceDbId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyVoices((prev) => prev.filter((v) => v.id !== voiceDbId));
        if (selectedVoice === voiceId) {
          setSelectedVoice('elevenlabs:rachel');
        }
        toast.info('Voice removed.');
      } else {
        toast.error('Failed to remove voice');
      }
    } catch {
      toast.error('Network error removing voice');
    }
  };

  const handlePlaySample = (e: React.MouseEvent, sampleUrl?: string, voiceKey?: string) => {
    e.stopPropagation();
    if (!sampleUrl) return;

    if (playingVoiceId === voiceKey && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => setPlayingVoiceId(null);
      audioPlayerRef.current.onerror = () => {
        toast.error('Could not play sample audio.');
        setPlayingVoiceId(null);
      };
    }

    audioPlayerRef.current.src = sampleUrl;
    audioPlayerRef.current.play().catch(() => setPlayingVoiceId(null));
    setPlayingVoiceId(voiceKey || 'sample');
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
    if (selectedVoice === 'custom_manual' && !customVoiceId.trim()) {
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

      const activeVoice = selectedVoice === 'custom_manual' ? customVoiceId.trim() : selectedVoice;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>
                Choose Voice
              </label>
              <button
                type="button"
                onClick={() => setShowCloneModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                }}
              >
                <span>🎙️</span>
                <span>Clone Your Voice</span>
              </button>
            </div>

            {/* MY CLONED VOICES SECTION (If Any) */}
            {myVoices.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  My Cloned Voices ({myVoices.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {myVoices.map((v) => {
                    const isSelected = selectedVoice === v.voice_id;
                    const isPlaying = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoice(v.voice_id)}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #818cf8' : '1px solid rgba(255,255,255,0.3)',
                            background: isSelected ? '#09090b' : 'transparent',
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🎙️ {v.name}</span>
                              <span style={{ fontSize: '10px', background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                My Voice
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                              Cloned AI Voice • Ready to narrate
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {v.sample_url && (
                            <button
                              type="button"
                              onClick={(e) => handlePlaySample(e, v.sample_url, v.id)}
                              title="Play sample"
                              style={{
                                background: isPlaying ? '#4f46e5' : 'rgba(255,255,255,0.08)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {isPlaying ? '⏸' : '▶'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteVoice(e, v.id, v.voice_id)}
                            title="Delete cloned voice"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#71717a',
                              cursor: 'pointer',
                              fontSize: '13px',
                              padding: '2px 6px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PRE-MADE STUDIO VOICES */}
            <div>
              {myVoices.length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Studio Voices (Pre-configured)
                </div>
              )}
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
                        background: isSelected ? '#09090b' : 'transparent',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: '#a1a1aa' }}>{v.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Collapsed Accordion for Raw Voice ID (For Power Users Only) */}
            <details style={{ marginTop: '14px', fontSize: '12px', color: '#71717a' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}>
                Advanced: Paste an external ElevenLabs Voice ID manually
              </summary>
              <div style={{ marginTop: '8px', padding: '12px', background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      fontSize: '12px',
                      background: '#121215',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                    value={customVoiceId}
                    onChange={(e) => {
                      setCustomVoiceId(e.target.value);
                      if (e.target.value.trim()) {
                        setSelectedVoice('custom_manual');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customVoiceId.trim()) {
                        setSelectedVoice('custom_manual');
                        toast.success('Custom Voice ID selected');
                      }
                    }}
                    style={{
                      background: selectedVoice === 'custom_manual' ? '#10b981' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedVoice === 'custom_manual' ? '✓ Using Custom ID' : 'Apply'}
                  </button>
                </div>
              </div>
            </details>
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

      {/* IN-APP INSTANT VOICE CLONING MODAL */}
      {showCloneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎙️</span>
                  <span>Instant Voice Cloning</span>
                </h2>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
                  Clone your voice in seconds. Videos will be narrated with your exact tone and accent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setShowCloneModal(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#a1a1aa',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#09090b', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setCloneTab('mic')}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: cloneTab === 'mic' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: cloneTab === 'mic' ? '#fff' : '#71717a'
                }}
              >
                🎤 Record Microphone
              </button>
              <button
                type="button"
                onClick={() => setCloneTab('upload')}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: cloneTab === 'upload' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: cloneTab === 'upload' ? '#fff' : '#71717a'
                }}
              >
                📁 Upload Audio File
              </button>
            </div>

            {/* TAB 1: RECORD WITH MICROPHONE */}
            {cloneTab === 'mic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  {isRecording ? (
                    <div>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 1.5s infinite',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
                      }}>
                        <span style={{ fontSize: '24px' }}>🎤</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
                        00:{recordingSeconds.toString().padStart(2, '0')} / 01:00
                      </div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '6px' }}>
                        Speaking clearly into your microphone... (speak for 10-30 seconds)
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                          marginTop: '16px',
                          padding: '8px 20px',
                          background: '#ffffff',
                          color: '#09090b',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ⏹️ Stop Recording
                      </button>
                    </div>
                  ) : recordedAudioUrl ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginBottom: '8px' }}>
                        ✓ Voice sample recorded ({recordingSeconds}s)
                      </div>
                      <audio controls src={recordedAudioUrl} style={{ width: '100%', marginBottom: '12px' }} />
                      <button
                        type="button"
                        onClick={() => {
                          setRecordedBlob(null);
                          setRecordedAudioUrl(null);
                          setRecordingSeconds(0);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ↺ Re-record Sample
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', lineHeight: 1.6 }}>
                        <span style={{ color: '#e4e4e7', fontWeight: 600 }}>Suggested Reading Sample (15-20s):</span><br />
                        <em>&ldquo;Hello and welcome to my channel. In this video, we will explore exciting ideas, healthy habits, and helpful insights to level up your everyday life. Let&apos;s get started!&rdquo;</em>
                      </div>
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{
                          padding: '12px 24px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <span>🔴</span>
                        <span>Start Recording</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD AUDIO FILE */}
            {cloneTab === 'upload' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  padding: '24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  {uploadedFile ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
                        ✓ {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '12px' }}>
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      {uploadedAudioUrl && (
                        <audio controls src={uploadedAudioUrl} style={{ width: '100%', marginBottom: '12px' }} />
                      )}
                      <label style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        Choose Different File
                        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                        Choose an audio sample file
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '16px' }}>
                        Supports MP3, WAV, M4A, WebM (up to 25 MB). Clear vocal speaking sample works best.
                      </div>
                      <label style={{
                        display: 'inline-block',
                        background: '#ffffff',
                        color: '#09090b',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}>
                        Browse Audio File
                        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voice Name Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                Give Your Voice a Name
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '13px',
                  background: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
                placeholder="e.g. My Host Voice, Nabeel's Voice"
                value={newVoiceName}
                onChange={(e) => setNewVoiceName(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setShowCloneModal(false);
                }}
                disabled={cloningLoading}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a1a1aa',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: cloningLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloneVoice}
                disabled={cloningLoading || (cloneTab === 'mic' ? !recordedBlob : !uploadedFile)}
                style={{
                  background: cloningLoading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: (cloningLoading || (cloneTab === 'mic' ? !recordedBlob : !uploadedFile)) ? 'not-allowed' : 'pointer',
                  opacity: (cloneTab === 'mic' ? !recordedBlob : !uploadedFile) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {cloningLoading ? (
                  <>
                    <span>⏳</span>
                    <span>Cloning Voice (~5-10s)...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Clone My Voice Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
