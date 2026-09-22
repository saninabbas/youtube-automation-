'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LandingPage } from '@/components/LandingPage';
import { useToast } from '@/components/Toast';

// ─────────────────────────────────────────────────────────────
// 1. DATA DEFINITIONS & STATIC SUGGESTIONS (Clearly Labeled)
// ─────────────────────────────────────────────────────────────

interface VideoFormat {
  id: string;
  title: string;
  icon: string;
  description: string;
  preset: string;
  defaultDuration: number;
}

const VIDEO_FORMATS: VideoFormat[] = [
  {
    id: 'podcast',
    title: 'Podcast',
    icon: '🎙️',
    description: 'Talk directly to your audience',
    preset: 'PODCAST',
    defaultDuration: 60,
  },
  {
    id: 'vlog',
    title: 'Vlog',
    icon: '🎥',
    description: 'Personal creator-style video',
    preset: 'VLOG',
    defaultDuration: 45,
  },
  {
    id: 'explainer',
    title: 'Explainer',
    icon: '🧠',
    description: 'Educational & informative',
    preset: 'EXPLAINER',
    defaultDuration: 45,
  },
  {
    id: 'news',
    title: 'News',
    icon: '⚡',
    description: 'Fast commentary & updates',
    preset: 'NEWS',
    defaultDuration: 30,
  },
  {
    id: 'cinematic',
    title: 'Cinematic',
    icon: '🎬',
    description: 'Story-driven visual content',
    preset: 'CINEMATIC',
    defaultDuration: 60,
  },
];

const QUICK_TOPIC_CHIPS = [
  { label: 'AI', topic: 'The unstoppable rise of autonomous AI agents in 2026', format: 'explainer' },
  { label: 'Business', topic: 'How modern creators automate $10K/mo faceless channels', format: 'podcast' },
  { label: 'Facts', topic: '5 shocking paradoxes that will break your brain', format: 'explainer' },
  { label: 'Technology', topic: 'Why quantum computing changes modern encryption forever', format: 'news' },
  { label: 'Motivation', topic: 'The brutal truth about discipline versus fleeting motivation', format: 'cinematic' },
  { label: 'History', topic: '3 ancient lost cities discovered deep beneath the ocean', format: 'explainer' },
  { label: 'Gaming', topic: 'The hidden physics tricks game engines use to simulate reality', format: 'vlog' },
];

const VIRAL_IDEAS_BANK = [
  'Top 5 mysterious places in the world science still cannot explain',
  'Dark psychological facts about human decision making',
  'What happens to your cognitive performance when you drink black coffee',
  '3 ancient lost civilizations uncovered with satellite radar',
  'High-performance habits that separate senior founders from novices',
  'Mind-blowing artificial intelligence breakthroughs scheduled for late 2026',
  '5 optical illusions that reveal how the human visual cortex processes light',
  'Why the global tech sector is restructuring around agentic automation',
];

const TRENDING_NOW_SUGGESTIONS = [
  { topic: 'Autonomous AI Agents', category: 'Technology', trend: 'Trending' },
  { topic: 'Future of Humanoid Robotics', category: 'Technology', trend: 'Trending' },
  { topic: 'Micro-Habits for Deep Focus', category: 'Productivity', trend: 'Trending' },
  { topic: 'Deep Space James Webb Discoveries', category: 'Science', trend: 'Trending' },
];

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Primary Data State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState({ used: 0, limit: 30, remaining: 30 });
  const [credits, setCredits] = useState<any>(null);
  const [youtubeStatus, setYoutubeStatus] = useState<'CONNECTED' | 'NOT_CONNECTED' | 'AUTH_REQUIRED'>('NOT_CONNECTED');
  const [youtubeChannel, setYoutubeChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Video Creator State
  const [quickTopic, setQuickTopic] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('explainer');
  const [voiceModel, setVoiceModel] = useState('Adam (Deep, Narrator)');
  const [backgroundFootage, setBackgroundFootage] = useState('Minecraft Parkour');
  const [duration, setDuration] = useState<number>(45);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [autoUpload, setAutoUpload] = useState(false);
  const [creating, setCreating] = useState(false);

  // AI Idea Assistant State
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    'The AI Revolution Nobody Expected in 2026',
    "5 Critical Things You Didn't Know About Autonomous Agents",
    'Why Media Creation Workflows Are Moving To Pure Code',
  ]);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  // Preview Modal State
  const [previewProject, setPreviewProject] = useState<any | null>(null);

  const topicInputRef = useRef<HTMLInputElement | null>(null);

  // Greeting by time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Focus topic input if `?create=1` query param present
  useEffect(() => {
    if (searchParams?.get('create') === '1' && topicInputRef.current) {
      topicInputRef.current.focus();
      topicInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [meRes, projRes, chanRes, ytRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/channels'),
        fetch('/api/auth/youtube/status').catch(() => null),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated) {
          setCurrentUser(meData.user);
          setCredits(meData.credits);
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (pData.monthlyUsage) {
          setMonthlyUsage(pData.monthlyUsage);
        }
      }

      if (chanRes.ok) {
        const cData = await chanRes.json();
        setChannels(cData.channels || []);
      }

      if (ytRes && ytRes.ok) {
        const ytData = await ytRes.json();
        setYoutubeStatus(ytData.status || 'NOT_CONNECTED');
        if (ytData.channel) {
          setYoutubeChannel(ytData.channel);
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  // Lightweight Polling for Active Video Generation (automatically stops when completed)
  useEffect(() => {
    const hasActiveJobs = projects.some((p) => {
      const s = (p.status || '').toUpperCase();
      return s === 'PROCESSING' || s === 'RENDERING' || s === 'GENERATING' || s === 'PENDING';
    });

    if (!hasActiveJobs) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const pData = await res.json();
          const list = pData.projects || [];
          setProjects(list);
          const stillActive = list.some((p: any) => {
            const s = (p.status || '').toUpperCase();
            return s === 'PROCESSING' || s === 'RENDERING' || s === 'GENERATING' || s === 'PENDING';
          });
          if (!stillActive) {
            clearInterval(interval);
            toast.success('Video rendering completed! Ready to preview. ✨');
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [projects]);

  // Handle Escape key to close preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Surprise Me Handler (selects authentic prompt from viral bank)
  const handleSurpriseMe = () => {
    const randomTopic = VIRAL_IDEAS_BANK[Math.floor(Math.random() * VIRAL_IDEAS_BANK.length)];
    setQuickTopic(randomTopic);
    toast.info('Loaded viral concept: ' + randomTopic.substring(0, 35) + '... ✨');
  };

  // Reset Configuration
  const handleResetConfig = () => {
    setQuickTopic('');
    setSelectedFormat('explainer');
    setVoiceModel('Adam (Deep, Narrator)');
    setBackgroundFootage('Minecraft Parkour');
    setDuration(45);
    setAutoCaptions(true);
    setAutoUpload(false);
    toast.info('Workspace reset to defaults.');
  };

  // Fetch or Shuffle Real Ideas via Copilot Assistant
  const handleRefreshIdeas = async () => {
    try {
      setIsGeneratingIdea(true);
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_titles',
          topic: channels[0]?.niche || 'Technology & Science',
          niche: channels[0]?.niche || 'AI & Automation',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result && typeof data.result === 'string') {
          const lines = data.result
            .split('\n')
            .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').replace(/["']/g, '').trim())
            .filter((l: string) => l.length > 10)
            .slice(0, 3);
          if (lines.length > 0) {
            setAiSuggestions(lines);
            toast.success('AI Idea Assistant found 3 fresh concepts 💡');
            return;
          }
        }
      }
      // Shuffle fallback ideas if LLM key not configured
      const shuffled = [...VIRAL_IDEAS_BANK].sort(() => 0.5 - Math.random()).slice(0, 3);
      setAiSuggestions(shuffled);
      toast.info('Shuffled creative topic suggestions ✨');
    } catch {
      const shuffled = [...VIRAL_IDEAS_BANK].sort(() => 0.5 - Math.random()).slice(0, 3);
      setAiSuggestions(shuffled);
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  // Generate Video Submission
  const handleGenerateShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) {
      toast.warning('Please enter a video topic or concept.');
      topicInputRef.current?.focus();
      return;
    }
    if (creating) return;

    try {
      setCreating(true);
      toast.info('Dispatching AI Video Production Pipeline... ⚡');

      let targetChannelId = channels[0]?.id;
      if (!targetChannelId) {
        const cRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${currentUser?.name || 'Creator'}'s Studio`,
            niche: 'AI & Innovation',
            target_duration_minutes: Math.max(1, Math.round(duration / 60)),
          }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          targetChannelId = cData.channel?.id;
        }
      }

      const activeFormatObj = VIDEO_FORMATS.find((f) => f.id === selectedFormat) || VIDEO_FORMATS[2];

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: targetChannelId || 'default_channel',
          topic: quickTopic.trim(),
          preset: activeFormatObj.preset,
          target_length_minutes: Math.max(1, Math.round(duration / 60)),
          voice: voiceModel,
          visual_style: backgroundFootage,
          auto_captions: autoCaptions,
          auto_upload: autoUpload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to initialize project pipeline');
      }

      const data = await res.json();
      toast.success('Video queued for synthesis! Tracking progress below.');
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Remix Handler: creates a new project with fresh ID and script variation
  const handleRemix = async (project: any) => {
    try {
      toast.info(`Remixing "${project.topic.substring(0, 30)}..." into a new project 🔄`);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: project.channel_id,
          topic: `${project.topic} (Remix Version)`,
          preset: project.preset || 'EXPLAINER',
          target_length_minutes: project.target_length_minutes || 1,
          voice: project.channel_voice || voiceModel,
          visual_style: project.channel_visual_style || backgroundFootage,
          auto_captions: true,
          auto_upload: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remix project');
      }

      toast.success('Fresh version generated! Added to active generation queue.');
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Remix failed');
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Project removed from library.');
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete project');
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete request failed');
    }
  };

  // Direct Publish to YouTube Handler
  const handlePublishYouTube = async (project: any) => {
    if (youtubeStatus !== 'CONNECTED') {
      toast.warning('Connect YouTube first to publish directly.');
      const res = await fetch('/api/auth/youtube/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
      return;
    }

    try {
      toast.info('Publishing video to your linked YouTube channel... 🚀');
      const res = await fetch(`/api/projects/${project.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'YouTube', visibility: 'PRIVATE' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Video published successfully to YouTube!');
        await fetchDashboardData();
      } else {
        toast.error(data.error || 'Publishing failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Publishing error');
    }
  };

  // If user is unauthenticated, show public marketing landing page
  if (!loading && !currentUser) {
    return <LandingPage />;
  }

  // Active in-progress jobs (REAL DATABASE JOBS)
  const activeJobs = projects.filter((p) => {
    const s = (p.status || '').toUpperCase();
    return s === 'PROCESSING' || s === 'RENDERING' || s === 'GENERATING' || s === 'PENDING';
  });

  const activeRendering = activeJobs[0] || null;

  // Real Completed Projects
  const completedProjects = projects.filter((p) => (p.status || '').toUpperCase() === 'COMPLETED');

  // Real Scheduled Projects
  const scheduledProjects = projects.filter((p) => p.scheduled_at && (p.publishing_status || '').toUpperCase() !== 'PUBLISHED');

  // Dynamic Setup Progress Calculation
  const setupSteps = [
    { label: 'Account created', completed: true },
    { label: 'Choose default voice', completed: !!channels[0]?.voice || voiceModel !== '' },
    { label: 'Create first video', completed: projects.length > 0 },
    { label: 'Connect YouTube', completed: youtubeStatus === 'CONNECTED' },
    { label: 'Set upload schedule', completed: !!channels[0]?.publishing_time || scheduledProjects.length > 0 },
  ];
  const completedStepCount = setupSteps.filter((s) => s.completed).length;
  const setupPercent = Math.round((completedStepCount / setupSteps.length) * 100);
  const showSetupCard = !currentUser?.onboarding_completed && setupPercent < 100;

  // Calculate Real Creator Streak from user activity in the last 7 days
  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const recentWeekVideos = projects.filter((p) => {
    if (!p.created_at) return false;
    const projectMs = new Date(p.created_at).getTime();
    return projectMs >= sevenDaysAgoMs;
  });
  const showStreakCard = recentWeekVideos.length > 0;

  // Real configuration-based estimates (DO NOT INVENT ESTIMATES)
  const estimatedScenes = Math.max(2, Math.round(duration / 7.5));
  const estimatedCredits = Math.max(8, Math.round((duration / 60) * 16));

  // Determine active pipeline stage progress percentage
  const getStageProgress = (stage: string) => {
    const norm = (stage || '').toUpperCase();
    switch (norm) {
      case 'SCRIPT':
        return 18;
      case 'SCENES':
        return 38;
      case 'VOICE':
        return 58;
      case 'VIDEO':
        return 78;
      case 'SUBTITLES':
        return 88;
      case 'FINAL_VIDEO':
        return 96;
      case 'COMPLETED':
        return 100;
      default:
        return 25;
    }
  };

  const getStageLabel = (stage: string) => {
    const norm = (stage || '').toUpperCase();
    switch (norm) {
      case 'SCRIPT':
        return 'Writing AI script...';
      case 'SCENES':
        return 'Planning visual composition...';
      case 'VOICE':
        return 'Generating neural voiceover...';
      case 'VIDEO':
        return 'Synthesizing visual clips...';
      case 'SUBTITLES':
        return 'Generating synchronized captions...';
      case 'FINAL_VIDEO':
        return 'Rendering master 1080p video...';
      case 'COMPLETED':
        return 'Ready for preview';
      default:
        return 'Processing video job...';
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', padding: '4px 0 48px' }}>

      {/* ─────────────────────────────────────────────────────────────
          1. NEW HERO SECTION (CREATOR WORKSPACE ENTRYPOINT)
      ───────────────────────────────────────────────────────────── */}
      <section className="autoshort-hero-card" aria-label="Create Video Workspace">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e'
            }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {getGreeting()}, {currentUser?.name || 'Creator'} 👋
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em', margin: 0 }}>
            What are we creating today?
          </h1>

          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Turn an idea into a YouTube-ready video in minutes.
          </p>
        </div>

        {/* Large Prominent Topic Input Form */}
        <form onSubmit={handleGenerateShort} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="autoshort-hero-input-wrapper">
            <input
              id="creator-topic-input"
              ref={topicInputRef}
              type="text"
              className="autoshort-hero-input"
              style={{ paddingRight: '120px' }}
              placeholder="What do you want to make a video about? (e.g. The future of AI agents)"
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
              aria-label="Video topic input"
            />
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="autoshort-action-btn"
              style={{
                position: 'absolute',
                right: '10px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.12)',
                borderColor: 'rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                fontWeight: 700,
                fontSize: '13px'
              }}
              title="Pick a proven viral concept from our database"
              aria-label="Surprise Me with viral topic"
            >
              🎲 Surprise Me
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. QUICK TOPIC CHIPS
          ───────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              🔥 Trending:
            </span>
            {QUICK_TOPIC_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className={`autoshort-chip ${quickTopic === chip.topic ? 'active' : ''}`}
                onClick={() => {
                  setQuickTopic(chip.topic);
                  setSelectedFormat(chip.format);
                  toast.info(`Selected "${chip.label}": loaded topic and preset format`);
                }}
                title={`Generate video about ${chip.topic}`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. VIDEO FORMAT SELECTOR (5 SELECTABLE CARDS)
          ───────────────────────────────────────────────────────────── */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', marginBottom: '10px' }}>
              What type of video?
            </div>

            <div className="autoshort-format-grid" role="radiogroup" aria-label="Video Format Selector">
              {VIDEO_FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`autoshort-format-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedFormat(fmt.id);
                      setDuration(fmt.defaultDuration);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setSelectedFormat(fmt.id);
                        setDuration(fmt.defaultDuration);
                      }
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: 1, marginBottom: '8px' }}>
                      {fmt.icon}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                      {fmt.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.3 }}>
                      {fmt.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generation CTA Button Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#71717a' }}>
              <span>Estimated duration: <strong style={{ color: '#fff' }}>{duration}s</strong></span>
              <span>•</span>
              <span>Scenes: <strong style={{ color: '#fff' }}>{estimatedScenes}</strong></span>
              <span>•</span>
              <span>Estimated credits: <strong style={{ color: '#c084fc' }}>{estimatedCredits}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResetConfig}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 10px'
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={creating || !quickTopic.trim()}
                style={{
                  padding: '12px 24px',
                  background: '#ffffff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: creating || !quickTopic.trim() ? 'not-allowed' : 'pointer',
                  opacity: creating || !quickTopic.trim() ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.15s ease'
                }}
              >
                {creating ? (
                  <>
                    <div className="autoshort-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000', width: '16px', height: '16px' }} />
                    <span>Dispatching Job...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. PERSONAL AI CREATOR HIGHLIGHT CARD
      ───────────────────────────────────────────────────────────── */}
      <section className="autoshort-personal-card" aria-label="Personal AI Creator">
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '280px', flex: '1 1 auto' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)'
          }}>
            👤
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                CREATE WITH YOUR FACE & VOICE
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Turn yourself into an AI-powered YouTube creator.
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' }}>
              Use your own face and voice for presenter-style videos.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/personal-ai?tab=avatar"
            className="autoshort-action-btn"
            style={{ padding: '8px 14px' }}
          >
            📸 Upload Your Photo
          </Link>
          <Link
            href="/dashboard/personal-ai?tab=voice"
            className="autoshort-action-btn"
            style={{ padding: '8px 14px' }}
          >
            🎙️ Add Your Voice
          </Link>
          <Link
            href="/dashboard/personal-ai?tab=create"
            className="autoshort-action-btn"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700
            }}
          >
            ✨ Create Personal Video
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. TWO-COLUMN MAIN WORKSPACE GRID
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* ── LEFT COLUMN: CREATION SETTINGS, SMART SUMMARY & IDEAS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Creation Settings Panel */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Video Settings
              </h2>
              <span style={{ fontSize: '11px', color: '#71717a' }}>
                Preset: <strong style={{ color: '#fff' }}>{selectedFormat.toUpperCase()}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Row with Voice & Style Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                    AI Voice Model
                  </label>
                  <select
                    className="autoshort-select"
                    value={voiceModel}
                    onChange={(e) => setVoiceModel(e.target.value)}
                    aria-label="AI Voice Model"
                  >
                    <option value="Adam (Deep, Narrator)">Adam (Deep, Narrator)</option>
                    <option value="Rachel (Energetic, Viral)">Rachel (Energetic, Viral)</option>
                    <option value="Antony (Documentary)">Antony (Documentary)</option>
                    <option value="Bella (Warm, Friendly)">Bella (Warm, Friendly)</option>
                    <option value="Josh (Dramatic Storyteller)">Josh (Dramatic Storyteller)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                    Visual Style / Background
                  </label>
                  <select
                    className="autoshort-select"
                    value={backgroundFootage}
                    onChange={(e) => setBackgroundFootage(e.target.value)}
                    aria-label="Visual Style or Footage"
                  >
                    <option value="Minecraft Parkour">Minecraft Parkour</option>
                    <option value="Subway Surfers Gameplay">Subway Surfers</option>
                    <option value="Satisfying Kinetic / Slime">Satisfying Slime</option>
                    <option value="GTA 5 Mega Ramp Stunts">GTA 5 Mega Ramp</option>
                    <option value="Cinematic 4K Deep Space">Deep Space 4K</option>
                    <option value="Relaxing Nature Drone">Nature Cinematic</option>
                  </select>
                </div>
              </div>

              {/* Duration Slider */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>
                    Duration Limit
                  </label>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {duration}s
                  </span>
                </div>

                <input
                  type="range"
                  min={15}
                  max={60}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="autoshort-slider"
                  aria-label="Duration Slider"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#71717a', fontWeight: 600 }}>
                  <span style={{ color: duration === 15 ? '#fff' : '#71717a' }}>15s</span>
                  <span style={{ color: duration === 30 ? '#fff' : '#71717a' }}>30s</span>
                  <span style={{ color: duration === 45 ? '#fff' : '#71717a' }}>45s</span>
                  <span style={{ color: duration === 60 ? '#fff' : '#71717a' }}>60s</span>
                </div>
              </div>

              {/* Toggles Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Auto Captions</div>
                    <div style={{ fontSize: '10px', color: '#71717a' }}>Karaoke sync</div>
                  </div>
                  <label className="autoshort-switch">
                    <input
                      type="checkbox"
                      checked={autoCaptions}
                      onChange={(e) => setAutoCaptions(e.target.checked)}
                      aria-label="Toggle Auto Captions"
                    />
                    <span className="autoshort-switch-slider"></span>
                  </label>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Auto Upload</div>
                    <div style={{ fontSize: '10px', color: '#71717a' }}>To linked YouTube</div>
                  </div>
                  <label className="autoshort-switch">
                    <input
                      type="checkbox"
                      checked={autoUpload}
                      onChange={(e) => setAutoUpload(e.target.checked)}
                      aria-label="Toggle Auto Upload"
                    />
                    <span className="autoshort-switch-slider"></span>
                  </label>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  9. SMART CREATION SUMMARY
              ───────────────────────────────────────────────────────────── */}
              <div className="autoshort-summary-card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  YOUR VIDEO CONFIGURATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#71717a' }}>Format: </span>
                    <strong style={{ color: '#fff' }}>{VIDEO_FORMATS.find((f) => f.id === selectedFormat)?.title}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>Voice: </span>
                    <strong style={{ color: '#fff' }}>{voiceModel.split(' ')[0]}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>Duration: </span>
                    <strong style={{ color: '#fff' }}>{duration}s</strong>
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>Captions: </span>
                    <strong style={{ color: autoCaptions ? '#22c55e' : '#71717a' }}>{autoCaptions ? 'ON' : 'OFF'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>Credits: </span>
                    <strong style={{ color: '#c084fc' }}>{estimatedCredits}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              6. AI IDEA ASSISTANT
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💡 Need an idea?
                </h3>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0' }}>
                  I found some topics that could work for your channel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshIdeas}
                disabled={isGeneratingIdea}
                className="autoshort-action-btn"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                title="Generate fresh suggestions"
              >
                {isGeneratingIdea ? 'Thinking...' : '🔄 Shuffle'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiSuggestions.map((idea, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idea}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickTopic(idea);
                      toast.info('Topic loaded into creator! Click Generate Video to build.');
                      topicInputRef.current?.focus();
                    }}
                    className="autoshort-action-btn"
                    style={{ flexShrink: 0, fontSize: '11px', padding: '4px 10px', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.25)' }}
                  >
                    Use Idea
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              7. TRENDING NOW SECTION
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Trending Now
              </h3>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0' }}>
                Popular topics you can turn into videos.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {TRENDING_NOW_SUGGESTIONS.map((t, idx) => (
                <div
                  key={idx}
                  className="autoshort-tag-card"
                  onClick={() => {
                    setQuickTopic(t.topic);
                    toast.info(`Loaded trending topic: ${t.topic}`);
                    topicInputRef.current?.focus();
                  }}
                  title="Click to generate video about this topic"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
                      {t.category}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🔥 {t.trend}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', marginTop: '2px' }}>
                    {t.topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: ACTIVE QUEUE, RECENT VIDEOS, GROWTH & SCHEDULE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ─────────────────────────────────────────────────────────────
              10 & 11. LIVE GENERATION CARD / ACTIVE QUEUE
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Active Queue
              </h3>
              {activeJobs.length > 0 && (
                <span className="autoshort-badge-green" style={{ fontSize: '10px' }}>
                  {activeJobs.length} active
                </span>
              )}
            </div>

            {activeRendering ? (
              <div style={{
                background: '#13141a',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '12px',
                padding: '16px 18px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeRendering.topic}
                    </div>
                    <div style={{ fontSize: '12px', color: '#c084fc', marginTop: '2px', fontWeight: 500 }}>
                      {getStageLabel(activeRendering.current_stage)}
                    </div>
                  </div>
                  <div className="autoshort-spinner" />
                </div>

                {/* Real Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>
                    <span>Stage: {activeRendering.current_stage || 'PROCESSING'}</span>
                    <span>{getStageProgress(activeRendering.current_stage)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      className="autoshort-progress-glow"
                      style={{ width: `${getStageProgress(activeRendering.current_stage)}%` }}
                    />
                  </div>
                </div>

                {/* Stage checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', color: '#71717a', fontWeight: 600 }}>
                  <span style={{ color: ['SCRIPT', 'SCENES', 'VOICE', 'VIDEO', 'SUBTITLES', 'FINAL_VIDEO'].includes((activeRendering.current_stage || '').toUpperCase()) ? '#22c55e' : '#71717a' }}>
                    ✓ Script
                  </span>
                  <span style={{ color: ['SCENES', 'VOICE', 'VIDEO', 'SUBTITLES', 'FINAL_VIDEO'].includes((activeRendering.current_stage || '').toUpperCase()) ? '#22c55e' : '#71717a' }}>
                    ✓ Scenes
                  </span>
                  <span style={{ color: ['VOICE', 'VIDEO', 'SUBTITLES', 'FINAL_VIDEO'].includes((activeRendering.current_stage || '').toUpperCase()) ? '#22c55e' : '#71717a' }}>
                    ● Voice
                  </span>
                  <span style={{ color: ['VIDEO', 'SUBTITLES', 'FINAL_VIDEO'].includes((activeRendering.current_stage || '').toUpperCase()) ? '#22c55e' : '#71717a' }}>
                    ○ Visuals
                  </span>
                  <span style={{ color: ['SUBTITLES', 'FINAL_VIDEO'].includes((activeRendering.current_stage || '').toUpperCase()) ? '#22c55e' : '#71717a' }}>
                    ○ Captions
                  </span>
                  <span style={{ color: (activeRendering.current_stage || '').toUpperCase() === 'FINAL_VIDEO' ? '#22c55e' : '#71717a' }}>
                    ○ Render
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '24px 18px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>⚡</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', display: 'block' }}>
                  Queue is clear
                </span>
                <span style={{ fontSize: '11px', color: '#52525b', display: 'block', marginTop: '2px' }}>
                  Enter a topic above to generate your next short.
                </span>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              13. RECENT VIDEOS (REAL DATABASE DATA ONLY)
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Recent Videos
              </h3>
              <Link href="/content" style={{ fontSize: '12px', color: '#c084fc', fontWeight: 600 }}>
                View all ({projects.length}) →
              </Link>
            </div>

            {completedProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedProjects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#0d0e12',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      gap: '12px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 6px #22c55e',
                        flexShrink: 0
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.topic}
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                          {proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'Recent'} • {proj.target_length_minutes || 1}m • Ready
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewProject(proj)}
                        className="autoshort-action-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Preview video"
                      >
                        ▶ Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemix(proj)}
                        className="autoshort-action-btn"
                        style={{ padding: '4px 8px', fontSize: '11px', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.25)' }}
                        title="Create a fresh remix of this video"
                      >
                        🔄 Remix
                      </button>

                      <Link
                        href={`/content/${proj.id}`}
                        className="autoshort-action-btn"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Open in Studio editor"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="autoshort-action-btn autoshort-action-btn-danger"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Delete video"
                        aria-label="Delete video"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ─────────────────────────────────────────────────────────────
                  19. CLEAN EMPTY STATE (NO FAKE VIDEOS)
              ───────────────────────────────────────────────────────────── */
              <div style={{
                padding: '32px 20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🎬</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                  Your first video starts here.
                </span>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 14px' }}>
                  Enter a topic above and let AUTOSHORT handle the rest.
                </p>
                <button
                  type="button"
                  onClick={() => topicInputRef.current?.focus()}
                  className="autoshort-action-btn"
                  style={{ background: '#fff', color: '#09090b', fontWeight: 700 }}
                >
                  Create First Video
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              15. CHANNEL GROWTH CARD (REAL YOUTUBE DATA OR PROMPT)
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Channel Growth
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: youtubeStatus === 'CONNECTED' ? '#22c55e' : '#71717a',
                background: youtubeStatus === 'CONNECTED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${youtubeStatus === 'CONNECTED' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {youtubeStatus === 'CONNECTED' ? 'Connected' : 'Unlinked'}
              </span>
            </div>

            {youtubeStatus === 'CONNECTED' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    ▶
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {youtubeChannel?.title || 'Connected Channel'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>
                      {youtubeChannel?.customUrl || 'YouTube Partner Channel'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>Videos Synced</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                      {completedProjects.filter((p) => (p.publishing_status || '').toUpperCase() === 'PUBLISHED').length}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>Queue Ready</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                      {completedProjects.length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '20px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px'
              }}>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 12px' }}>
                  Connect your YouTube channel to see growth analytics and publish directly.
                </p>
                <Link
                  href="/settings/publishing"
                  className="autoshort-action-btn"
                  style={{ background: '#ffffff', color: '#09090b', fontWeight: 700 }}
                >
                  Connect YouTube Channel
                </Link>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              16. CREATOR STREAK (ONLY FROM ACTUAL ACTIVITY)
          ───────────────────────────────────────────────────────────── */}
          {showStreakCard && (
            <div className="autoshort-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔥 Creator Streak
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
                  {recentWeekVideos.length} {recentWeekVideos.length === 1 ? 'video' : 'videos'} this week
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 10px' }}>
                Consistent content production drives algorithmic retention.
              </p>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.round((recentWeekVideos.length / 7) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                  borderRadius: '3px'
                }} />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              17. SETUP PROGRESS (FOR NEW USERS - DYNAMICALLY CALCULATED)
          ───────────────────────────────────────────────────────────── */}
          {showSetupCard && (
            <div className="autoshort-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Get Started
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>
                  {setupPercent}% ready
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ width: `${setupPercent}%`, height: '100%', background: '#22c55e', borderRadius: '3px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {setupSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step.completed ? '#d1d5db' : '#71717a' }}>
                    <span style={{ color: step.completed ? '#22c55e' : '#52525b', fontWeight: 700 }}>
                      {step.completed ? '✓' : '○'}
                    </span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/onboarding"
                className="autoshort-action-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}
              >
                Complete Setup →
              </Link>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              18. UPCOMING PUBLISHING
          ───────────────────────────────────────────────────────────── */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Upcoming Publishing
              </h3>
              <Link href="/calendar" style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>
                Schedule →
              </Link>
            </div>

            {scheduledProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scheduledProjects.slice(0, 2).map((sProj) => (
                  <div
                    key={sProj.id}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sProj.topic}
                      </div>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>
                        {sProj.scheduled_at ? new Date(sProj.scheduled_at).toLocaleString() : 'Queued'}
                      </div>
                    </div>
                    <Link
                      href="/calendar"
                      className="autoshort-action-btn"
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.06)'
              }}>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 8px' }}>
                  Nothing scheduled yet.
                </p>
                <Link
                  href="/calendar"
                  className="autoshort-action-btn"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Schedule a Video
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          12. COMPLETED VIDEO PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {previewProject && (
        <div className="autoshort-modal-backdrop" onClick={() => setPreviewProject(null)} role="dialog" aria-modal="true" aria-label="Video Preview Modal">
          <div className="autoshort-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✓ Video Ready
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0' }}>
                  {previewProject.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProject(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
                aria-label="Close preview modal"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', background: '#000', maxHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewProject.output_url || previewProject.output_storage_key ? (
                <video
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '440px' }}
                  src={previewProject.output_url || `/api/assets/${encodeURIComponent(previewProject.output_storage_key)}`}
                >
                  Your browser does not support HTML5 video preview.
                </video>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#71717a' }}>
                  <span>Video rendering in progress. Storage key finalizing...</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {previewProject.output_url || previewProject.output_storage_key ? (
                  <a
                    href={previewProject.output_url || `/api/assets/${encodeURIComponent(previewProject.output_storage_key)}`}
                    download={`${previewProject.topic.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`}
                    className="autoshort-action-btn"
                  >
                    ⬇ Download MP4
                  </a>
                ) : null}

                <Link
                  href={`/content/${previewProject.id}`}
                  className="autoshort-action-btn"
                >
                  ✏️ Edit in Studio
                </Link>
              </div>

              <button
                type="button"
                onClick={() => handlePublishYouTube(previewProject)}
                className="autoshort-action-btn"
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700
                }}
              >
                ▶ Publish to YouTube
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
