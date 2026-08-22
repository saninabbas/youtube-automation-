'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SaaSLandingPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedWorkflowNode, setSelectedWorkflowNode] = useState<number | null>(1);

  const workflowSteps = [
    { id: 1, title: 'Topic Input', icon: '🎯', desc: 'Select niche, channel & duration', detail: 'Defines target video length (1m/3m/5m/8m/10m) & visual rules.' },
    { id: 2, title: 'AI Scripting', icon: '🧠', desc: 'Gemini 1.5 Flash narration', detail: 'Generates structured script, hook, core sections, CTA & word count.' },
    { id: 3, title: 'Neural Voice', icon: '🎙️', desc: '24kHz EdgeTTS audio synth', detail: 'Synthesizes natural voiceover audio with speed & pitch control.' },
    { id: 4, title: 'Scene Clips', icon: '🎬', desc: '8-sec visual motion clips', detail: 'Generates visual prompts, camera vectors & lighting continuity.' },
    { id: 5, title: 'Subtitles', icon: '📝', desc: 'Auto-aligned SRT & VTT', detail: 'Applies styled high-contrast yellow-glow bold caption alignment.' },
    { id: 6, title: 'FFmpeg Composition', icon: '🎞️', desc: '1080p H.264 rendering', detail: 'Composes video, audio stream, and subtitle burn-in at 30 FPS.' },
    { id: 7, title: '1280x720 Thumbnail', icon: '🖼️', desc: 'PNG thumbnail generator', detail: 'Creates custom visual thumbnail formatted for YouTube CTR.' },
    { id: 8, title: 'YouTube Upload', icon: '🚀', desc: 'Direct OAuth release', detail: 'Uploads video, sets thumbnail, chapters & schedules publication.' },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Radial Gradient Glow Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),rgba(255,255,255,0))] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />

      {/* Glassmorphism Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070a12]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Rankora <span className="text-sky-400">AI</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">Video Factory SaaS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-sky-400 transition-colors">Visual Workflow</a>
            <a href="#pricing" className="hover:text-sky-400 transition-colors">Pricing</a>
            <Link href="/channels" className="hover:text-sky-400 transition-colors">Channels</Link>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
              <span>⚡</span> Super Admin
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/content"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-xl hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/content/new"
              className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-indigo-400 hover:from-sky-300 hover:to-indigo-300 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] transition transform hover:-translate-y-0.5"
            >
              Launch Studio ➔
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/60 border border-sky-500/40 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          ✦ Autonomous AI Video Factory SaaS 2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Turn Any Topic Into <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Publish-Ready 1080p Videos</span> on Auto-Pilot
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          An end-to-end multi-channel video generation platform. From Gemini scriptwriting & neural voice synthesis to 8-second visual clips, mobile captions, graphic thumbnails, and direct YouTube publication.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/content/new"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold text-base rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] transition transform hover:-translate-y-0.5"
          >
            Start Video Generation 🚀
          </Link>
          <Link
            href="/content"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-base rounded-2xl border border-slate-700/80 transition"
          >
            Explore Live Dashboard ➔
          </Link>
        </div>

        {/* Live Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div>
            <div className="text-2xl md:text-3xl font-black text-white">100%</div>
            <div className="text-xs text-slate-400 font-mono mt-1">Autonomous Execution</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-sky-400">1m – 10m</div>
            <div className="text-xs text-slate-400 font-mono mt-1">Calibrated Target Duration</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-indigo-400">1920x1080</div>
            <div className="text-xs text-slate-400 font-mono mt-1">Full HD Video Resolution</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-emerald-400">YouTube v3</div>
            <div className="text-xs text-slate-400 font-mono mt-1">Direct OAuth Publisher</div>
          </div>
        </div>
      </section>

      {/* n8n-Style Interactive Workflow Section */}
      <section id="workflow" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-14">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">Visual Pipeline Engine</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
            n8n-Style Interactive Node Architecture
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
            Click any node below to inspect real-time execution parameters and stage payloads.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* Flow Nodes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
            {workflowSteps.map((step) => {
              const isActive = selectedWorkflowNode === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedWorkflowNode(step.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-sky-950/60 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{step.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Node Inspector Box */}
          {selectedWorkflowNode && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-start justify-between gap-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{workflowSteps[selectedWorkflowNode - 1].icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Node {selectedWorkflowNode}: {workflowSteps[selectedWorkflowNode - 1].title}
                    </h3>
                    <p className="text-xs text-sky-400 font-mono">{workflowSteps[selectedWorkflowNode - 1].desc}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                  {workflowSteps[selectedWorkflowNode - 1].detail}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 w-full md:w-80">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Node Specification</div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-bold">READY / OPTIMIZED</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Mode:</span>
                  <span className="text-sky-400 font-bold">AUTOMATIC</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Fallback:</span>
                  <span className="text-slate-300">ACTIVE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Capabilities Showcase */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-16">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Complete SaaS Platform</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
            Built for High-Yield Video Production
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
            Everything required to run automated YouTube channels, TikTok feeds, and Instagram Reels hands-free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-500/30 flex items-center justify-center text-2xl mb-6 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              🧠
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors mb-3">
              AI Scriptwriting Engine
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integrates Google Gemini 1.5 Flash and OpenAI GPT-4 to generate deep, niche-tailored scripts calibrated to exact spoken word count.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-2xl mb-6 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              🎙️
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-3">
              24kHz Neural Voice Synthesis
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              High-definition EdgeTTS voiceover generation with voice speed rate options, natural pitch, and intelligent fallback handling.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-2xl mb-6 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              🎬
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-3">
              Sequenced Motion Clips
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automates 8-second visual motion clips with camera movement vectors, lighting continuity, and external Runway/Replicate AI video integration.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-2xl mb-6 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              📝
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-3">
              Mobile Caption Styling
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Auto-aligned SRT & VTT subtitles styled in high-contrast yellow-glow bold font, burned in cleanly at 1080p resolution.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-2xl mb-6 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              🖼️
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors mb-3">
              1280x720 Graphic Thumbnails
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generates high-impact PNG thumbnails with channel branding motifs, topic headings, and 1-click visual regeneration.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/50 rounded-2xl p-8 backdrop-blur-xl transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-500/30 flex items-center justify-center text-2xl mb-6 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              🚀
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors mb-3">
              YouTube Data API Publisher
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Google OAuth 2.0 direct video uploading, thumbnail setting, chaptered description creation, and automated release scheduling.
            </p>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Tiers */}
      <section id="pricing" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">Transparent SaaS Pricing</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
            Scalable Production Plans
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
            Choose the video production tier tailored to your channel network volume.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl mt-6">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                billingCycle === 'MONTHLY' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                billingCycle === 'YEARLY' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly (20% OFF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Starter Creator</h3>
              <p className="text-xs text-slate-400 mb-6">Perfect for single channel creators getting started.</p>
              <div className="text-4xl font-black text-white mb-6">
                ${billingCycle === 'MONTHLY' ? '29' : '23'}{' '}
                <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 10 Videos / month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 1 YouTube Channel
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 1080p FFmpeg Compositor
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 1280x720 Graphic Thumbnails
                </li>
              </ul>
            </div>
            <Link
              href="/content/new"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl text-center transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan (Popular) */}
          <div className="bg-slate-900/90 border-2 border-sky-500 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.2)] relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-sky-500 text-slate-950 text-[10px] font-black tracking-wider uppercase rounded-full">
              MOST POPULAR
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro Automator</h3>
              <p className="text-xs text-slate-400 mb-6">For serious creators operating multi-channel networks.</p>
              <div className="text-4xl font-black text-white mb-6">
                ${billingCycle === 'MONTHLY' ? '79' : '63'}{' '}
                <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 50 Videos / month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 5 YouTube Channels
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Automated Release Scheduler
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> 8-Min Long-Form Calibration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Priority Render Queue
                </li>
              </ul>
            </div>
            <Link
              href="/content/new"
              className="w-full py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:opacity-90 text-slate-950 font-black text-xs rounded-xl text-center transition shadow-lg"
            >
              Start Pro Trial ➔
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Agency Swarm</h3>
              <p className="text-xs text-slate-400 mb-6">Unlimited video generation for enterprise agencies.</p>
              <div className="text-4xl font-black text-white mb-6">
                ${billingCycle === 'MONTHLY' ? '199' : '159'}{' '}
                <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Unlimited Video Generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Unlimited Channels
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> External Runway / Replicate Keys
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Super Admin Dashboard Access
                </li>
              </ul>
            </div>
            <Link
              href="/admin"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl text-center transition"
            >
              Access Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-12 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Rankora AI Video SaaS</span>
            <span>— Autonomous Video Automation</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-400">
            <Link href="/content" className="hover:text-white transition">Dashboard</Link>
            <Link href="/channels" className="hover:text-white transition">Channels</Link>
            <Link href="/calendar" className="hover:text-white transition">Calendar</Link>
            <Link href="/settings/publishing" className="hover:text-white transition">Settings</Link>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition">Super Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
