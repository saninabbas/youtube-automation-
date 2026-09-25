'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface WorkflowNodeData {
  id: string;
  name: string;
  category: 'trigger' | 'agent' | 'model' | 'tool' | 'compositor' | 'publisher';
  icon: string;
  subtext: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  status: 'IDLE' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  itemCount?: string;
  inputs?: Array<{ label: string; type: string }>;
  outputs?: Array<{ label: string; type: string }>;
  config?: Record<string, string | number>;
  liveOutput?: {
    summary?: string;
    details?: string;
    audioUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, any>;
  };
}

export interface ConnectionWire {
  fromNode: string;
  toNode: string;
  fromPort?: 'right' | 'bottom';
  toPort?: 'left' | 'top';
  label?: string;
  isModelLink?: boolean;
}

interface InteractiveWorkflowCanvasProps {
  mode?: 'simulation' | 'live';
  projectData?: any;
  currentStage?: string;
  projectStatus?: string;
  onRetryStage?: (stageId: string) => void;
  title?: string;
  subtitle?: string;
}

const DEFAULT_PRESET_TOPICS = [
  'How Quantum Computers Break Encryption',
  '10 Stoic Habits That Changed My Life',
  'The Psychology of Money & Financial Freedom',
  'Secrets of Ancient Rome History Forgot',
];

export const InteractiveWorkflowCanvas: React.FC<InteractiveWorkflowCanvasProps> = ({
  mode = 'simulation',
  projectData,
  currentStage = 'SCRIPT',
  projectStatus = 'PROCESSING',
  onRetryStage,
  title,
  subtitle,
}) => {
  // Canvas viewport scale & panning
  const [zoomLevel, setZoomLevel] = useState<number>(0.8);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('agent');
  const [selectedTopic, setSelectedTopic] = useState<string>(
    projectData?.topic || DEFAULT_PRESET_TOPICS[0]
  );
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeSimulationStep, setActiveSimulationStep] = useState<number>(-1);
  const [logs, setLogs] = useState<Array<{ timestamp: string; node: string; message: string; type: 'info' | 'success' | 'warn' }>>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'steps'>('graph');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<'details' | 'logs'>('details');
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Auto-Fit: measures available width & height and scales/centers the 1520px graph
  const handleAutoFit = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    if (!containerWidth || containerWidth <= 0) return;

    // Content bounds: 1520px wide (nodes up to x=1460px + margins), 440px high
    const contentWidth = 1520;
    const contentHeight = 440;

    const horizontalMargin = containerWidth < 768 ? 24 : 64;
    const verticalMargin = 36;

    const scaleX = (containerWidth - horizontalMargin) / contentWidth;
    const scaleY = containerHeight > 100 ? (containerHeight - verticalMargin) / contentHeight : scaleX;

    // Fit smoothly to container
    let fitScale = Math.min(scaleX, scaleY > 0.35 ? scaleY : scaleX);
    fitScale = Math.max(0.35, Math.min(1.05, fitScale));
    fitScale = Number(fitScale.toFixed(2));

    setZoomLevel(fitScale);

    // Center the graph horizontally if container has room
    const scaledWidth = contentWidth * fitScale;
    const offsetX = containerWidth > scaledWidth ? Math.round((containerWidth - scaledWidth) / 2) : 12;
    const scaledHeight = contentHeight * fitScale;
    const offsetY = containerHeight > scaledHeight ? Math.round((containerHeight - scaledHeight) / 2) : 10;

    setPanOffset({ x: offsetX, y: offsetY });
  };

  // Auto-detect viewport and fit on mount and window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoFit();
    }, 60);

    const handleResize = () => {
      handleAutoFit();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close inspector on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspectorOpen) {
        setIsInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen]);

  // Initial node definitions with exact n8n canvas positions
  const getInitialNodes = (): WorkflowNodeData[] => [
    {
      id: 'trigger',
      name: 'When Topic Prompt Received',
      category: 'trigger',
      icon: '⚡',
      subtext: 'Channel Trigger • Webhook / Schedule',
      x: 30,
      y: 130,
      width: 220,
      height: 80,
      status: 'COMPLETED',
      itemCount: '1 prompt',
      inputs: [],
      outputs: [{ label: 'Topic Payload', type: 'json' }],
      config: {
        TriggerType: 'Instant Webhook / Topic Form',
        ChannelNiche: projectData?.channel_niche || 'Technology & Science',
        TargetDuration: `${projectData?.target_length_minutes || 2} min`,
        Language: projectData?.language || 'en',
      },
      liveOutput: {
        summary: `Triggered with topic: "${selectedTopic}"`,
        details: 'Dispatched event payload to Autonomous Orchestrator Agent.',
      },
    },
    {
      id: 'agent',
      name: 'AI Script & Story Agent',
      category: 'agent',
      icon: '🤖',
      subtext: 'Tools Agent • Autonomous Orchestration',
      x: 320,
      y: 120,
      width: 230,
      height: 96,
      status: 'COMPLETED',
      itemCount: '5 scenes',
      inputs: [{ label: 'Input Prompt', type: 'payload' }],
      outputs: [{ label: 'Scene Plan', type: 'story' }],
      config: {
        AgentType: 'Multi-Tool Script Orchestrator',
        LLMProvider: 'OpenRouter DeepSeek V3 / Gemini 3.8',
        RetentionFramework: 'High-Hook + Pacing + Call-to-Action',
        Format: 'Structured JSON Scene Array',
      },
      liveOutput: {
        summary: 'Generated narrative script with 5 visual scenes and viral hook.',
        details: projectData?.scenes
          ? projectData.scenes.map((s: any) => `Scene ${s.scene_index}: ${s.narration.slice(0, 70)}...`).join('\n')
          : 'Scene 1: Hook opening with dramatic visual prompt\nScene 2: Problem introduction & core question\nScene 3: Deep exploration & key insights\nScene 4: Climax & mind-bending takeaway\nScene 5: Call to action & channel subscribe',
      },
    },
    {
      id: 'model',
      name: 'OpenRouter DeepSeek V3',
      category: 'model',
      icon: '🧠',
      subtext: 'Chat Model • 671B MoE Parameters',
      x: 240,
      y: 280,
      width: 190,
      height: 72,
      status: 'COMPLETED',
      itemCount: '82 t/s',
      inputs: [],
      outputs: [{ label: 'Tokens', type: 'stream' }],
      config: {
        ModelID: 'deepseek/deepseek-chat',
        Temperature: 0.7,
        MaxTokens: 2048,
        Fallback: 'Google Gemini 3.8 Flash',
      },
      liveOutput: {
        summary: 'Streamed 480 tokens in 3.4 seconds without errors.',
      },
    },
    {
      id: 'memory',
      name: 'Channel Persona & Context',
      category: 'model',
      icon: '🗄️',
      subtext: 'Persistent Style Rules & Tone',
      x: 450,
      y: 280,
      width: 190,
      height: 72,
      status: 'COMPLETED',
      itemCount: 'Active',
      inputs: [],
      outputs: [{ label: 'Persona', type: 'context' }],
      config: {
        PersonaTone: 'Authoritative, engaging, cinematic',
        VocabularyFilter: 'Active verbs, no cliches',
        TargetAudience: 'YouTube Tech & Curiosity Seekers',
      },
      liveOutput: {
        summary: 'Applied channel visual tone and pacing guidelines.',
      },
    },
    {
      id: 'voice',
      name: 'Neural Voice Synth',
      category: 'tool',
      icon: '🎙️',
      subtext: 'ElevenLabs / EdgeTTS Studio Audio',
      x: 630,
      y: 20,
      width: 220,
      height: 80,
      status: 'COMPLETED',
      itemCount: '1 master audio',
      inputs: [{ label: 'Narration Script', type: 'text' }],
      outputs: [{ label: 'Audio Stream', type: 'audio' }],
      config: {
        VoiceName: projectData?.channel_voice || 'en-US-ChristopherNeural',
        SampleRate: '24kHz Studio Quality',
        Normalization: '-14 LUFS Broadcast Standard',
        InAppCloning: 'Supported (Live Mic / Upload)',
      },
      liveOutput: {
        summary: 'Synthesized 5 scene audio segments and merged into master narration track.',
        audioUrl: projectData?.id ? `/api/assets/voice/${projectData.id}/narration.mp3` : undefined,
      },
    },
    {
      id: 'visuals',
      name: 'Visuals & B-Roll Engine',
      category: 'tool',
      icon: '🎬',
      subtext: 'Cloudflare Flux 1 + Pexels 8K Clips',
      x: 630,
      y: 120,
      width: 220,
      height: 80,
      status: 'COMPLETED',
      itemCount: '5 clips',
      inputs: [{ label: 'Visual Prompts', type: 'array' }],
      outputs: [{ label: '1080p Video Clips', type: 'video' }],
      config: {
        Engine: 'Cloudflare Workers AI (Flux 1 Schnell)',
        Resolution: '1920x1080 Full HD',
        Motion: 'Dynamic Ken Burns Zoompan & Pan-Left',
        StockFallback: 'Pexels High-Definition Curated Clips',
      },
      liveOutput: {
        summary: '5 high-definition scene visuals generated with cinematic camera movements.',
      },
    },
    {
      id: 'subtitles',
      name: 'Subtitle Alignment',
      category: 'tool',
      icon: '📝',
      subtext: 'Karaoke-Style Timed SRT & VTT',
      x: 630,
      y: 220,
      width: 220,
      height: 80,
      status: 'COMPLETED',
      itemCount: 'SRT / VTT',
      inputs: [{ label: 'Audio Timings', type: 'timecodes' }],
      outputs: [{ label: 'Formatted Subtitles', type: 'captions' }],
      config: {
        Style: 'Yellow Glow Bold Centered Lower-Third',
        MaxWordsPerLine: 5,
        Format: 'WebVTT & SubRip (.srt)',
        DynamicColorGlow: 'Active',
      },
      liveOutput: {
        summary: 'Generated 42 timed caption cues aligned with speech boundaries.',
      },
    },
    {
      id: 'thumbnail',
      name: 'AI Thumbnail Studio',
      category: 'tool',
      icon: '🖼️',
      subtext: 'High-CTR 1280x720 Graphic Gen',
      x: 630,
      y: 320,
      width: 220,
      height: 80,
      status: 'COMPLETED',
      itemCount: '1 thumbnail',
      inputs: [{ label: 'Metadata & Title', type: 'text' }],
      outputs: [{ label: 'Thumbnail Image', type: 'image' }],
      config: {
        Aspect: '16:9 (1280x720)',
        Format: 'PNG (Lossless RGB)',
        Style: 'Cinematic High-Contrast YouTube Thumbnail',
      },
      liveOutput: {
        summary: 'High-CTR YouTube thumbnail composed with bold focal subject.',
        thumbnailUrl: projectData?.thumbnail?.url || undefined,
      },
    },
    {
      id: 'compositor',
      name: 'FFmpeg Compositor',
      category: 'compositor',
      icon: '🎞️',
      subtext: '1080p H.264 CFR Video Muxer',
      x: 930,
      y: 130,
      width: 230,
      height: 90,
      status: 'COMPLETED',
      itemCount: '1080p MP4',
      inputs: [
        { label: 'Video Clips', type: 'video' },
        { label: 'Master Audio', type: 'audio' },
        { label: 'Captions', type: 'srt' },
      ],
      outputs: [{ label: 'Final Master MP4', type: 'file' }],
      config: {
        Resolution: '1920x1080 (16:9)',
        VideoCodec: 'libx264 (Constant Frame Rate 30fps)',
        AudioCodec: 'aac (Stereo 192kbps)',
        Container: 'MP4 (FastStart Web-Optimized)',
      },
      liveOutput: {
        summary: 'Master MP4 rendered successfully with synchronized audio & video.',
        videoUrl: projectData?.output?.url || undefined,
      },
    },
    {
      id: 'publisher',
      name: 'YouTube Publisher',
      category: 'publisher',
      icon: '🚀',
      subtext: 'Data API v3 • Google OAuth 2.0',
      x: 1230,
      y: 130,
      width: 230,
      height: 90,
      status: 'COMPLETED',
      itemCount: 'Ready',
      inputs: [
        { label: 'Master MP4', type: 'file' },
        { label: 'Thumbnail', type: 'image' },
        { label: 'Title & Tags', type: 'metadata' },
      ],
      outputs: [{ label: 'YouTube URL', type: 'url' }],
      config: {
        API: 'YouTube Data API v3 (Resumable Upload)',
        Auth: 'Google OAuth 2.0 Token Vault',
        Scheduling: '30-Day Auto-Release Calendar',
        Visibility: 'Private / Unlisted / Public',
      },
      liveOutput: {
        summary: projectData?.publish_url
          ? `Live Video URL: ${projectData.publish_url}`
          : 'OAuth verified. Video staged for scheduled YouTube publication.',
      },
    },
  ];

  const [nodes, setNodes] = useState<WorkflowNodeData[]>(getInitialNodes());

  // Connection definitions (Bezier cables)
  const connections: ConnectionWire[] = [
    { fromNode: 'trigger', toNode: 'agent', label: '1 topic' },
    { fromNode: 'agent', toNode: 'model', fromPort: 'bottom', toPort: 'top', isModelLink: true, label: 'Chat Model' },
    { fromNode: 'agent', toNode: 'memory', fromPort: 'bottom', toPort: 'top', isModelLink: true, label: 'Tone Memory' },
    { fromNode: 'agent', toNode: 'voice', label: 'narration' },
    { fromNode: 'agent', toNode: 'visuals', label: 'visual prompts' },
    { fromNode: 'agent', toNode: 'subtitles', label: 'cues' },
    { fromNode: 'agent', toNode: 'thumbnail', label: 'title idea' },
    { fromNode: 'voice', toNode: 'compositor', label: 'audio.mp3' },
    { fromNode: 'visuals', toNode: 'compositor', label: 'clips[0..4]' },
    { fromNode: 'subtitles', toNode: 'compositor', label: 'captions.srt' },
    { fromNode: 'compositor', toNode: 'publisher', label: '1080p.mp4' },
    { fromNode: 'thumbnail', toNode: 'publisher', label: 'thumb.png' },
  ];

  // Helper to add timestamped logs
  const addLog = (nodeName: string, message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev.slice(-30), { timestamp: time, node: nodeName, message, type }]);
  };

  // Sync with real project data when in Live mode
  useEffect(() => {
    if (mode === 'live' && projectData) {
      const stageMap: Record<string, string> = {
        SCRIPT: 'agent',
        VOICE: 'voice',
        VIDEO: 'visuals',
        SUBTITLES: 'subtitles',
        FINAL_VIDEO: 'compositor',
        THUMBNAIL: 'thumbnail',
        PUBLISH: 'publisher',
      };

      const stageOrder = ['trigger', 'agent', 'voice', 'visuals', 'subtitles', 'thumbnail', 'compositor', 'publisher'];
      const activeNodeKey = stageMap[currentStage] || 'agent';
      const activeIdx = stageOrder.indexOf(activeNodeKey);

      setNodes((prev) =>
        prev.map((n) => {
          const nodeIdx = stageOrder.indexOf(n.id);
          if (projectStatus === 'FAILED' && n.id === activeNodeKey) {
            return { ...n, status: 'FAILED' };
          }
          if (projectStatus === 'COMPLETED' || nodeIdx < activeIdx) {
            return { ...n, status: 'COMPLETED' };
          }
          if (nodeIdx === activeIdx) {
            return { ...n, status: projectStatus === 'PROCESSING' ? 'RUNNING' : 'COMPLETED' };
          }
          return { ...n, status: 'QUEUED' };
        })
      );
    }
  }, [mode, projectData, currentStage, projectStatus]);

  // Initial simulation greeting log
  useEffect(() => {
    if (logs.length === 0) {
      addLog('System', 'Visual Workflow Engine initialized. Ready for execution.', 'info');
      addLog('Trigger', `Active topic: "${selectedTopic}"`, 'info');
    }
  }, []);

  // Auto-scroll logs drawer to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Interactive Simulation Runner (Step-by-Step Flow Animation)
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveSimulationStep(0);

    // Reset nodes to queued
    setNodes((prev) =>
      prev.map((n) => (n.id === 'trigger' ? { ...n, status: 'RUNNING' } : { ...n, status: 'QUEUED' }))
    );

    addLog('Pipeline', `▶ Starting Autonomous Simulation for: "${selectedTopic}"`, 'info');

    // Step sequence with realistic timings
    const steps = [
      {
        step: 0,
        nodeId: 'trigger',
        duration: 900,
        action: () => {
          addLog('Trigger', `[Webhook] Ingested user prompt: "${selectedTopic}"`, 'success');
          setNodes((prev) =>
            prev.map((n) =>
              n.id === 'trigger' ? { ...n, status: 'COMPLETED' } : n.id === 'agent' ? { ...n, status: 'RUNNING' } : n
            )
          );
        },
      },
      {
        step: 1,
        nodeId: 'agent',
        duration: 1400,
        action: () => {
          addLog('AI Agent', 'Calling OpenRouter DeepSeek V3 with viral retention system prompt...', 'info');
          addLog('DeepSeek', 'Streaming 5-scene breakdown: Hook, Premise, Twist, Breakdown, Call-to-Action.', 'info');
          addLog('AI Agent', '✓ Script generated (380 words). Dispatching parallel production jobs...', 'success');
          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === 'agent' || n.id === 'model' || n.id === 'memory') return { ...n, status: 'COMPLETED' };
              if (['voice', 'visuals', 'subtitles', 'thumbnail'].includes(n.id)) return { ...n, status: 'RUNNING' };
              return n;
            })
          );
        },
      },
      {
        step: 2,
        nodeId: 'parallel_tools',
        duration: 1800,
        action: () => {
          addLog('Voice Engine', 'ElevenLabs synthesized studio audio narration (-14 LUFS).', 'success');
          addLog('Visuals Engine', 'Cloudflare Flux 1 generated 5 continuous 1080p clips with Ken Burns camera zoom.', 'success');
          addLog('Captions', 'Subtitle aligner synchronized 42 karaoke-style dynamic cues (.srt & .vtt).', 'success');
          addLog('Thumbnail', 'High-CTR YouTube 1280x720 graphic generated with high contrast subject.', 'success');
          setNodes((prev) =>
            prev.map((n) => {
              if (['voice', 'visuals', 'subtitles', 'thumbnail'].includes(n.id)) return { ...n, status: 'COMPLETED' };
              if (n.id === 'compositor') return { ...n, status: 'RUNNING' };
              return n;
            })
          );
        },
      },
      {
        step: 3,
        nodeId: 'compositor',
        duration: 1300,
        action: () => {
          addLog('FFmpeg', 'Muxing H.264 CFR video stream + stereo AAC audio + burned subtitle cues...', 'info');
          addLog('FFmpeg', '✓ 1080p MP4 render complete (1920x1080 @ 30fps). File size: 18.4 MB.', 'success');
          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === 'compositor') return { ...n, status: 'COMPLETED' };
              if (n.id === 'publisher') return { ...n, status: 'RUNNING' };
              return n;
            })
          );
        },
      },
      {
        step: 4,
        nodeId: 'publisher',
        duration: 1100,
        action: () => {
          addLog('YouTube Publisher', 'Verifying Google OAuth 2.0 access token...', 'info');
          addLog('YouTube Publisher', 'Uploading 1080p MP4 via Resumable Upload API endpoint...', 'info');
          addLog('YouTube Publisher', '✓ Staged to YouTube Studio! Privacy: UNLISTED | Ready for release.', 'success');
          setNodes((prev) =>
            prev.map((n) => (n.id === 'publisher' ? { ...n, status: 'COMPLETED' } : n))
          );
          setIsSimulating(false);
          setActiveSimulationStep(-1);
          addLog('Pipeline', '🎉 Complete Autonomous Workflow Cycle finished with 100% success!', 'success');
        },
      },
    ];

    let currentDelay = 0;
    steps.forEach((s) => {
      currentDelay += s.duration;
      setTimeout(() => {
        s.action();
        setActiveSimulationStep(s.step);
      }, currentDelay);
    });
  };

  const handleSelectPresetTopic = (topic: string) => {
    setSelectedTopic(topic);
    addLog('Topic Input', `Switched topic preset to: "${topic}"`, 'info');
  };

  const handleApplyCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopicInput.trim()) {
      setSelectedTopic(customTopicInput.trim());
      addLog('Topic Input', `Custom topic loaded: "${customTopicInput.trim()}"`, 'info');
      setCustomTopicInput('');
    }
  };

  // Helper to calculate exact port coordinates for SVG bezier wires
  const getNodePortPos = (nodeId: string, port: 'left' | 'right' | 'top' | 'bottom') => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const w = node.width || 220;
    const h = node.height || 80;

    switch (port) {
      case 'left':
        return { x: node.x, y: node.y + h / 2 };
      case 'right':
        return { x: node.x + w, y: node.y + h / 2 };
      case 'top':
        return { x: node.x + w / 2, y: node.y };
      case 'bottom':
        return { x: node.x + w / 2, y: node.y + h };
    }
  };

  // Canvas Mouse & Touch Drag-to-Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.workflow-interactive-node') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('.workflow-floating-controls')
    ) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: Math.round(dragStartRef.current.initialPanX + dx),
      y: Math.round(dragStartRef.current.initialPanY + dy),
    });
  };

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (
        target.closest('.workflow-interactive-node') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('a') ||
        target.closest('.workflow-floating-controls')
      ) {
        return;
      }
      setIsDragging(true);
      dragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.startX;
    const dy = e.touches[0].clientY - dragStartRef.current.startY;
    setPanOffset({
      x: Math.round(dragStartRef.current.initialPanX + dx),
      y: Math.round(dragStartRef.current.initialPanY + dy),
    });
  };

  const handleTouchEnd = () => {
    if (isDragging) setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setZoomLevel((z) => Math.max(0.3, Math.min(1.5, Number((z + delta).toFixed(2)))));
    } else {
      setPanOffset((prev) => ({
        x: Math.round(prev.x - e.deltaX),
        y: Math.round(prev.y - e.deltaY),
      }));
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  return (
    <div
      style={{
        background: '#090d16',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        color: '#f4f4f5',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '520px',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP CANVAS TOOLBAR & CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)',
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>
                {title || 'Autonomous Workflow Engine'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: mode === 'simulation' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: mode === 'simulation' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: mode === 'simulation' ? '#38bdf8' : '#10b981',
                }}
              >
                {mode === 'simulation' ? 'Interactive Demo Mode' : 'Live Production Pipeline'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
              {subtitle || 'Visual node architecture connecting AI Scripting, Neural Voice, 1080p Clips, Subtitles & YouTube'}
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher: Flow Graph vs Pipeline Steps */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              style={{
                background: viewMode === 'graph' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: viewMode === 'graph' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                color: viewMode === 'graph' ? '#38bdf8' : '#94a3b8',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>☩</span>
              <span>Flow Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('steps')}
              style={{
                background: viewMode === 'steps' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: viewMode === 'steps' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                color: viewMode === 'steps' ? '#38bdf8' : '#94a3b8',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>☰</span>
              <span>Pipeline Steps</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.35, Number((z - 0.1).toFixed(2))))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              title="Zoom Out"
            >
              −
            </button>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', padding: '0 4px', minWidth: '42px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleAutoFit}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: 'none',
                color: '#38bdf8',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0 4px 4px 0',
              }}
              title="Fit all nodes to view"
            >
              Fit View
            </button>
            <button
              type="button"
              onClick={() => { setZoomLevel(1); setPanOffset({ x: 20, y: 10 }); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                padding: '4px 6px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
              title="100% Scale"
            >
              100%
            </button>
          </div>

          {/* Test Workflow Action Button */}
          {mode === 'simulation' ? (
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              style={{
                background: isSimulating
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isSimulating ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSimulating
                  ? '0 0 20px rgba(245, 158, 11, 0.4)'
                  : '0 0 20px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '14px' }}>{isSimulating ? '⏳' : '⚡'}</span>
              <span>{isSimulating ? 'Executing Workflow...' : 'Test Workflow'}</span>
            </button>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#10b981',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Live Engine Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SIMULATION TOPIC PROMPT BAR (Landing Page Mode)
      ───────────────────────────────────────────────────────────── */}
      {mode === 'simulation' && (
        <div
          className="workflow-sample-topics-bar"
          style={{
            padding: '10px 20px',
            background: 'rgba(10, 15, 26, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            position: 'relative',
            zIndex: 15,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sample Topics:
            </span>
            {DEFAULT_PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSelectPresetTopic(topic)}
                style={{
                  background: selectedTopic === topic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedTopic === topic ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: selectedTopic === topic ? '#34d399' : '#cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {topic}
              </button>
            ))}
          </div>

          <form onSubmit={handleApplyCustomTopic} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              placeholder="Or type custom topic..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '5px 10px',
                color: '#fff',
                fontSize: '11px',
                outline: 'none',
                width: '180px',
              }}
            />
            <button
              type="submit"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '5px 10px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Set
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN INTERACTIVE 2D NODE CANVAS (Pan & Zoom Responsive)
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="workflow-canvas-scroll-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          flex: 1,
          height: 'calc(100vh - 140px)',
          minHeight: '520px',
          overflow: 'hidden',
          background: '#07090e',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {viewMode === 'graph' ? (
          <>
            <div
              style={{
                position: 'absolute',
            left: 0,
            top: 0,
            width: '1520px',
            height: '460px',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            pointerEvents: 'auto',
          }}
        >
          {/* SVG LAYER: Connecting Bezier Curved Cables */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <defs>
              <linearGradient id="activeCableGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="cableGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connections.map((c, idx) => {
              const fromPos = getNodePortPos(c.fromNode, c.fromPort || 'right');
              const toPos = getNodePortPos(c.toNode, c.toPort || 'left');

              const sourceNode = nodes.find((n) => n.id === c.fromNode);
              const targetNode = nodes.find((n) => n.id === c.toNode);

              const isActive =
                sourceNode?.status === 'RUNNING' ||
                (sourceNode?.status === 'COMPLETED' && targetNode?.status === 'RUNNING');
              const isCompleted = sourceNode?.status === 'COMPLETED' && targetNode?.status === 'COMPLETED';

              // Cubic bezier control points
              let d = '';
              if (c.fromPort === 'bottom' && c.toPort === 'top') {
                const dy = (toPos.y - fromPos.y) / 2;
                d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x} ${fromPos.y + dy}, ${toPos.x} ${toPos.y - dy}, ${toPos.x} ${toPos.y}`;
              } else {
                const dx = Math.abs(toPos.x - fromPos.x) * 0.45;
                d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + dx} ${fromPos.y}, ${toPos.x - dx} ${toPos.y}, ${toPos.x} ${toPos.y}`;
              }

              // Cable styling
              let strokeColor = 'rgba(255, 255, 255, 0.12)';
              let strokeWidth = 2;
              let isDashed = c.isModelLink;

              if (isActive) {
                strokeColor = '#10b981';
                strokeWidth = 2.8;
              } else if (isCompleted) {
                strokeColor = '#059669';
                strokeWidth = 2;
              }

              const midX = (fromPos.x + toPos.x) / 2;
              const midY = (fromPos.y + toPos.y) / 2;

              return (
                <g key={`${c.fromNode}-${c.toNode}-${idx}`}>
                  {/* Outer Glow for Active Cables */}
                  {isActive && (
                    <path
                      d={d}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={6}
                      opacity={0.35}
                      filter="url(#cableGlow)"
                    />
                  )}

                  {/* Main Bezier Cable */}
                  <path
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isActive ? '6, 6' : isDashed ? '4, 4' : undefined}
                    style={{
                      animation: isActive ? 'cablePulse 1.2s linear infinite' : undefined,
                    }}
                  />

                  {/* Wire Label Pill */}
                  {c.label && !c.isModelLink && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-30"
                        y="-9"
                        width="60"
                        height="18"
                        rx="9"
                        fill="#0f172a"
                        stroke={isActive ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={isActive ? '#34d399' : '#94a3b8'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {c.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* RENDER WORKFLOW NODES */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            let statusBadgeBg = 'rgba(255, 255, 255, 0.05)';
            let statusBadgeBorder = 'rgba(255, 255, 255, 0.1)';
            let statusBadgeText = '#94a3b8';
            let cardGlow = 'none';

            if (node.status === 'COMPLETED') {
              statusBadgeBg = 'rgba(16, 185, 129, 0.15)';
              statusBadgeBorder = 'rgba(16, 185, 129, 0.4)';
              statusBadgeText = '#34d399';
            } else if (node.status === 'RUNNING') {
              statusBadgeBg = 'rgba(245, 158, 11, 0.2)';
              statusBadgeBorder = '#f59e0b';
              statusBadgeText = '#fbbf24';
              cardGlow = '0 0 25px rgba(245, 158, 11, 0.35)';
            } else if (node.status === 'FAILED') {
              statusBadgeBg = 'rgba(239, 68, 68, 0.2)';
              statusBadgeBorder = '#ef4444';
              statusBadgeText = '#f87171';
              cardGlow = '0 0 25px rgba(239, 68, 68, 0.4)';
            }

            const isModelOrMemory = node.category === 'model';

            return (
              <div
                key={node.id}
                className="workflow-interactive-node"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  setIsInspectorOpen(true);
                }}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width || 220}px`,
                  minHeight: `${node.height || 80}px`,
                  background: isModelOrMemory
                    ? 'rgba(17, 24, 39, 0.95)'
                    : 'rgba(15, 23, 42, 0.95)',
                  border: isSelected
                    ? '1.5px solid #38bdf8'
                    : node.status === 'RUNNING'
                    ? '1.5px solid #f59e0b'
                    : node.status === 'FAILED'
                    ? '1.5px solid #ef4444'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: isModelOrMemory ? '20px' : '12px',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(56, 189, 248, 0.45)'
                    : cardGlow !== 'none'
                    ? cardGlow
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Left Input Port Dot */}
                {node.category !== 'trigger' && !isModelOrMemory && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#090d16',
                      border: '2px solid #38bdf8',
                      boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)',
                    }}
                    title="Input Port"
                  />
                )}

                {/* Right Output Port Dot */}
                {node.category !== 'publisher' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#090d16',
                      border: '2px solid #10b981',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                    }}
                    title="Output Port"
                  />
                )}

                {/* Top Input for Models */}
                {isModelOrMemory && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#090d16',
                      border: '2px solid #c084fc',
                    }}
                  />
                )}

                {/* Node Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{node.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                      {node.name}
                    </span>
                  </div>

                  {/* Status Indicator Pill */}
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: statusBadgeBg,
                      border: `1px solid ${statusBadgeBorder}`,
                      color: statusBadgeText,
                      fontFamily: 'monospace',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {node.status === 'COMPLETED' && '✓'}
                    {node.status === 'RUNNING' && '⚡'}
                    {node.status === 'FAILED' && '✕'}
                    <span>{node.status}</span>
                  </span>
                </div>

                {/* Node Subtext */}
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.3 }}>
                  {node.subtext}
                </div>

                {/* Output Count Badge */}
                {node.itemCount && (
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '6px',
                      fontSize: '10px',
                      color: '#cbd5e1',
                    }}
                  >
                    <span style={{ color: '#64748b', fontSize: '9px', textTransform: 'uppercase' }}>Payload:</span>
                    <span style={{ fontWeight: 600, color: '#38bdf8', fontFamily: 'monospace' }}>{node.itemCount}</span>
                  </div>
                )}

                {/* Failed Node Retry Button */}
                {node.status === 'FAILED' && onRetryStage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryStage(node.id);
                    }}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Retry Node
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Canvas Controls (Bottom-Right corner to never collide with extensions/overlays) */}
        <div
          className="workflow-floating-controls"
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '12px',
            padding: '6px 10px',
            zIndex: 35,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            title={isInspectorOpen ? 'Close Inspector Drawer' : 'Open Inspector & Logs Drawer'}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: isInspectorOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: isInspectorOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isInspectorOpen ? '#38bdf8' : '#e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span>📋</span>
            <span>Inspector</span>
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)' }} />

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.35, Number((z - 0.1).toFixed(2))))}
            title="Zoom out (−)"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            −
          </button>

          <span
            onClick={handleAutoFit}
            title="Click to reset zoom"
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontFamily: 'monospace',
              minWidth: '40px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
            title="Zoom in (+)"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            +
          </button>

          <button
            type="button"
            onClick={handleAutoFit}
            title="Auto fit all 10 nodes to screen"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⛶</span>
            <span>Fit</span>
          </button>
        </div>
      </>
    ) : (
      /* ─────────────────────────────────────────────────────────────
         PIPELINE STEPS VIEW (Linear, 100% Mobile & Laptop Friendly)
      ───────────────────────────────────────────────────────────── */
      <div
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Linear Execution Pipeline ({nodes.length} Stages)
          </div>
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Open Inspector 📋
          </button>
        </div>

        {nodes.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          let statusColor = '#94a3b8';
          let statusBg = 'rgba(255, 255, 255, 0.05)';
          let statusBorder = 'rgba(255, 255, 255, 0.1)';

          if (node.status === 'COMPLETED') {
            statusColor = '#34d399';
            statusBg = 'rgba(16, 185, 129, 0.12)';
            statusBorder = '#10b981';
          } else if (node.status === 'RUNNING') {
            statusColor = '#fbbf24';
            statusBg = 'rgba(245, 158, 11, 0.15)';
            statusBorder = '#f59e0b';
          } else if (node.status === 'FAILED') {
            statusColor = '#f87171';
            statusBg = 'rgba(239, 68, 68, 0.15)';
            statusBorder = '#ef4444';
          }

          return (
            <div
              key={node.id}
              onClick={() => {
                setSelectedNodeId(node.id);
                setIsInspectorOpen(true);
              }}
              style={{
                background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                  }}
                >
                  #{index + 1}
                </span>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{node.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {node.subtext}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {node.itemCount && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {node.itemCount}
                  </span>
                )}

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: statusBg,
                    border: `1px solid ${statusBorder}`,
                    color: statusColor,
                    fontFamily: 'monospace',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {node.status === 'COMPLETED' && '✓'}
                  {node.status === 'RUNNING' && '⚡'}
                  {node.status === 'FAILED' && '✕'}
                  <span>{node.status}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                    setIsInspectorOpen(true);
                  }}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Inspect →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* ─────────────────────────────────────────────────────────────
        SLIDE-OVER NODE INSPECTOR & TELEMETRY DRAWER (DOCKED RIGHT)
    ───────────────────────────────────────────────────────────── */}
    {isInspectorOpen && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 94vw)',
          background: 'rgba(11, 15, 25, 0.98)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '-12px 0 45px rgba(0, 0, 0, 0.75)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.75)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{selectedNode.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {selectedNode.name}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ID: {selectedNode.id} • Category: {selectedNode.category}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInspectorOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close Inspector (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Inspector Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0 16px',
          }}
        >
          <button
            type="button"
            onClick={() => setInspectorTab('details')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: inspectorTab === 'details' ? '2px solid #38bdf8' : '2px solid transparent',
              color: inspectorTab === 'details' ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Config & Payloads
          </button>
          <button
            type="button"
            onClick={() => setInspectorTab('logs')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: inspectorTab === 'logs' ? '2px solid #38bdf8' : '2px solid transparent',
              color: inspectorTab === 'logs' ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Live Logs</span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
              }}
            >
              {logs.length}
            </span>
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {inspectorTab === 'details' ? (
            <>
              {/* Status Banner */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Current State</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
                    {selectedNode.status}
                  </div>
                </div>
                {selectedNode.itemCount && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Payload</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedNode.itemCount}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Stage Summary
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {selectedNode.liveOutput?.summary || selectedNode.subtext}
                </div>
              </div>

              {/* Config parameters */}
              {selectedNode.config && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Configuration Parameters
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {Object.entries(selectedNode.config).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '11px' }}>
                        <span style={{ color: '#64748b' }}>{k}: </span>
                        <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media previews if available */}
              {selectedNode.liveOutput?.audioUrl && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Audible Narration Preview
                  </div>
                  <audio controls src={selectedNode.liveOutput.audioUrl} style={{ width: '100%', height: '32px' }} />
                </div>
              )}

              {selectedNode.liveOutput?.thumbnailUrl && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Generated Thumbnail
                  </div>
                  <img
                    src={selectedNode.liveOutput.thumbnailUrl}
                    alt="Thumbnail"
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}

              {selectedNode.liveOutput?.videoUrl && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Rendered Video Output
                  </div>
                  <a
                    href={selectedNode.liveOutput.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#10b981',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <span>▶ Play Rendered 1080p MP4</span>
                  </a>
                </div>
              )}

              {selectedNode.liveOutput?.details && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Raw Output Payload
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {selectedNode.liveOutput.details}
                  </pre>
                </div>
              )}

              {selectedNode.status === 'FAILED' && onRetryStage && (
                <button
                  type="button"
                  onClick={() => onRetryStage(selectedNode.id)}
                  style={{
                    marginTop: '10px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  🔄 Retry This Failed Node
                </button>
              )}
            </>
          ) : (
            /* Logs Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                Session: autora-{selectedTopic.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '')}
              </div>
              {logs.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', padding: '20px 0', textAlign: 'center' }}>
                  No logs generated yet. Click &quot;Test Workflow&quot; to run simulation.
                </div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span
                        style={{
                          color: log.type === 'success' ? '#34d399' : log.type === 'warn' ? '#fbbf24' : '#38bdf8',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        [{log.node}]
                      </span>
                      <span style={{ color: '#64748b', fontFamily: 'monospace' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-word', marginTop: '2px' }}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    )}
  </div>

      {/* Embedded CSS for Cable Pulse Animation & Drawer Slide */}
      <style jsx global>{`
        @keyframes cablePulse {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
