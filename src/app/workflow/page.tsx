'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InteractiveWorkflowCanvas } from '@/components/InteractiveWorkflowCanvas';
import { useToast } from '@/components/Toast';

export default function WorkflowPage() {
  const toast = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [chanRes, projRes] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/projects'),
      ]);

      if (chanRes.ok) {
        const cData = await chanRes.json();
        setChannels(cData.channels || []);
        if (cData.channels?.length > 0) {
          setSelectedChannelId(cData.channels[0].id);
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (pData.projects?.length > 0) {
          setSelectedProjectId(pData.projects[0].id);
        }
      }
    } catch (e: any) {
      console.error('Failed to load workflow data:', e);
      toast.error('Failed to load workflow metadata');
    } finally {
      setLoading(false);
    }
  };

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              ⚡
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              Autonomous Workflow Engine
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Visual node architecture connecting your channel triggers, AI scripts, voiceover, visual clips, and YouTube publishing.
          </p>
        </div>

        {/* Quick Actions & Channel Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {channels.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Channel:</span>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#121215', color: '#fff' }}>
                    {c.name} ({c.niche})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/content/new"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span>+ Create New Video</span>
          </Link>
        </div>
      </div>

      {/* Main Interactive Workflow Canvas */}
      <InteractiveWorkflowCanvas
        mode={activeProject ? 'live' : 'simulation'}
        projectData={activeProject || (activeChannel ? { channel_niche: activeChannel.niche, channel_voice: activeChannel.voice } : undefined)}
        currentStage={activeProject?.current_stage || 'SCRIPT'}
        projectStatus={activeProject?.status || 'COMPLETED'}
        title={activeProject ? `Live Topology: ${activeProject.topic}` : 'Autonomous YouTube Production Graph'}
        subtitle="Click any node to inspect real parameters, payloads, models, and previews"
      />

      {/* Architecture Explainer Cards */}
      <div
        style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'rgba(18, 18, 21, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡ Trigger & Story Agent</div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
            Event-Driven Scheduling
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
            Incoming topics trigger the Autonomous Script Agent. It pulls channel retention rules and queries OpenRouter DeepSeek V3 / Gemini 3.8 to formulate high-hook, 5-scene narrative structures.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(18, 18, 21, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎙️ Parallel Tool Workers</div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
            Concurrent Asset Generation
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
            The orchestrator dispatches audio synthesis (ElevenLabs / EdgeTTS), visual clip generation (Flux 1 Schnell), and subtitle alignment concurrently to achieve high rendering throughput.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(18, 18, 21, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚀 FFmpeg & YouTube Release</div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
            Automated Muxing & Publishing
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
            FFmpeg compiles clips, audio, and captions into constant frame-rate 1080p MP4. The YouTube publisher uses your OAuth token to execute resumable uploads on schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
