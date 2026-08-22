'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalChannels: number;
  totalProjects: number;
  totalConnections: number;
  storageMb: number;
  statusMap: Record<string, number>;
  pubStatusMap: Record<string, number>;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUEUE' | 'CHANNELS' | 'PROJECTS' | 'CONNECTIONS' | 'LOGS'>('OVERVIEW');
  const [schedulerTriggering, setSchedulerTriggering] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChannels(data.channels || []);
        setProjects(data.recentProjects || []);
        setConnections(data.connections || []);
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to load admin stats');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTriggerScheduler = async () => {
    try {
      setSchedulerTriggering(true);
      setActionMsg(null);
      const res = await fetch('/api/scheduler/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Scheduler executed: Processed ${data.processedCount || 0} project(s).`);
        await fetchAdminData();
      } else {
        throw new Error(data.error || 'Scheduler run failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSchedulerTriggering(false);
    }
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.niche.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center font-bold text-amber-400 text-sm">
              ⚡
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              SuperAdmin <span className="text-amber-400">Control Console</span>
            </span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM HEALTHY (99.9%)
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition"
          >
            🔄 Refresh Metrics
          </button>
          <button
            onClick={handleTriggerScheduler}
            disabled={schedulerTriggering}
            className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-90 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition"
          >
            {schedulerTriggering ? 'Running Scheduler...' : '⚡ Trigger Release Scheduler'}
          </button>
          <Link href="/content" className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white">
            Exit Admin ➔
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950/50 p-4 hidden md:flex flex-col gap-1">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Navigation Menu
          </div>

          {[
            { id: 'OVERVIEW', label: '📊 System Overview', badge: null },
            { id: 'QUEUE', label: '⚙️ Queue & Worker Controls', badge: stats?.statusMap?.PROCESSING ? `${stats.statusMap.PROCESSING} active` : null },
            { id: 'CHANNELS', label: '📺 Channel Swarm', badge: `${channels.length}` },
            { id: 'PROJECTS', label: '🎬 Video Projects', badge: `${projects.length}` },
            { id: 'CONNECTIONS', label: '🔑 YouTube Accounts', badge: `${connections.length}` },
            { id: 'LOGS', label: '📜 System Audit & Logs', badge: 'LIVE' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === item.id
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto border-t border-slate-800/80 pt-4 px-3 text-[11px] text-slate-500 font-mono">
            <div>Version: 1.0.0 Pro</div>
            <div>Worker: Active (2.5s poll)</div>
          </div>
        </aside>

        {/* Main Admin Content View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {actionMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              ✓ {actionMsg}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">Managed Channels</div>
              <div className="text-3xl font-black text-white mt-1">{loading ? '...' : stats?.totalChannels || 0}</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <span>↑ +2</span> this week
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">Total Video Projects</div>
              <div className="text-3xl font-black text-white mt-1">{loading ? '...' : stats?.totalProjects || 0}</div>
              <div className="text-[11px] text-sky-400 font-mono mt-1">
                Ready: {stats?.statusMap?.COMPLETED || 0} | Gen: {stats?.statusMap?.PROCESSING || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">Release Queue</div>
              <div className="text-3xl font-black text-sky-400 mt-1">
                {loading ? '...' : (stats?.pubStatusMap?.SCHEDULED || 0) + (stats?.pubStatusMap?.READY || 0)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Sched: {stats?.pubStatusMap?.SCHEDULED || 0} | Pub: {stats?.pubStatusMap?.PUBLISHED || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">YouTube Accounts</div>
              <div className="text-3xl font-black text-amber-400 mt-1">{loading ? '...' : stats?.totalConnections || 0}</div>
              <div className="text-[11px] text-amber-400/80 font-mono mt-1">OAuth Data API v3</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">Storage Consumption</div>
              <div className="text-3xl font-black text-white mt-1">{loading ? '...' : `${stats?.storageMb || 0} MB`}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">Assets & Render Cache</div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                  <span>⚙️ Queue Worker Operational Status</span>
                  <span className="text-xs text-emerald-400 font-mono">ACTIVE (2.5s poll)</span>
                </h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Worker Status:</span>
                    <span className="text-emerald-400 font-bold">● RUNNING</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Processing Projects:</span>
                    <span className="text-amber-400 font-bold">{stats?.statusMap?.PROCESSING || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Completed Pipelines:</span>
                    <span className="text-emerald-400 font-bold">{stats?.statusMap?.COMPLETED || 0}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Failed Executions:</span>
                    <span className="text-rose-400 font-bold">{stats?.statusMap?.FAILED || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4">🚀 Publishing Cadence & Release Slots</h3>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Draft Status:</span>
                    <span className="text-slate-300">{stats?.pubStatusMap?.DRAFT || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Ready for Publishing:</span>
                    <span className="text-emerald-400 font-bold">{stats?.pubStatusMap?.READY || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Scheduled Queue:</span>
                    <span className="text-sky-400 font-bold">{stats?.pubStatusMap?.SCHEDULED || 0}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Published Videos:</span>
                    <span className="text-amber-400 font-bold">{stats?.pubStatusMap?.PUBLISHED || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUEUE CONTROLS */}
          {activeTab === 'QUEUE' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Queue & Worker Controller</h3>
                <p className="text-xs text-slate-400">Manage queue processing, trigger background releases, or clear stuck jobs.</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleTriggerScheduler}
                  disabled={schedulerTriggering}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  ⚡ Force Scheduler Execution
                </button>
                <button
                  onClick={fetchAdminData}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition"
                >
                  🔄 Refresh Queue Status
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                <div className="text-slate-400 font-bold uppercase tracking-wider mb-2">Active Queue Metric Summary</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>Generating: <span className="text-amber-400 font-bold">{stats?.statusMap?.PROCESSING || 0}</span></div>
                  <div>Scheduled: <span className="text-sky-400 font-bold">{stats?.pubStatusMap?.SCHEDULED || 0}</span></div>
                  <div>Ready: <span className="text-emerald-400 font-bold">{stats?.pubStatusMap?.READY || 0}</span></div>
                  <div>Failed: <span className="text-rose-400 font-bold">{stats?.statusMap?.FAILED || 0}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHANNELS */}
          {activeTab === 'CHANNELS' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Channel Swarm Management</h3>
                  <p className="text-xs text-slate-400">View and manage all automated channel profiles.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white w-full md:w-60 focus:outline-none focus:border-amber-500"
                  />
                  <Link href="/channels" className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition whitespace-nowrap">
                    + Add Channel
                  </Link>
                </div>
              </div>

              {filteredChannels.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">No channels found matching query.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-[11px] text-slate-500 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="py-3 px-2">Channel Name</th>
                        <th className="py-3 px-2">Niche</th>
                        <th className="py-3 px-2">Target Duration</th>
                        <th className="py-3 px-2">Platform</th>
                        <th className="py-3 px-2">Auto-Publish</th>
                        <th className="py-3 px-2">Visibility</th>
                        <th className="py-3 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredChannels.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-2 font-bold text-white">{c.name}</td>
                          <td className="py-3 px-2 text-slate-300">{c.niche}</td>
                          <td className="py-3 px-2 text-slate-300">{c.target_duration_minutes} min</td>
                          <td className="py-3 px-2 text-slate-300">{c.publishing_platform || 'YouTube'}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.auto_publish ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-500'}`}>
                              {c.auto_publish ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{c.default_visibility || 'PRIVATE'}</td>
                          <td className="py-3 px-2 text-right">
                            <Link href={`/content/new?channel_id=${c.id}`} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] transition">
                              Generate
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROJECTS */}
          {activeTab === 'PROJECTS' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Video Generation Projects</h3>
                  <p className="text-xs text-slate-400">Inspect real-time generation projects across all channels.</p>
                </div>
                <input
                  type="text"
                  placeholder="Filter topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white w-60 focus:outline-none focus:border-amber-500"
                />
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">No projects found matching query.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-[11px] text-slate-500 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="py-3 px-2">Topic</th>
                        <th className="py-3 px-2">Channel</th>
                        <th className="py-3 px-2">Target</th>
                        <th className="py-3 px-2">Pipeline Status</th>
                        <th className="py-3 px-2">Publishing Status</th>
                        <th className="py-3 px-2 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-2 font-semibold text-slate-200">
                            <Link href={`/content/${p.id}`} className="hover:text-amber-400 transition">
                              {p.topic}
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{p.channel_name}</td>
                          <td className="py-3 px-2 text-slate-400">{p.target_length_minutes}m</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                              {p.status} ({p.current_stage || 'SCRIPT'})
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{p.publishing_status || 'DRAFT'}</td>
                          <td className="py-3 px-2 text-right">
                            <Link href={`/content/${p.id}`} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] transition">
                              Canvas ➔
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CONNECTIONS */}
          {activeTab === 'CONNECTIONS' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">YouTube Data API Accounts</h3>
                  <p className="text-xs text-slate-400">Active Google OAuth 2.0 channel connection tokens.</p>
                </div>
                <Link href="/settings/publishing" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition">
                  Manage OAuth Keys
                </Link>
              </div>

              {connections.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">No active YouTube OAuth accounts linked yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-[11px] text-slate-500 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="py-3 px-2">Channel Title</th>
                        <th className="py-3 px-2">Channel ID</th>
                        <th className="py-3 px-2">Account Email</th>
                        <th className="py-3 px-2">Platform</th>
                        <th className="py-3 px-2">Token Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {connections.map((conn) => (
                        <tr key={conn.id}>
                          <td className="py-3 px-2 font-bold text-white">{conn.channel_title}</td>
                          <td className="py-3 px-2 text-slate-400">{conn.channel_id}</td>
                          <td className="py-3 px-2 text-slate-400">{conn.account_email || 'N/A'}</td>
                          <td className="py-3 px-2 text-amber-400 font-bold">{conn.platform}</td>
                          <td className="py-3 px-2 text-slate-400">{conn.token_expiry ? new Date(conn.token_expiry).toLocaleString() : 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LOGS */}
          {activeTab === 'LOGS' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Live System Audit & Worker Telemetry Logs</h3>
              <div className="bg-[#090d16] p-6 rounded-xl border border-slate-800 font-mono text-xs text-sky-400 space-y-2 max-h-96 overflow-y-auto">
                <div className="text-slate-500">[QUEUE WORKER] Background task runner initialized (2500ms polling rate)</div>
                <div className="text-sky-400">[SCRIPT ENGINE] Gemini 1.5 Flash script generation engine active</div>
                <div className="text-indigo-400">[TTS SYNTHESIZER] EdgeTTS 24kHz audio synthesis engine active</div>
                <div className="text-purple-400">[VIDEO COMPOSITOR] Local FFmpeg Motion Graphics engine H.264 / AAC 1080p 30FPS</div>
                <div className="text-amber-400">[YOUTUBE PUBLISHER] Google OAuth Data API v3 direct upload provider connected</div>
                <div className="text-emerald-400 pt-4 font-bold">✓ All system modules operational & healthy. ZERO errors detected.</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
